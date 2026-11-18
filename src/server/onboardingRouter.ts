import express, { type NextFunction, type Request, type Response, type Router } from 'express';
import type { AnyFormId, HrUserProfile } from '../shared/types.ts';
import { HttpError, type OnboardingDataStore } from './onboardingBackend.ts';
import { createRateLimiter } from './rateLimiter.ts';

interface AuthenticatedHrRequest extends Request {
  hrUser?: HrUserProfile;
}

export interface OnboardingRouterOptions {
  employeeRateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  adminRateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function wrapAsync(
  fn: (req: AuthenticatedHrRequest, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as AuthenticatedHrRequest, res, next).catch(next);
  };
}

export function createOnboardingApiRouter(
  getStore: () => OnboardingDataStore | null,
  options: OnboardingRouterOptions = {}
): Router {
  const router = express.Router();

  const employeeRateLimiter = createRateLimiter({
    windowMs: options.employeeRateLimit?.windowMs ?? 15 * 60 * 1000,
    maxRequests: options.employeeRateLimit?.maxRequests ?? 120,
    keyPrefix: 'onboard',
    message: 'Too many onboarding requests from this address. Please wait before retrying.',
  });

  const adminRateLimiter = createRateLimiter({
    windowMs: options.adminRateLimit?.windowMs ?? 15 * 60 * 1000,
    maxRequests: options.adminRateLimit?.maxRequests ?? 180,
    keyPrefix: 'admin',
    message: 'Too many HR API requests from this address. Please wait before retrying.',
  });

  const requireStore = (): OnboardingDataStore => {
    const store = getStore();
    if (!store) {
      throw new HttpError(
        503,
        'Supabase server credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are not configured yet.',
        'SUPABASE_NOT_CONFIGURED'
      );
    }
    return store;
  };

  const requireHrAuth = wrapAsync(async (req, _res, next) => {
    const bearer = getBearerToken(req);
    if (!bearer) {
      throw new HttpError(401, 'HR authentication token is required.', 'UNAUTHORIZED');
    }
    const store = requireStore();
    req.hrUser = await store.verifyHrBearerToken(bearer);
    next();
  });

  const requireHrRole = (...allowedRoles: Array<HrUserProfile['role']>) => {
    const allowed = new Set<HrUserProfile['role']>(allowedRoles);
    return (req: Request, _res: Response, next: NextFunction) => {
      const hrUser = (req as AuthenticatedHrRequest).hrUser;
      if (!hrUser) {
        next(new HttpError(401, 'HR authentication is required.', 'UNAUTHORIZED'));
        return;
      }
      if (!allowed.has(hrUser.role)) {
        next(
          new HttpError(
            403,
            'Access denied. This operation requires HR Administrator privileges.',
            'FORBIDDEN'
          )
        );
        return;
      }
      next();
    };
  };

  const requireHrAdminOnly = requireHrRole('hr_admin');
  const requireHrReader = requireHrRole('hr_admin', 'hr_reviewer');

  // Public catalog metadata (no personal data)
  router.get(
    '/forms',
    wrapAsync(async (_req, res) => {
      const store = getStore();
      if (!store) {
        const { HR_FORMS_CATALOG } = await import('../shared/formsCatalog.ts');
        res.json({ forms: HR_FORMS_CATALOG });
        return;
      }
      const forms = await store.listForms();
      res.json({ forms });
    })
  );

  // -------------------------------------------------------------------------
  // Protected HR Admin & Reviewer Routes (Rate Limited + JWT + Explicit Role)
  // -------------------------------------------------------------------------
  router.use('/admin', adminRateLimiter);

  router.get(
    '/admin/me',
    requireHrAuth,
    requireHrReader,
    wrapAsync(async (req, res) => {
      res.json({ hrUser: req.hrUser });
    })
  );

  router.get(
    '/admin/invitations',
    requireHrAuth,
    requireHrReader,
    wrapAsync(async (_req, res) => {
      const store = requireStore();
      const invitations = await store.listInvitations();
      res.json({ invitations });
    })
  );

  router.post(
    '/admin/invitations',
    requireHrAuth,
    requireHrAdminOnly,
    wrapAsync(async (req, res) => {
      const store = requireStore();
      const invitation = await store.createInvitation(req.hrUser!, req.body ?? {});
      res.status(201).json({ invitation });
    })
  );

  router.post(
    '/admin/invitations/:id/expire',
    requireHrAuth,
    requireHrAdminOnly,
    wrapAsync(async (req, res) => {
      const store = requireStore();
      const invitation = await store.expireInvitation(req.hrUser!, req.params.id);
      res.json({ invitation });
    })
  );

  router.get(
    '/admin/submissions',
    requireHrAuth,
    requireHrReader,
    wrapAsync(async (_req, res) => {
      const store = requireStore();
      const submissions = await store.listSubmissions();
      res.json({ submissions });
    })
  );

  router.get(
    '/admin/submissions/:invitationId',
    requireHrAuth,
    requireHrReader,
    wrapAsync(async (req, res) => {
      const store = requireStore();
      const detail = await store.getSubmissionDetail(req.params.invitationId);
      res.json({ detail });
    })
  );

  router.put(
    '/admin/submissions/:invitationId/office-use',
    requireHrAuth,
    requireHrAdminOnly,
    wrapAsync(async (req, res) => {
      const store = requireStore();
      const officeUse = await store.saveOfficeUseEntry(
        req.hrUser!,
        req.params.invitationId,
        req.body ?? {}
      );
      res.json({ officeUse });
    })
  );

  router.get(
    '/admin/documents/:documentId/download-url',
    requireHrAuth,
    requireHrAdminOnly,
    wrapAsync(async (req, res) => {
      const store = requireStore();
      const signed = await store.getAdminSignedDownloadUrl(req.hrUser!, req.params.documentId);
      res.json(signed);
    })
  );

  // -------------------------------------------------------------------------
  // Token-Scoped Employee Onboarding Routes (Rate Limited + Hash-Validated)
  // -------------------------------------------------------------------------
  router.use('/onboard', employeeRateLimiter);

  router.get(
    '/onboard/:token',
    wrapAsync(async (req, res) => {
      const store = requireStore();
      const hydration = await store.getSessionByToken(req.params.token);
      res.json(hydration);
    })
  );

  router.put(
    '/onboard/:token/forms/:formId',
    wrapAsync(async (req, res) => {
      const store = requireStore();
      const result = await store.saveFormResponse(
        req.params.token,
        req.params.formId as AnyFormId,
        req.body?.payload ?? req.body
      );
      res.json(result);
    })
  );

  router.put(
    '/onboard/:token/declaration',
    wrapAsync(async (req, res) => {
      const store = requireStore();
      const result = await store.saveFinalDeclaration(
        req.params.token,
        Boolean(req.body?.accepted)
      );
      res.json(result);
    })
  );

  router.post(
    '/onboard/:token/documents/upload-url',
    wrapAsync(async (req, res) => {
      const store = requireStore();
      const signed = await store.createSignedDocumentUploadUrl(req.params.token, req.body ?? {});
      res.json(signed);
    })
  );

  router.post(
    '/onboard/:token/documents',
    wrapAsync(async (req, res) => {
      const store = requireStore();
      const document = await store.recordUploadedDocument(req.params.token, req.body ?? {});
      res.status(201).json({ document });
    })
  );

  router.delete(
    '/onboard/:token/documents/:documentId',
    wrapAsync(async (req, res) => {
      const store = requireStore();
      await store.deleteUploadedDocument(req.params.token, req.params.documentId);
      res.json({ deleted: true });
    })
  );

  router.post(
    '/onboard/:token/submit',
    wrapAsync(async (req, res) => {
      const store = requireStore();
      const receipt = await store.submitOnboardingPacket(
        req.params.token,
        Boolean(req.body?.finalDeclarationAccepted)
      );
      res.json(receipt);
    })
  );

  // Return clean JSON 404 for unknown /api/* paths
  router.use((_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.', code: 'NOT_FOUND' });
  });

  // Centralized JSON error handler (never echoes bearer tokens or internal stack traces)
  router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code });
      return;
    }
    res.status(500).json({ error: 'Internal server error.', code: 'INTERNAL_ERROR' });
  });

  return router;
}
