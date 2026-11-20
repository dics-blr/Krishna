import JSZip from 'jszip';
import { PDFDocument, type PDFFont, type PDFImage, type PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { DICS_COMPANY_HEADER } from './formsCatalog.ts';
import type {
  AnyFormId,
  Form01BioData,
  Form02JoiningFormat,
  Form03Mediclaim,
  Form04Checklist,
  Form05EpfForm2,
  Form06EsicForm1,
  Form07Form25,
  Form08Form11,
  Form09GratuityFormF,
  HrOfficeUseEntry,
  HrSubmissionDetail,
  UploadedDocumentItem,
} from './types';

export interface OriginalFormPdfDescriptor {
  formId: AnyFormId;
  code: string;
  title: string;
  templateFile: string;
  templateAssetPath: string;
  outputFileName: string;
}

export const ORIGINAL_FORM_PDF_DESCRIPTORS: readonly OriginalFormPdfDescriptor[] = [
  {
    formId: 'form-01',
    code: 'DICS-HR-01',
    title: 'Bio-Data Form',
    templateFile: 'Bio_Data_Form_f28f2297.pdf',
    templateAssetPath: '/assets/aistudio/Bio_Data_Form_f28f2297.pdf',
    outputFileName: 'DICS-HR-01_Bio-Data_Form.pdf',
  },
  {
    formId: 'form-02',
    code: 'DICS-HR-02',
    title: 'Joining Format',
    templateFile: 'Joining_Format_5e5d1580.pdf',
    templateAssetPath: '/assets/aistudio/Joining_Format_5e5d1580.pdf',
    outputFileName: 'DICS-HR-02_Joining_Format.pdf',
  },
  {
    formId: 'form-03',
    code: 'DICS-HR-03',
    title: 'Mediclaim Declaration',
    templateFile: 'Mediclaim_Declaration_Form_0a909bd7.pdf',
    templateAssetPath: '/assets/aistudio/Mediclaim_Declaration_Form_0a909bd7.pdf',
    outputFileName: 'DICS-HR-03_Mediclaim_Declaration.pdf',
  },
  {
    formId: 'form-04',
    code: 'DICS-HR-04',
    title: 'Personal File Checklist',
    templateFile: 'Checklist_for_Personal_File_93c66120.pdf',
    templateAssetPath: '/assets/aistudio/Checklist_for_Personal_File_93c66120.pdf',
    outputFileName: 'DICS-HR-04_Personal_File_Checklist.pdf',
  },
  {
    formId: 'form-05',
    code: 'DICS-HR-05',
    title: 'EPF Form 2 (Revised)',
    templateFile: 'EPF_Nomination_Form_No_2_67fc70e1.pdf',
    templateAssetPath: '/assets/aistudio/EPF_Nomination_Form_No_2_67fc70e1.pdf',
    outputFileName: 'DICS-HR-05_EPF_Form_2.pdf',
  },
  {
    formId: 'form-06',
    code: 'DICS-HR-06',
    title: 'ESIC Declaration Form 1',
    templateFile: 'ESIC_Declaration_form_1_8ffddf93.pdf',
    templateAssetPath: '/assets/aistudio/ESIC_Declaration_form_1_8ffddf93.pdf',
    outputFileName: 'DICS-HR-06_ESIC_Declaration.pdf',
  },
  {
    formId: 'form-07',
    code: 'DICS-HR-07',
    title: 'Form No. 25 Nomination',
    templateFile: 'Form_No_25_dfb1d53b.pdf',
    templateAssetPath: '/assets/aistudio/Form_No_25_dfb1d53b.pdf',
    outputFileName: 'DICS-HR-07_Form_No_25_Nomination.pdf',
  },
  {
    formId: 'form-08',
    code: 'DICS-HR-08',
    title: 'EPF Form 11 (Revised)',
    templateFile: 'Form11_Revised_2cde3713.pdf',
    templateAssetPath: '/assets/aistudio/Form11_Revised_2cde3713.pdf',
    outputFileName: 'DICS-HR-08_EPF_Form_11.pdf',
  },
  {
    formId: 'form-09',
    code: 'DICS-HR-09',
    title: "Gratuity Form 'F'",
    templateFile: 'Gratuity_Act_Form-F-Nomination-Gratuity_8be40843.pdf',
    templateAssetPath: '/assets/aistudio/Gratuity_Act_Form-F-Nomination-Gratuity_8be40843.pdf',
    outputFileName: 'DICS-HR-09_Gratuity_Form_F.pdf',
  },
];

export const ORIGINAL_FORM_PDF_BY_ID: Record<AnyFormId, OriginalFormPdfDescriptor> =
  ORIGINAL_FORM_PDF_DESCRIPTORS.reduce(
    (acc, item) => {
      acc[item.formId] = item;
      return acc;
    },
    {} as Record<AnyFormId, OriginalFormPdfDescriptor>
  );

export interface PhotoImageAsset {
  bytes: Uint8Array;
  mimeType: string;
}

export interface OnboardingPdfPhotoAssets {
  form01Photo?: PhotoImageAsset | null;
  form06Photo?: PhotoImageAsset | null;
}

const INK_COLOR = rgb(0.06, 0.11, 0.22);
const HR_INK_COLOR = rgb(0.08, 0.24, 0.48);

function sanitizePdfText(input: unknown): string {
  if (input === null || input === undefined) return '';
  const raw = String(input)
    .replace(/\u20B9/g, 'Rs. ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[\r\t]+/g, ' ');
  return raw.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '?');
}

function cleanSingleLine(input: unknown): string {
  return sanitizePdfText(input).replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDateDmy(value: string): string {
  const s = cleanSingleLine(value);
  const iso = s.match(/^(\d{4,})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const yr = iso[1].length > 4 ? iso[1].slice(-4) : iso[1];
    return `${iso[3].padStart(2, '0')}/${iso[2].padStart(2, '0')}/${yr}`;
  }
  return s;
}

function splitDateParts(value: string): { day: string; month: string; year: string } {
  const s = cleanSingleLine(value);
  if (!s) return { day: '', month: '', year: '' };
  const ymd = s.match(/^(\d{4,})[/.-](\d{1,2})[/.-](\d{1,2})/);
  if (ymd) {
    const yr = ymd[1].length > 4 ? ymd[1].slice(-4) : ymd[1];
    return { day: ymd[3].padStart(2, '0'), month: ymd[2].padStart(2, '0'), year: yr };
  }
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,})/);
  if (dmy) {
    const yr = dmy[3].length > 4 ? dmy[3].slice(-4) : dmy[3];
    return { day: dmy[1].padStart(2, '0'), month: dmy[2].padStart(2, '0'), year: yr };
  }
  const compact = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) {
    return { day: compact[3], month: compact[2], year: compact[1] };
  }
  return { day: s.slice(0, 2), month: '', year: '' };
}

function wrapTextToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const safe = sanitizePdfText(text).trim();
  if (!safe) return [];
  const paragraphs = safe.split('\n');
  const result: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      if (result.length > 0) result.push('');
      continue;
    }
    const words = trimmed.split(/\s+/);
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) {
          result.push(current);
          current = '';
        }
        if (font.widthOfTextAtSize(word, size) <= maxWidth) {
          current = word;
        } else {
          let chunk = '';
          for (const ch of word) {
            const nextChunk = chunk + ch;
            if (font.widthOfTextAtSize(nextChunk, size) <= maxWidth) {
              chunk = nextChunk;
            } else {
              if (chunk) result.push(chunk);
              chunk = ch;
            }
          }
          current = chunk;
        }
      }
    }
    if (current) result.push(current);
  }
  return result;
}

function drawSingleLineInBox(
  page: PDFPage,
  font: PDFFont,
  value: unknown,
  opts: {
    x: number;
    y: number;
    maxWidth: number;
    fontSize?: number;
    minFontSize?: number;
    align?: 'left' | 'center' | 'right';
    color?: ReturnType<typeof rgb>;
  }
): void {
  const text = cleanSingleLine(value);
  if (!text) return;

  let size = opts.fontSize ?? 9;
  const minSize = opts.minFontSize ?? 6.2;
  while (size > minSize && font.widthOfTextAtSize(text, size) > opts.maxWidth) {
    size -= 0.4;
  }

  let output = text;
  if (font.widthOfTextAtSize(output, size) > opts.maxWidth) {
    while (output.length > 1 && font.widthOfTextAtSize(`${output}...`, size) > opts.maxWidth) {
      output = output.slice(0, -1);
    }
    output = output.length > 1 ? `${output}...` : output;
  }

  const textWidth = font.widthOfTextAtSize(output, size);
  let drawX = opts.x;
  if (opts.align === 'center') {
    drawX = opts.x + Math.max(0, (opts.maxWidth - textWidth) / 2);
  } else if (opts.align === 'right') {
    drawX = opts.x + Math.max(0, opts.maxWidth - textWidth);
  }

  page.drawText(output, {
    x: drawX,
    y: opts.y,
    size,
    font,
    color: opts.color ?? INK_COLOR,
  });
}

function drawWrappedInBox(
  page: PDFPage,
  font: PDFFont,
  value: unknown,
  opts: {
    x: number;
    yTop: number;
    maxWidth: number;
    maxHeight: number;
    fontSize?: number;
    minFontSize?: number;
    lineHeight?: number;
    color?: ReturnType<typeof rgb>;
  }
): void {
  const safe = sanitizePdfText(value).trim();
  if (!safe) return;

  let size = opts.fontSize ?? 8.5;
  const minSize = opts.minFontSize ?? 6;
  const baseRatio = (opts.lineHeight ?? size * 1.25) / size;

  let lines = wrapTextToWidth(safe, font, size, opts.maxWidth);
  let lineHeight = size * baseRatio;
  while (size > minSize && lines.length * lineHeight > opts.maxHeight) {
    size -= 0.5;
    lineHeight = Math.max(size * 1.15, size * baseRatio);
    lines = wrapTextToWidth(safe, font, size, opts.maxWidth);
  }

  const maxLines = Math.max(1, Math.floor(opts.maxHeight / lineHeight));
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1] || '';
    while (last.length > 1 && font.widthOfTextAtSize(`${last}...`, size) > opts.maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last}...`;
  }

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue;
    page.drawText(lines[i], {
      x: opts.x,
      y: opts.yTop - i * lineHeight,
      size,
      font,
      color: opts.color ?? INK_COLOR,
    });
  }
}

function drawVerticallyCenteredWrappedCell(
  page: PDFPage,
  font: PDFFont,
  value: unknown,
  opts: {
    x: number;
    yBottom: number;
    yTop: number;
    maxWidth: number;
    fontSize?: number;
    minFontSize?: number;
    lineRatio?: number;
    color?: ReturnType<typeof rgb>;
  }
): void {
  const safe = sanitizePdfText(value).trim();
  if (!safe) return;

  const usableHeight = Math.max(8, opts.yTop - opts.yBottom - 4);
  let size = opts.fontSize ?? 7.5;
  const minSize = opts.minFontSize ?? 5.5;
  const ratio = opts.lineRatio ?? 1.18;

  let lines = wrapTextToWidth(safe, font, size, opts.maxWidth);
  let lineHeight = size * ratio;
  while (size > minSize && lines.length * lineHeight > usableHeight) {
    size -= 0.4;
    lineHeight = size * ratio;
    lines = wrapTextToWidth(safe, font, size, opts.maxWidth);
  }

  const maxLines = Math.max(1, Math.floor(usableHeight / lineHeight));
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1] || '';
    while (last.length > 1 && font.widthOfTextAtSize(`${last}...`, size) > opts.maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last}...`;
  }

  const yMid = (opts.yBottom + opts.yTop) / 2;
  const firstBaseline = yMid + ((lines.length - 1) * lineHeight) / 2 - size * 0.34;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue;
    page.drawText(lines[i], {
      x: opts.x,
      y: firstBaseline - i * lineHeight,
      size,
      font,
      color: opts.color ?? INK_COLOR,
    });
  }
}

function drawRuledLines(
  page: PDFPage,
  font: PDFFont,
  value: unknown,
  lineSpecs: Array<{ x: number; y: number; maxWidth: number }>,
  fontSize = 9,
  color = INK_COLOR
): void {
  const words = cleanSingleLine(value).split(/\s+/).filter(Boolean);
  if (words.length === 0) return;

  let wordIdx = 0;
  for (let lineIdx = 0; lineIdx < lineSpecs.length && wordIdx < words.length; lineIdx++) {
    const spec = lineSpecs[lineIdx];
    const isLast = lineIdx === lineSpecs.length - 1;
    let current = '';

    while (wordIdx < words.length) {
      const candidate = current ? `${current} ${words[wordIdx]}` : words[wordIdx];
      if (font.widthOfTextAtSize(candidate, fontSize) <= spec.maxWidth) {
        current = candidate;
        wordIdx++;
      } else {
        break;
      }
    }

    if (!current && wordIdx < words.length) {
      let chunk = words[wordIdx];
      while (chunk.length > 1 && font.widthOfTextAtSize(`${chunk}...`, fontSize) > spec.maxWidth) {
        chunk = chunk.slice(0, -1);
      }
      current = chunk;
      wordIdx++;
    }

    if (isLast && wordIdx < words.length && current) {
      while (current.length > 1 && font.widthOfTextAtSize(`${current}...`, fontSize) > spec.maxWidth) {
        current = current.slice(0, -1);
      }
      current = `${current}...`;
    }

    if (current) {
      page.drawText(current, {
        x: spec.x,
        y: spec.y,
        size: fontSize,
        font,
        color,
      });
    }
  }
}

function drawCheckmark(page: PDFPage, x: number, y: number, size = 7, color = INK_COLOR): void {
  page.drawLine({
    start: { x, y: y + size * 0.42 },
    end: { x: x + size * 0.36, y },
    thickness: 1.35,
    color,
  });
  page.drawLine({
    start: { x: x + size * 0.36, y },
    end: { x: x + size, y: y + size * 0.9 },
    thickness: 1.35,
    color,
  });
}

function decodeDataUrl(dataUrl: string): PhotoImageAsset | null {
  const trimmed = String(dataUrl || '').trim();
  const match = trimmed.match(/^data:(image\/(?:png|jpeg|jpg));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return null;
  const mimeType = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
  const base64 = match[2];
  try {
    let bytes: Uint8Array;
    if (typeof Buffer !== 'undefined') {
      bytes = new Uint8Array(Buffer.from(base64, 'base64'));
    } else {
      const binary = atob(base64);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
    }
    return bytes.length > 0 ? { bytes, mimeType } : null;
  } catch {
    return null;
  }
}

async function embedPhotoOrSignature(
  pdfDoc: PDFDocument,
  asset: PhotoImageAsset | string | null | undefined
): Promise<PDFImage | null> {
  if (!asset) return null;
  const resolved = typeof asset === 'string' ? decodeDataUrl(asset) : asset;
  if (!resolved || resolved.bytes.length === 0) return null;

  const mime = resolved.mimeType.toLowerCase();
  try {
    if (mime.includes('png')) {
      return await pdfDoc.embedPng(resolved.bytes);
    }
    if (mime.includes('jpeg') || mime.includes('jpg')) {
      return await pdfDoc.embedJpg(resolved.bytes);
    }
    // Try PNG then JPEG fallback based on header magic bytes
    if (resolved.bytes[0] === 0x89 && resolved.bytes[1] === 0x50) {
      return await pdfDoc.embedPng(resolved.bytes);
    }
    return await pdfDoc.embedJpg(resolved.bytes);
  } catch {
    return null;
  }
}

async function drawImageFitInBox(
  pdfDoc: PDFDocument,
  page: PDFPage,
  asset: PhotoImageAsset | string | null | undefined,
  box: { x: number; y: number; width: number; height: number }
): Promise<boolean> {
  const image = await embedPhotoOrSignature(pdfDoc, asset);
  if (!image) return false;
  const scale = Math.min(box.width / image.width, box.height / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  const drawX = box.x + (box.width - drawW) / 2;
  const drawY = box.y + (box.height - drawH) / 2;
  page.drawImage(image, { x: drawX, y: drawY, width: drawW, height: drawH });
  return true;
}

/* -------------------------------------------------------------------------- */
/*  Form 01: DICS-HR-01_Bio-Data_Form.pdf (3 Pages, 595.20 x 841.92)          */
/* -------------------------------------------------------------------------- */
async function fillForm01(
  pdfDoc: PDFDocument,
  font: PDFFont,
  boldFont: PDFFont,
  f1: Form01BioData,
  officeUse: HrOfficeUseEntry,
  photoAssets?: OnboardingPdfPhotoAssets
): Promise<void> {
  const pages = pdfDoc.getPages();
  const p1 = pages[0];
  if (p1) {
    // Photo box: (x: 418..528, y: 647..761)
    const photoDrawn = await drawImageFitInBox(pdfDoc, p1, photoAssets?.form01Photo, {
      x: 422,
      y: 651,
      width: 102,
      height: 106,
    });
    if (!photoDrawn && f1.photoFileName) {
      drawWrappedInBox(p1, font, `Photo attached:\n${f1.photoFileName}`, {
        x: 425,
        yTop: 714,
        maxWidth: 96,
        maxHeight: 50,
        fontSize: 7.5,
      });
    }

    drawSingleLineInBox(p1, boldFont, f1.nameInCapitals.toUpperCase(), {
      x: 156,
      y: 692.2,
      maxWidth: 247,
      fontSize: 9.5,
    });
    drawSingleLineInBox(p1, font, f1.positionAppliedFor, {
      x: 156,
      y: 659.5,
      maxWidth: 247,
      fontSize: 9.5,
    });

    drawWrappedInBox(p1, font, f1.presentAddress, {
      x: 98,
      yTop: 608.5,
      maxWidth: 178,
      maxHeight: 68,
      fontSize: 8.5,
      lineHeight: 11,
    });
    drawWrappedInBox(p1, font, f1.permanentAddress, {
      x: 360,
      yTop: 614,
      maxWidth: 178,
      maxHeight: 68,
      fontSize: 8.5,
      lineHeight: 11,
    });

    // Exact template baselines step by ~27.37pt: 511.1 .. 237.2 (+2.4pt lift)
    drawSingleLineInBox(p1, font, f1.mobileNo, { x: 104, y: 513.5, maxWidth: 174 });
    drawSingleLineInBox(p1, font, f1.email, { x: 378, y: 513.5, maxWidth: 168 });

    drawSingleLineInBox(p1, font, formatDateDmy(f1.dateOfBirth), { x: 120, y: 485.9, maxWidth: 158 });
    drawSingleLineInBox(p1, font, f1.placeOfBirth, { x: 408, y: 485.9, maxWidth: 138 });

    drawSingleLineInBox(p1, font, f1.heightCm, { x: 88, y: 458.5, maxWidth: 162 });
    drawSingleLineInBox(p1, font, f1.weightKg, { x: 378, y: 458.5, maxWidth: 138 });

    drawSingleLineInBox(p1, font, f1.bloodGroup, { x: 118, y: 431.2, maxWidth: 160 });
    drawSingleLineInBox(p1, font, f1.motherTongue, { x: 416, y: 431.2, maxWidth: 130 });

    drawSingleLineInBox(p1, font, f1.maritalStatus, { x: 127, y: 403.8, maxWidth: 151 });
    drawSingleLineInBox(p1, font, f1.noOfDependents, { x: 441, y: 403.8, maxWidth: 105 });

    drawSingleLineInBox(p1, font, f1.fatherName, { x: 130, y: 376.4, maxWidth: 148 });
    drawSingleLineInBox(p1, font, f1.fatherOccupation, { x: 394, y: 376.4, maxWidth: 152 });

    drawSingleLineInBox(p1, font, f1.motherName, { x: 133, y: 349.1, maxWidth: 145 });
    drawSingleLineInBox(p1, font, f1.motherOccupation, { x: 394, y: 349.1, maxWidth: 152 });

    drawSingleLineInBox(p1, font, f1.spouseName, { x: 125, y: 321.7, maxWidth: 153 });
    drawSingleLineInBox(p1, font, f1.spouseOccupation, { x: 394, y: 321.7, maxWidth: 152 });

    drawSingleLineInBox(p1, font, f1.childrenDetails, { x: 100, y: 294.3, maxWidth: 178 });
    drawSingleLineInBox(p1, font, f1.pfUanNo, { x: 394, y: 294.3, maxWidth: 152 });

    drawSingleLineInBox(p1, font, f1.esicNo, { x: 100, y: 267.0, maxWidth: 178 });
    drawSingleLineInBox(p1, font, f1.panNo, { x: 376, y: 267.0, maxWidth: 170 });

    drawSingleLineInBox(p1, font, f1.aadharNo, { x: 146, y: 239.6, maxWidth: 132 });

    const langRows = (f1.languagesKnown || []).slice(0, 4);
    const langRowYs = [169.5, 155.5, 141.7, 127.8];
    langRows.forEach((row, idx) => {
      const ry = langRowYs[idx];
      if (!row) return;
      drawSingleLineInBox(p1, font, row.language, {
        x: 45,
        y: ry,
        maxWidth: 124,
        fontSize: 8.5,
      });
      if (row.speak) drawCheckmark(p1, 225, ry + 0.3, 7);
      if (row.read) drawCheckmark(p1, 345, ry + 0.3, 7);
      if (row.write) drawCheckmark(p1, 476, ry + 0.3, 7);
    });
  }

  const p2 = pages[1];
  if (p2) {
    const eduRows = (f1.educationalQualifications || []).slice(0, 5);
    const eduRowBaselines = [694.2, 679.5, 665.1, 650.8, 636.3];
    eduRows.forEach((row, idx) => {
      const ry = eduRowBaselines[idx];
      if (!row) return;
      drawSingleLineInBox(p2, font, row.examPassed, {
        x: 45,
        y: ry,
        maxWidth: 49,
        fontSize: 7.5,
      });
      drawSingleLineInBox(p2, font, row.institutionNameAndAddress, {
        x: 99,
        y: ry,
        maxWidth: 162,
        fontSize: 7.5,
      });
      drawSingleLineInBox(p2, font, row.subjects, {
        x: 268,
        y: ry,
        maxWidth: 59,
        fontSize: 7,
        minFontSize: 5.2,
      });
      drawSingleLineInBox(p2, font, row.periodFrom, {
        x: 332,
        y: ry,
        maxWidth: 51,
        fontSize: 7.5,
        align: 'center',
      });
      drawSingleLineInBox(p2, font, row.periodTo, {
        x: 388,
        y: ry,
        maxWidth: 43,
        fontSize: 7.5,
        align: 'center',
      });
      drawSingleLineInBox(p2, font, row.marksOrClass, {
        x: 436,
        y: ry,
        maxWidth: 120,
        fontSize: 7.5,
      });
    });

    const eduBreakText = f1.breakInEducation
      ? `${f1.breakInEducation}${f1.breakInEducationReason ? ` - ${f1.breakInEducationReason}` : ''}`
      : f1.breakInEducationReason;
    drawSingleLineInBox(p2, font, eduBreakText, { x: 42, y: 595.5, maxWidth: 505, fontSize: 8.5 });

    drawSingleLineInBox(p2, font, f1.extracurricularActivities, {
      x: 188,
      y: 581.2,
      maxWidth: 345,
      fontSize: 8.5,
    });

    // Template Work Experience table has exactly 5 data rows
    const expRows = (f1.workExperience || []).slice(0, 5);
    const expCellBounds: Array<[number, number]> = [
      [472.5, 504.2],
      [443.9, 471.8],
      [415.6, 443.2],
      [387.0, 414.8],
      [358.7, 386.3],
    ];
    expRows.forEach((row, idx) => {
      const bounds = expCellBounds[idx];
      if (!row || !bounds) return;
      const [yBottom, yTop] = bounds;
      const yMid = (yBottom + yTop) / 2;
      const singleLineY = yMid - 7.5 * 0.34;
      drawVerticallyCenteredWrappedCell(p2, font, row.companyName, {
        x: 47,
        yBottom,
        yTop,
        maxWidth: 149,
        fontSize: 7.5,
      });
      drawSingleLineInBox(p2, font, row.from, {
        x: 201,
        y: singleLineY,
        maxWidth: 42,
        fontSize: 7.5,
        align: 'center',
      });
      drawSingleLineInBox(p2, font, row.to, {
        x: 247,
        y: singleLineY,
        maxWidth: 39,
        fontSize: 7.5,
        align: 'center',
      });
      drawVerticallyCenteredWrappedCell(p2, font, row.positionHeld, {
        x: 291,
        yBottom,
        yTop,
        maxWidth: 84,
        fontSize: 7.5,
      });
      drawSingleLineInBox(p2, font, row.salaryDrawn, {
        x: 381,
        y: singleLineY,
        maxWidth: 62,
        fontSize: 7.5,
      });
      drawVerticallyCenteredWrappedCell(p2, font, row.reasonForLeaving, {
        x: 449,
        yBottom,
        yTop,
        maxWidth: 97,
        fontSize: 7.5,
      });
    });

    const discontText = f1.discontinuityInEmployment
      ? `${f1.discontinuityInEmployment}${f1.discontinuityReason ? ` - ${f1.discontinuityReason}` : ''}`
      : f1.discontinuityReason;
    drawSingleLineInBox(p2, font, discontText, { x: 42, y: 306, maxWidth: 505, fontSize: 8.5 });

    if (f1.dismissedOrTerminated) {
      drawSingleLineInBox(p2, boldFont, f1.dismissedOrTerminated, {
        x: 452,
        y: 291.9,
        maxWidth: 60,
        fontSize: 9,
      });
    }
    if (f1.convictedForOffences) {
      drawSingleLineInBox(p2, boldFont, f1.convictedForOffences, {
        x: 452,
        y: 264.6,
        maxWidth: 60,
        fontSize: 9,
      });
    }
    drawWrappedInBox(p2, font, f1.dismissedOrConvictedDetails, {
      x: 152,
      yTop: 237.2,
      maxWidth: 393,
      maxHeight: 24,
      fontSize: 8,
      lineHeight: 9.5,
    });
    drawWrappedInBox(p2, font, f1.psychologicalIssuesOrMedication, {
      x: 128,
      yTop: 189.7,
      maxWidth: 416,
      maxHeight: 24,
      fontSize: 8,
      lineHeight: 9.5,
    });
    drawWrappedInBox(p2, font, f1.medicalConditions, {
      x: 42,
      yTop: 144,
      maxWidth: 500,
      maxHeight: 22,
      fontSize: 8,
      lineHeight: 9.5,
    });
  }

  const p3 = pages[2];
  if (p3) {
    drawSingleLineInBox(p3, font, f1.emergencyContactName, { x: 112, y: 749, maxWidth: 215 });
    drawWrappedInBox(p3, font, f1.emergencyContactAddress, {
      x: 394,
      yTop: 749,
      maxWidth: 162,
      maxHeight: 38,
      fontSize: 8.5,
      lineHeight: 10.5,
    });
    drawSingleLineInBox(p3, font, f1.emergencyContactRelationship, {
      x: 148,
      y: 729,
      maxWidth: 220,
    });
    drawSingleLineInBox(p3, font, f1.emergencyContactTel, { x: 118, y: 709, maxWidth: 220 });

    drawSingleLineInBox(p3, font, f1.reference1Name, { x: 126, y: 629, maxWidth: 255 });
    drawWrappedInBox(
      p3,
      font,
      [f1.reference1Address, f1.reference1Tel ? `Tel: ${f1.reference1Tel}` : '']
        .filter(Boolean)
        .join(' | '),
      {
        x: 126,
        yTop: 609,
        maxWidth: 255,
        maxHeight: 38,
        fontSize: 8,
        lineHeight: 10,
      }
    );

    drawSingleLineInBox(p3, font, f1.reference2Name, { x: 458, y: 629, maxWidth: 112 });
    drawWrappedInBox(
      p3,
      font,
      [f1.reference2Address, f1.reference2Tel ? `Tel: ${f1.reference2Tel}` : '']
        .filter(Boolean)
        .join(' | '),
      {
        x: 458,
        yTop: 609,
        maxWidth: 112,
        maxHeight: 38,
        fontSize: 8,
        lineHeight: 10,
      }
    );

    drawSingleLineInBox(p3, font, f1.place, { x: 112, y: 510.5, maxWidth: 185 });
    drawSingleLineInBox(p3, font, formatDateDmy(f1.date), { x: 112, y: 490.5, maxWidth: 185 });

    await drawImageFitInBox(pdfDoc, p3, f1.applicantSignatureDataUrl, {
      x: 375,
      y: 505,
      width: 140,
      height: 36,
    });

    // (FOR OFFICE USE)
    drawSingleLineInBox(p3, boldFont, officeUse.form01SelectionStatus, {
      x: 205,
      y: 392.2,
      maxWidth: 140,
      color: HR_INK_COLOR,
    });
    drawSingleLineInBox(p3, font, formatDateDmy(officeUse.form01ReviewDate), {
      x: 420,
      y: 392.2,
      maxWidth: 115,
      color: HR_INK_COLOR,
    });
    drawSingleLineInBox(p3, font, officeUse.form01SelectedAs, {
      x: 144,
      y: 333.2,
      maxWidth: 120,
      color: HR_INK_COLOR,
    });
    drawSingleLineInBox(p3, font, officeUse.form01ReportingTo, {
      x: 452,
      y: 333.2,
      maxWidth: 85,
      color: HR_INK_COLOR,
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Form 02: DICS-HR-02_Joining_Format.pdf (1 Page, 612 x 792)                */
/* -------------------------------------------------------------------------- */
async function fillForm02(
  pdfDoc: PDFDocument,
  font: PDFFont,
  f2: Form02JoiningFormat
): Promise<void> {
  const p = pdfDoc.getPages()[0];
  if (!p) return;

  // Top 6 rows exact underline RECTS [647.5, 619.4, 591.3, 563.2, 534.9, 507.8]
  drawSingleLineInBox(p, font, f2.name, { x: 272, y: 649.7, maxWidth: 216 });
  drawSingleLineInBox(p, font, f2.fatherName, { x: 272, y: 621.6, maxWidth: 216 });
  drawSingleLineInBox(p, font, f2.designation, { x: 272, y: 593.5, maxWidth: 216 });
  drawSingleLineInBox(p, font, formatDateDmy(f2.dateOfBirth), { x: 272, y: 565.4, maxWidth: 216 });
  drawSingleLineInBox(p, font, formatDateDmy(f2.dateOfJoining), { x: 272, y: 537.1, maxWidth: 216 });
  drawSingleLineInBox(p, font, f2.contactNumber, { x: 272, y: 510.0, maxWidth: 216 });

  // Residential Address: 4 underlines [428.1, 399.7, 371.6, 343.6]
  drawRuledLines(
    p,
    font,
    f2.presentAddress,
    [
      { x: 89, y: 430.5, maxWidth: 206 },
      { x: 89, y: 402.0, maxWidth: 206 },
      { x: 89, y: 374.0, maxWidth: 206 },
      { x: 89, y: 346.0, maxWidth: 206 },
    ],
    8.5
  );

  drawRuledLines(
    p,
    font,
    f2.permanentAddress,
    [
      { x: 310, y: 430.5, maxWidth: 210 },
      { x: 310, y: 402.0, maxWidth: 210 },
      { x: 310, y: 374.0, maxWidth: 210 },
      { x: 310, y: 346.0, maxWidth: 210 },
    ],
    8.5
  );

  // Emergency Box underlines [234.8, 206.7, 178.6]
  drawSingleLineInBox(p, font, f2.emergency1Name, { x: 167, y: 237.0, maxWidth: 132, fontSize: 8.5 });
  drawSingleLineInBox(p, font, f2.emergency1Mobile, {
    x: 167,
    y: 208.9,
    maxWidth: 132,
    fontSize: 8.5,
  });
  drawSingleLineInBox(p, font, f2.emergency1Relationship, {
    x: 167,
    y: 180.8,
    maxWidth: 132,
    fontSize: 8.5,
  });

  drawSingleLineInBox(p, font, f2.emergency2Name, { x: 388, y: 237.0, maxWidth: 132, fontSize: 8.5 });
  drawSingleLineInBox(p, font, f2.emergency2Mobile, {
    x: 388,
    y: 208.9,
    maxWidth: 132,
    fontSize: 8.5,
  });
  drawSingleLineInBox(p, font, f2.emergency2Relationship, {
    x: 388,
    y: 180.8,
    maxWidth: 132,
    fontSize: 8.5,
  });

  // Bottom Date & Signature (below Emergency Box y=170.5)
  drawSingleLineInBox(p, font, formatDateDmy(f2.date), { x: 122, y: 122.5, maxWidth: 140 });
  drawSingleLineInBox(p, font, f2.signatureName || f2.name, {
    x: 361,
    y: 122.5,
    maxWidth: 149,
    align: 'center',
  });
  await drawImageFitInBox(pdfDoc, p, f2.signatureDataUrl, {
    x: 365,
    y: 143,
    width: 140,
    height: 23,
  });
}

/* -------------------------------------------------------------------------- */
/*  Form 03: DICS-HR-03_Mediclaim_Declaration.pdf (1 Page, 595.44 x 841.92)   */
/* -------------------------------------------------------------------------- */
async function fillForm03(
  pdfDoc: PDFDocument,
  font: PDFFont,
  f3: Form03Mediclaim,
  officeUse: HrOfficeUseEntry
): Promise<void> {
  const p = pdfDoc.getPages()[0];
  if (!p) return;

  drawSingleLineInBox(p, font, f3.employeeName, { x: 308, y: 703, maxWidth: 210 });
  drawSingleLineInBox(p, font, officeUse.form03EmpNo || f3.empNo, {
    x: 308,
    y: 670.5,
    maxWidth: 210,
    color: officeUse.form03EmpNo ? HR_INK_COLOR : INK_COLOR,
  });
  drawSingleLineInBox(p, font, formatDateDmy(f3.dateOfJoining), { x: 308, y: 637.5, maxWidth: 210 });
  drawSingleLineInBox(p, font, f3.designation, { x: 308, y: 605, maxWidth: 210 });
  drawSingleLineInBox(p, font, f3.department, { x: 308, y: 572.5, maxWidth: 210 });

  const rowYs = [452.5, 412.5, 372.5, 333.0];
  const members = (f3.familyMembers || []).slice(0, 4);
  members.forEach((row, idx) => {
    const ry = rowYs[idx];
    if (!row) return;
    drawSingleLineInBox(p, font, row.memberName, { x: 106, y: ry, maxWidth: 146, fontSize: 8.5 });
    drawSingleLineInBox(p, font, formatDateDmy(row.dateOfBirth), {
      x: 356,
      y: ry,
      maxWidth: 86,
      fontSize: 8.5,
      align: 'center',
    });
    drawSingleLineInBox(p, font, row.gender, {
      x: 452,
      y: ry,
      maxWidth: 70,
      fontSize: 8.5,
      align: 'center',
    });
  });

  if (f3.declarationDate) {
    drawSingleLineInBox(p, font, `Date: ${formatDateDmy(f3.declarationDate)}`, {
      x: 54,
      y: 250,
      maxWidth: 160,
      fontSize: 8.5,
    });
  }
  await drawImageFitInBox(pdfDoc, p, f3.employeeSignatureDataUrl, {
    x: 390,
    y: 238,
    width: 130,
    height: 32,
  });
}

/* -------------------------------------------------------------------------- */
/*  Form 04: DICS-HR-04_Personal_File_Checklist.pdf (1 Page, 612 x 792)       */
/* -------------------------------------------------------------------------- */
const FORM04_ROW_CENTERS: Record<string, number> = {
  'item-01': 702.85,
  'item-02': 686.55,
  'item-03': 670.25,
  'item-04': 653.9,
  'item-05': 637.55,
  'item-06': 621.25,
  'item-07': 604.95,
  'item-08': 588.65,
  'item-09': 572.3,
  'item-10': 555.95,
  'item-11': 539.65,
  'item-12': 523.35,
  'item-13-1': 490.7,
  'item-13-2': 474.35,
  'item-13-3': 458.05,
  'item-13-4': 441.75,
  'item-13-5': 425.45,
  'item-14-1': 392.75,
  'item-14-2': 376.45,
  'item-14-3': 360.15,
  'item-14-4': 343.85,
  'item-15-1': 311.15,
  'item-15-2': 294.85,
  'item-15-3': 278.55,
  'item-16-1': 245.9,
  'item-16-2': 229.55,
  'item-16-3': 213.25,
  'item-16-4': 196.95,
};

async function fillForm04(
  pdfDoc: PDFDocument,
  font: PDFFont,
  f4: Form04Checklist,
  officeUse: HrOfficeUseEntry
): Promise<void> {
  const p = pdfDoc.getPages()[0];
  if (!p) return;

  drawSingleLineInBox(p, font, formatDateDmy(officeUse.form04EffectiveDate), {
    x: 528,
    y: 771.0,
    maxWidth: 57,
    fontSize: 7.5,
    color: HR_INK_COLOR,
  });
  drawSingleLineInBox(p, font, formatDateDmy(officeUse.form04RevisionDate), {
    x: 528,
    y: 758.0,
    maxWidth: 57,
    fontSize: 7.5,
    color: HR_INK_COLOR,
  });

  drawSingleLineInBox(p, font, f4.employeeName, { x: 112, y: 743.5, maxWidth: 210, fontSize: 8 });
  drawSingleLineInBox(p, font, formatDateDmy(f4.dateOfJoining), {
    x: 351,
    y: 743.5,
    maxWidth: 107,
    fontSize: 8,
  });

  drawSingleLineInBox(p, font, f4.designation, { x: 98, y: 731.5, maxWidth: 136, fontSize: 8 });
  drawSingleLineInBox(p, font, f4.department, { x: 281, y: 731.5, maxWidth: 177, fontSize: 8 });
  drawSingleLineInBox(p, font, officeUse.form04EmpNo, {
    x: 495,
    y: 731.5,
    maxWidth: 90,
    fontSize: 8,
    color: HR_INK_COLOR,
  });

  for (const [key, ry] of Object.entries(FORM04_ROW_CENTERS)) {
    const preStatus = f4.itemStatuses?.[key] || '';
    const postStatus = officeUse.form04PostEmploymentStatuses?.[key] || '';
    if (preStatus) {
      drawSingleLineInBox(p, font, preStatus, {
        x: 464,
        y: ry - 2.3,
        maxWidth: 59,
        fontSize: 7,
        align: 'center',
      });
    }
    if (postStatus) {
      drawSingleLineInBox(p, font, postStatus, {
        x: 527,
        y: ry - 2.3,
        maxWidth: 59,
        fontSize: 7,
        align: 'center',
        color: HR_INK_COLOR,
      });
    }
  }

  const remarksText = officeUse.form04HrRemarks || f4.employeeRemarks || '';
  drawWrappedInBox(p, font, remarksText, {
    x: 58,
    yTop: 158,
    maxWidth: 522,
    maxHeight: 22,
    fontSize: 7.5,
    lineHeight: 9,
    color: officeUse.form04HrRemarks ? HR_INK_COLOR : INK_COLOR,
  });

  drawSingleLineInBox(p, font, officeUse.form04DataEnteredBy, {
    x: 84,
    y: 122.2,
    maxWidth: 238,
    fontSize: 7.5,
    color: HR_INK_COLOR,
  });
  drawSingleLineInBox(p, font, formatDateDmy(officeUse.form04DataEnteredDate), {
    x: 225,
    y: 108.5,
    maxWidth: 97,
    fontSize: 7.5,
    color: HR_INK_COLOR,
  });

  drawSingleLineInBox(p, font, officeUse.form04DataCheckedBy, {
    x: 354,
    y: 122.2,
    maxWidth: 230,
    fontSize: 7.5,
    color: HR_INK_COLOR,
  });
  drawSingleLineInBox(p, font, formatDateDmy(officeUse.form04DataCheckedDate), {
    x: 485,
    y: 108.5,
    maxWidth: 98,
    fontSize: 7.5,
    color: HR_INK_COLOR,
  });
}

/* -------------------------------------------------------------------------- */
/*  Form 05: DICS-HR-05_EPF_Form_2.pdf (4 Pages, 612 x 792)                   */
/* -------------------------------------------------------------------------- */
async function fillForm05(
  pdfDoc: PDFDocument,
  font: PDFFont,
  boldFont: PDFFont,
  f5: Form05EpfForm2,
  officeUse: HrOfficeUseEntry
): Promise<void> {
  const pages = pdfDoc.getPages();
  const p1 = pages[0];
  if (p1) {
    // Page 1 Items 1..8 exact baselines: 576.7, 558.5, 540.0, 521.5, 503.3, 484.8, 466.3, 448.1, 429.6, 411.4
    drawSingleLineInBox(p1, boldFont, f5.nameInBlockLetters.toUpperCase(), {
      x: 164,
      y: 576.7,
      maxWidth: 412,
    });
    drawSingleLineInBox(p1, font, f5.fatherOrHusbandName, { x: 164, y: 558.5, maxWidth: 412 });
    drawSingleLineInBox(p1, font, formatDateDmy(f5.dateOfBirth), { x: 164, y: 540.0, maxWidth: 200 });
    drawSingleLineInBox(p1, font, f5.sex, { x: 164, y: 521.5, maxWidth: 200 });
    drawSingleLineInBox(p1, font, f5.maritalStatus, { x: 164, y: 503.3, maxWidth: 200 });
    drawSingleLineInBox(p1, font, f5.accountNo, { x: 164, y: 484.8, maxWidth: 350 });
    drawSingleLineInBox(p1, font, f5.permanentAddress, {
      x: 232,
      y: 466.3,
      maxWidth: 348,
      fontSize: 8.5,
    });
    drawSingleLineInBox(p1, font, f5.temporaryAddress, {
      x: 232,
      y: 448.1,
      maxWidth: 348,
      fontSize: 8.5,
    });
    drawSingleLineInBox(p1, font, formatDateDmy(f5.dateOfJoiningEpf), {
      x: 232,
      y: 429.6,
      maxWidth: 200,
    });
    drawSingleLineInBox(p1, font, formatDateDmy(f5.dateOfJoiningEps), {
      x: 232,
      y: 411.4,
      maxWidth: 200,
    });

    const nominees = (f5.partANominees || []).slice(0, 4);
    const slotHeight = nominees.length > 2 ? 29 : 50;
    nominees.forEach((nom, idx) => {
      const yTop = 287 - idx * slotHeight;
      const cellMaxH = slotHeight - 4;
      drawWrappedInBox(p1, font, nom.nomineeNameAndAddress, {
        x: 29,
        yTop,
        maxWidth: 108,
        maxHeight: cellMaxH,
        fontSize: 7.5,
        lineHeight: 9,
      });
      drawWrappedInBox(p1, font, nom.relationship, {
        x: 143,
        yTop,
        maxWidth: 100,
        maxHeight: cellMaxH,
        fontSize: 7.5,
        lineHeight: 9,
      });
      drawSingleLineInBox(p1, font, formatDateDmy(nom.dateOfBirth), {
        x: 250,
        y: yTop - 2,
        maxWidth: 67,
        fontSize: 7.5,
        align: 'center',
      });
      drawSingleLineInBox(p1, font, nom.shareProportion, {
        x: 324,
        y: yTop - 2,
        maxWidth: 114,
        fontSize: 7.5,
        align: 'center',
      });
      drawWrappedInBox(p1, font, nom.minorGuardianDetails, {
        x: 444,
        yTop,
        maxWidth: 150,
        maxHeight: cellMaxH,
        fontSize: 7.5,
        lineHeight: 9,
      });
    });

    if (f5.partACertifyNoFamily) drawCheckmark(p1, 56, 154, 7.5);
    if (f5.partACertifyParentsDependent) drawCheckmark(p1, 56, 129, 7.5);

    await drawImageFitInBox(pdfDoc, p1, f5.partASubscriberSignatureDataUrl, {
      x: 410,
      y: 111,
      width: 140,
      height: 30,
    });
  }

  const p2 = pages[1];
  if (p2) {
    const familyRows = (f5.partBFamilyMembers || []).slice(0, 5);
    const epsRowYs = [635.5, 607.5, 579.0, 551.0, 523.0];
    familyRows.forEach((row, idx) => {
      const ry = epsRowYs[idx];
      if (!row) return;
      drawSingleLineInBox(p2, font, row.familyMemberName, {
        x: 60,
        y: ry,
        maxWidth: 130,
        fontSize: 7.5,
      });
      drawSingleLineInBox(p2, font, row.address, {
        x: 196,
        y: ry,
        maxWidth: 176,
        fontSize: 7.5,
      });
      drawSingleLineInBox(p2, font, formatDateDmy(row.dateOfBirth), {
        x: 379,
        y: ry,
        maxWidth: 72,
        fontSize: 7.5,
        align: 'center',
      });
      drawSingleLineInBox(p2, font, row.relationship, {
        x: 458,
        y: ry,
        maxWidth: 120,
        fontSize: 7.5,
      });
    });

    if (f5.partBCertifyNoFamily) drawCheckmark(p2, 18, 495, 7.5);

    drawWrappedInBox(p2, font, f5.partBWidowPensionNomineeNameAddress, {
      x: 30,
      yTop: 380,
      maxWidth: 182,
      maxHeight: 65,
      fontSize: 8,
      lineHeight: 10,
    });
    drawSingleLineInBox(p2, font, formatDateDmy(f5.partBWidowPensionNomineeDob), {
      x: 222,
      y: 380,
      maxWidth: 112,
      fontSize: 8.5,
      align: 'center',
    });
    drawSingleLineInBox(p2, font, f5.partBWidowPensionNomineeRelationship, {
      x: 344,
      y: 380,
      maxWidth: 130,
      fontSize: 8.5,
    });

    drawSingleLineInBox(p2, font, formatDateDmy(f5.partBDate), { x: 74, y: 289.0, maxWidth: 150 });
    drawSingleLineInBox(p2, font, f5.partBPlace, { x: 68, y: 256.5, maxWidth: 156 });

    await drawImageFitInBox(pdfDoc, p2, f5.partBSubscriberSignatureDataUrl, {
      x: 430,
      y: 286,
      width: 135,
      height: 28,
    });

    // CERTIFICATE BY EMPLOYER (HR Office Use)
    const isEmployerCertified = Boolean(
      officeUse.form05EmployerCertDate || officeUse.form05AuthorizedOfficer
    );
    if (isEmployerCertified) {
      drawSingleLineInBox(p2, font, f5.nameInBlockLetters.toUpperCase(), {
        x: 446,
        y: 199.8,
        maxWidth: 124,
        fontSize: 8,
        color: HR_INK_COLOR,
      });
      drawSingleLineInBox(p2, font, f5.partBPlace || 'Bengaluru', {
        x: 70,
        y: 144.8,
        maxWidth: 70,
        fontSize: 8,
        color: HR_INK_COLOR,
      });
      drawSingleLineInBox(p2, font, formatDateDmy(officeUse.form05EmployerCertDate), {
        x: 84,
        y: 99.0,
        maxWidth: 84,
        fontSize: 8,
        color: HR_INK_COLOR,
      });
      drawSingleLineInBox(p2, boldFont, officeUse.form05AuthorizedOfficer, {
        x: 412,
        y: 144,
        maxWidth: 156,
        fontSize: 8.5,
        color: HR_INK_COLOR,
      });
      drawWrappedInBox(
        p2,
        font,
        `${DICS_COMPANY_HEADER.companyName}, ${DICS_COMPANY_HEADER.address}`,
        {
          x: 404,
          yTop: 68,
          maxWidth: 170,
          maxHeight: 28,
          fontSize: 7,
          lineHeight: 8.5,
          color: HR_INK_COLOR,
        }
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Form 06: DICS-HR-06_ESIC_Declaration.pdf (2 Pages, 612 x 1008)            */
/* -------------------------------------------------------------------------- */
async function fillForm06(
  pdfDoc: PDFDocument,
  font: PDFFont,
  boldFont: PDFFont,
  f6: Form06EsicForm1,
  officeUse: HrOfficeUseEntry,
  photoAssets?: OnboardingPdfPhotoAssets
): Promise<void> {
  const p1 = pdfDoc.getPages()[0];
  if (!p1) return;

  // Boxes 1..3: left column 31.26..140.16 is labels; right box 140.16..340.32 is answer cell
  drawSingleLineInBox(p1, font, f6.insuranceNo, { x: 146, y: 861, maxWidth: 188 });
  drawSingleLineInBox(p1, boldFont, f6.nameInBlockLetters.toUpperCase(), {
    x: 146,
    y: 827,
    maxWidth: 188,
  });
  drawSingleLineInBox(p1, font, f6.fatherOrHusbandName, { x: 146, y: 794, maxWidth: 188 });

  // Box 4 DOB: exact verticals 140.25 | 166.25 | 199.75 | 228.75
  const dobParts = splitDateParts(f6.dateOfBirth);
  drawSingleLineInBox(p1, font, dobParts.day, {
    x: 142,
    y: 747,
    maxWidth: 22,
    fontSize: 8.5,
    align: 'center',
  });
  drawSingleLineInBox(p1, font, dobParts.month, {
    x: 168,
    y: 747,
    maxWidth: 30,
    fontSize: 8.5,
    align: 'center',
  });
  drawSingleLineInBox(p1, font, dobParts.year, {
    x: 201,
    y: 747,
    maxWidth: 26,
    fontSize: 8.5,
    align: 'center',
  });

  // Box 5 Marital Status: right cell 287.76..340.74, clear to right of "M/U/W"
  drawSingleLineInBox(p1, boldFont, f6.maritalStatus, {
    x: 324,
    y: 758.5,
    maxWidth: 15,
    fontSize: 7.5,
    minFontSize: 5,
    align: 'center',
  });
  // Box 6 Sex: clear to right of "M/F" and left of 340.74 divider
  drawSingleLineInBox(p1, boldFont, f6.sex, {
    x: 324,
    y: 745.5,
    maxWidth: 15,
    fontSize: 8,
    minFontSize: 4.8,
    align: 'center',
  });

  // Box 7 & 8 Addresses: exact 4 underlines at y=[723.6, 709.2, 694.8, 680.4]
  drawRuledLines(
    p1,
    font,
    f6.presentAddress,
    [
      { x: 47, y: 725.5, maxWidth: 128 },
      { x: 47, y: 711.1, maxWidth: 128 },
      { x: 47, y: 696.7, maxWidth: 128 },
      { x: 47, y: 682.3, maxWidth: 128 },
    ],
    7.5
  );
  // Left PIN exact 6 box edges inside rect x=82.8..176.4
  const leftPinEdges = [82.8, 97.2, 118.8, 133.2, 147.6, 162.0, 176.4];
  const leftPin = cleanSingleLine(f6.presentPinCode).replace(/\s+/g, '').slice(0, 6);
  for (let i = 0; i < leftPin.length && i < 6; i++) {
    drawSingleLineInBox(p1, font, leftPin[i], {
      x: leftPinEdges[i],
      y: 662.5,
      maxWidth: leftPinEdges[i + 1] - leftPinEdges[i],
      fontSize: 8.5,
      align: 'center',
    });
  }
  drawSingleLineInBox(p1, font, f6.presentPhoneOrEmail, {
    x: 36,
    y: 623.5,
    maxWidth: 142,
    fontSize: 8,
  });

  drawRuledLines(
    p1,
    font,
    f6.permanentAddress,
    [
      { x: 198, y: 725.5, maxWidth: 128 },
      { x: 198, y: 711.1, maxWidth: 128 },
      { x: 198, y: 696.7, maxWidth: 128 },
      { x: 198, y: 682.3, maxWidth: 128 },
    ],
    7.5
  );
  // Right PIN exact 6 box edges inside rect x=234.0..327.6
  const rightPinEdges = [234.0, 248.4, 262.8, 277.2, 291.6, 306.0, 327.6];
  const rightPin = cleanSingleLine(f6.permanentPinCode).replace(/\s+/g, '').slice(0, 6);
  for (let i = 0; i < rightPin.length && i < 6; i++) {
    drawSingleLineInBox(p1, font, rightPin[i], {
      x: rightPinEdges[i],
      y: 662.5,
      maxWidth: rightPinEdges[i + 1] - rightPinEdges[i],
      fontSize: 8.5,
      align: 'center',
    });
  }
  drawSingleLineInBox(p1, font, f6.permanentPhoneOrEmail, {
    x: 187,
    y: 623.5,
    maxWidth: 148,
    fontSize: 8,
  });

  drawSingleLineInBox(p1, font, f6.branchOffice, { x: 36, y: 591.5, maxWidth: 142, fontSize: 8 });
  drawSingleLineInBox(p1, font, f6.dispensary, { x: 187, y: 591.5, maxWidth: 148, fontSize: 8 });

  // (B) Employer Particulars
  drawSingleLineInBox(p1, font, officeUse.form06EmployerCodeNo, {
    x: 459,
    y: 859,
    maxWidth: 121,
    fontSize: 8.5,
    color: HR_INK_COLOR,
  });
  if (officeUse.form06DateOfAppointment) {
    const apParts = splitDateParts(officeUse.form06DateOfAppointment);
    drawSingleLineInBox(p1, font, apParts.day, {
      x: 453,
      y: 814.5,
      maxWidth: 28,
      fontSize: 8.5,
      align: 'center',
      color: HR_INK_COLOR,
    });
    drawSingleLineInBox(p1, font, apParts.month, {
      x: 484,
      y: 814.5,
      maxWidth: 32,
      fontSize: 8.5,
      align: 'center',
      color: HR_INK_COLOR,
    });
    drawSingleLineInBox(p1, font, apParts.year, {
      x: 520,
      y: 814.5,
      maxWidth: 40,
      fontSize: 8.5,
      align: 'center',
      color: HR_INK_COLOR,
    });
  }
  // Box 11 Employer Name & Address: exact 3 underlines (374.4..568.8 at 793.38/772.68; 370.8..568.8 at 756.84)
  drawRuledLines(
    p1,
    font,
    `${DICS_COMPANY_HEADER.companyName}, ${DICS_COMPANY_HEADER.address}`,
    [
      { x: 375, y: 795.4, maxWidth: 192 },
      { x: 375, y: 774.7, maxWidth: 192 },
      { x: 371, y: 758.9, maxWidth: 196 },
    ],
    7.5
  );

  if (f6.hasPreviousEmployment) {
    drawSingleLineInBox(p1, font, f6.previousInsNo, { x: 460, y: 697, maxWidth: 120, fontSize: 8 });
    drawSingleLineInBox(p1, font, f6.previousEmployerCodeNo, {
      x: 460,
      y: 675,
      maxWidth: 120,
      fontSize: 8,
    });
    drawWrappedInBox(p1, font, f6.previousEmployerNameAndAddress, {
      x: 356,
      yTop: 636,
      maxWidth: 222,
      maxHeight: 18,
      fontSize: 7.5,
      lineHeight: 8.5,
    });
    drawSingleLineInBox(p1, font, f6.previousEmployerPhoneOrEmail, {
      x: 356,
      y: 594,
      maxWidth: 222,
      fontSize: 7.5,
    });
  }

  // (C) Nominee u/s 71: V-bars 31.25 | 184.25 | 292.25 | 584.75
  drawSingleLineInBox(p1, font, f6.nomineeName, { x: 35, y: 534, maxWidth: 145, fontSize: 8.5 });
  drawSingleLineInBox(p1, font, f6.nomineeRelationship, {
    x: 188,
    y: 534,
    maxWidth: 100,
    fontSize: 8.5,
  });
  drawWrappedInBox(p1, font, f6.nomineeAddress, {
    x: 296,
    yTop: 539.5,
    maxWidth: 284,
    maxHeight: 16,
    fontSize: 8,
    lineHeight: 8.5,
  });

  await drawImageFitInBox(pdfDoc, p1, f6.ipSignatureDataUrl, {
    x: 455,
    y: 462,
    width: 120,
    height: 28,
  });

  // (D) Family Particulars (8 rows: V-bars 67.25 | 152.75 | 260.75 | 346.25 | 382.25 | 427.25 | 490.25 | 584.75)
  const famRows = (f6.familyMembers || []).slice(0, 8);
  const famYs = [357.0, 348.2, 338.5, 328.7, 319.0, 309.2, 299.5, 289.7];
  famRows.forEach((row, idx) => {
    const ry = famYs[idx];
    if (!row) return;
    drawSingleLineInBox(p1, font, row.name, { x: 70, y: ry, maxWidth: 80, fontSize: 7 });
    drawSingleLineInBox(p1, font, formatDateDmy(row.dobOrAge), {
      x: 155,
      y: ry,
      maxWidth: 103,
      fontSize: 7,
      align: 'center',
    });
    drawSingleLineInBox(p1, font, row.relationship, { x: 263, y: ry, maxWidth: 81, fontSize: 7 });
    const yesX = idx === 0 ? 374.5 : 361;
    const noX = idx === 0 ? 416.5 : 401;
    const checkSize = idx === 0 ? 5.5 : 6;
    if (row.residingWithEmployee === 'Yes') drawCheckmark(p1, yesX, ry + 0.5, checkSize);
    if (row.residingWithEmployee === 'No') drawCheckmark(p1, noX, ry + 0.5, checkSize);
    drawSingleLineInBox(p1, font, row.residenceTown, { x: 430, y: ry, maxWidth: 58, fontSize: 7 });
    drawSingleLineInBox(p1, font, row.residenceState, {
      x: 493,
      y: ry,
      maxWidth: 88,
      fontSize: 7,
    });
  });

  // Temporary Identity Card (V-bar 103.25 separates labels from input boxes)
  drawSingleLineInBox(p1, boldFont, f6.nameInBlockLetters.toUpperCase(), {
    x: 108,
    y: 205,
    maxWidth: 229,
    fontSize: 8,
  });
  drawSingleLineInBox(p1, font, f6.insuranceNo, { x: 108, y: 181, maxWidth: 91, fontSize: 8 });
  drawSingleLineInBox(p1, font, formatDateDmy(officeUse.form06DateOfAppointment), {
    x: 207,
    y: 176.5,
    maxWidth: 130,
    fontSize: 8,
    color: HR_INK_COLOR,
  });
  drawSingleLineInBox(p1, font, f6.branchOffice, { x: 108, y: 157, maxWidth: 91, fontSize: 7.5 });
  drawSingleLineInBox(p1, font, f6.dispensary, { x: 252, y: 157, maxWidth: 85, fontSize: 7.5 });
  drawWrappedInBox(
    p1,
    font,
    [
      officeUse.form06EmployerCodeNo ? `Code: ${officeUse.form06EmployerCodeNo}` : '',
      DICS_COMPANY_HEADER.companyName,
    ]
      .filter(Boolean)
      .join(' | '),
    {
      x: 166,
      yTop: 140.5,
      maxWidth: 171,
      maxHeight: 20,
      fontSize: 7,
      lineHeight: 8,
    }
  );

  drawSingleLineInBox(p1, font, formatDateDmy(f6.ticDate), {
    x: 68,
    y: 61.5,
    maxWidth: 100,
    fontSize: 8,
  });
  await drawImageFitInBox(pdfDoc, p1, f6.ticSignatureDataUrl || f6.ipSignatureDataUrl, {
    x: 208,
    y: 65,
    width: 112,
    height: 22,
  });

  // ESIC Photograph box: exact frame (x: 395.75..539.75, y: 121.5..229.5)
  const esicPhotoAsset = photoAssets?.form06Photo || photoAssets?.form01Photo;
  const esicPhotoDrawn = await drawImageFitInBox(pdfDoc, p1, esicPhotoAsset, {
    x: 399,
    y: 125,
    width: 137,
    height: 100,
  });
  if (!esicPhotoDrawn && f6.photoFileName) {
    drawSingleLineInBox(p1, font, `Photo: ${f6.photoFileName}`, {
      x: 399,
      y: 135,
      maxWidth: 137,
      fontSize: 7.5,
      align: 'center',
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Form 07: DICS-HR-07_Form_No_25_Nomination.pdf (1 Page, 612 x 792)         */
/* -------------------------------------------------------------------------- */
async function fillForm07(
  pdfDoc: PDFDocument,
  font: PDFFont,
  f7: Form07Form25
): Promise<void> {
  const p = pdfDoc.getPages()[0];
  if (!p) return;

  // Dash lines at y=[537.5, 515.8, 493.8, 471.8, 449.8, 427.8] -> place text cleanly above dashes
  drawSingleLineInBox(p, font, f7.nomineeName, { x: 373, y: 541.5, maxWidth: 164, fontSize: 9 });
  drawSingleLineInBox(p, font, f7.relationshipWithEmployee, {
    x: 274,
    y: 519.5,
    maxWidth: 263,
    fontSize: 9,
  });
  drawRuledLines(
    p,
    font,
    f7.nomineeAddress,
    [
      { x: 350, y: 497.5, maxWidth: 187 },
      { x: 74, y: 475.5, maxWidth: 463 },
      { x: 74, y: 453.5, maxWidth: 463 },
      { x: 74, y: 431.5, maxWidth: 463 },
    ],
    9
  );

  drawSingleLineInBox(p, font, f7.witness1Details, { x: 154, y: 335.5, maxWidth: 382, fontSize: 9 });
  drawSingleLineInBox(p, font, f7.witness2Details, { x: 154, y: 306.5, maxWidth: 382, fontSize: 9 });

  drawSingleLineInBox(p, font, formatDateDmy(f7.date), {
    x: 105,
    y: 213.5,
    maxWidth: 160,
    fontSize: 9.5,
  });
  await drawImageFitInBox(pdfDoc, p, f7.signatureDataUrl, {
    x: 400,
    y: 180,
    width: 138,
    height: 34,
  });
}

/* -------------------------------------------------------------------------- */
/*  Form 08: DICS-HR-08_EPF_Form_11.pdf (1 Page, 595.20 x 841.68)             */
/* -------------------------------------------------------------------------- */
function drawForm08YesNoBox(page: PDFPage, yBottom: number, value: '' | 'Yes' | 'No'): void {
  if (value === 'Yes') {
    page.drawRectangle({
      x: 403,
      y: yBottom,
      width: 18,
      height: 11,
      borderWidth: 1.1,
      borderColor: INK_COLOR,
    });
  } else if (value === 'No') {
    page.drawRectangle({
      x: 426,
      y: yBottom,
      width: 14,
      height: 11,
      borderWidth: 1.1,
      borderColor: INK_COLOR,
    });
  }
}

async function fillForm08(
  pdfDoc: PDFDocument,
  font: PDFFont,
  boldFont: PDFFont,
  f8: Form08Form11,
  officeUse: HrOfficeUseEntry,
  fallbackDoj: string
): Promise<void> {
  const p = pdfDoc.getPages()[0];
  if (!p) return;

  // Center table divider is strictly x=314.5
  drawSingleLineInBox(p, boldFont, f8.memberName.toUpperCase(), {
    x: 321,
    y: 738,
    maxWidth: 198,
    fontSize: 9,
  });
  if (f8.relationType === 'Father') {
    drawCheckmark(p, 116, 715.5, 8);
  } else if (f8.relationType === 'Spouse') {
    drawCheckmark(p, 217, 715.5, 8);
  }
  drawSingleLineInBox(p, font, f8.fatherOrSpouseName, { x: 321, y: 707, maxWidth: 198 });
  drawSingleLineInBox(p, font, formatDateDmy(f8.dateOfBirth), { x: 321, y: 682.5, maxWidth: 198 });
  drawSingleLineInBox(p, font, f8.gender, { x: 321, y: 667.5, maxWidth: 198 });
  drawSingleLineInBox(p, font, f8.maritalStatus, { x: 321, y: 652.5, maxWidth: 198 });
  drawSingleLineInBox(p, font, f8.emailId, { x: 321, y: 635, maxWidth: 198, fontSize: 8.5 });
  drawSingleLineInBox(p, font, f8.mobileNo, { x: 321, y: 624.5, maxWidth: 198 });

  drawForm08YesNoBox(p, 608.0, f8.earlierMemberEpf1952);
  drawForm08YesNoBox(p, 586.5, f8.earlierMemberEps1995);

  drawSingleLineInBox(p, font, f8.previousUan, { x: 321, y: 554.5, maxWidth: 198 });
  drawSingleLineInBox(p, font, f8.previousPfAccountNo, { x: 321, y: 538.0, maxWidth: 198 });
  drawSingleLineInBox(p, font, formatDateDmy(f8.previousExitDate), {
    x: 321,
    y: 521.0,
    maxWidth: 198,
  });
  drawSingleLineInBox(p, font, f8.schemeCertificateNo, { x: 321, y: 505.5, maxWidth: 198 });
  drawSingleLineInBox(p, font, f8.ppoNo, { x: 321, y: 489.5, maxWidth: 198 });

  drawForm08YesNoBox(p, 471.7, f8.internationalWorker);
  drawSingleLineInBox(p, font, f8.countryOfOrigin, { x: 321, y: 453.0, maxWidth: 198 });
  drawSingleLineInBox(p, font, f8.passportNo, { x: 321, y: 438.0, maxWidth: 198 });
  const passportValidity =
    f8.passportValidFrom || f8.passportValidTo
      ? `${formatDateDmy(f8.passportValidFrom)} to ${formatDateDmy(f8.passportValidTo)}`
      : '';
  drawSingleLineInBox(p, font, passportValidity, { x: 321, y: 422.5, maxWidth: 198, fontSize: 8.5 });

  const bankIfsc = [f8.bankAccountNo, f8.ifscCode ? `IFSC: ${f8.ifscCode}` : '']
    .filter(Boolean)
    .join(' / ');
  drawSingleLineInBox(p, font, bankIfsc, { x: 321, y: 388.5, maxWidth: 198, fontSize: 8.5 });
  drawSingleLineInBox(p, font, f8.aadharNumber, { x: 321, y: 370.0, maxWidth: 198 });
  drawSingleLineInBox(p, font, f8.panNumber, { x: 321, y: 354.0, maxWidth: 198 });

  drawSingleLineInBox(p, font, formatDateDmy(f8.date), { x: 72, y: 250.5, maxWidth: 130, fontSize: 8.5 });
  drawSingleLineInBox(p, font, f8.place, { x: 74, y: 240.5, maxWidth: 130, fontSize: 8.5 });

  await drawImageFitInBox(pdfDoc, p, f8.memberSignatureDataUrl, {
    x: 424,
    y: 250,
    width: 118,
    height: 24,
  });

  // DECLARATION BY PRESENT EMPLOYER
  const hasEmployerDecl = Boolean(
    officeUse.form08MemberId ||
      officeUse.form08EmployerUanVerified ||
      officeUse.form08AuthorizedSignatory
  );
  if (hasEmployerDecl) {
    drawSingleLineInBox(p, font, f8.memberName.toUpperCase(), {
      x: 192,
      y: 214.0,
      maxWidth: 56,
      fontSize: 7.2,
      minFontSize: 5.2,
      color: HR_INK_COLOR,
    });
    drawSingleLineInBox(p, font, formatDateDmy(officeUse.form06DateOfAppointment || fallbackDoj), {
      x: 326,
      y: 214.0,
      maxWidth: 38,
      fontSize: 7.5,
      align: 'center',
      color: HR_INK_COLOR,
    });
    drawSingleLineInBox(p, font, officeUse.form08MemberId, {
      x: 68,
      y: 204.5,
      maxWidth: 165,
      fontSize: 7.5,
      color: HR_INK_COLOR,
    });
    drawSingleLineInBox(p, font, officeUse.form08EmployerUanVerified, {
      x: 328,
      y: 179.5,
      maxWidth: 180,
      fontSize: 8,
      color: HR_INK_COLOR,
    });
    drawSingleLineInBox(p, boldFont, officeUse.form08AuthorizedSignatory, {
      x: 370,
      y: 37,
      maxWidth: 170,
      fontSize: 8,
      align: 'center',
      color: HR_INK_COLOR,
    });
    if (officeUse.updatedAt) {
      drawSingleLineInBox(p, font, formatDateDmy(officeUse.updatedAt.slice(0, 10)), {
        x: 108,
        y: 23.0,
        maxWidth: 120,
        fontSize: 8,
        color: HR_INK_COLOR,
      });
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Form 09: DICS-HR-09_Gratuity_Form_F.pdf (3 Pages, 612 x 792)              */
/* -------------------------------------------------------------------------- */
async function fillForm09(
  pdfDoc: PDFDocument,
  font: PDFFont,
  boldFont: PDFFont,
  f9: Form09GratuityFormF,
  officeUse: HrOfficeUseEntry,
  receiptOrRefCode: string
): Promise<void> {
  const pages = pdfDoc.getPages();
  const p1 = pages[0];
  if (p1) {
    drawRuledLines(
      p1,
      font,
      f9.establishmentNameAndAddress,
      [
        { x: 78, y: 575.5, maxWidth: 454 },
        { x: 78, y: 558.5, maxWidth: 454 },
      ],
      8.5
    );

    const headerFullName = `${f9.salutation ? `${f9.salutation} ` : ''}${f9.employeeFullNameHeader}`.trim();
    drawSingleLineInBox(p1, boldFont, headerFullName, { x: 192, y: 524.5, maxWidth: 340 });

    if (f9.certifyNomineesAreFamily) drawCheckmark(p1, 62, 433.5, 7.5);
    if (f9.declareNoFamily) drawCheckmark(p1, 62, 403.5, 7.5);
    if (f9.fatherMotherNotDependent) drawCheckmark(p1, 62, 369.5, 7.5);
    if (f9.husbandParentsNotDependent) drawCheckmark(p1, 62, 350.5, 7.5);

    // Exact underline RECT: x=368.3, y=334.2, w=149.1
    drawSingleLineInBox(p1, font, formatDateDmy(f9.excludedHusbandNoticeDate), {
      x: 373,
      y: 336.5,
      maxWidth: 140,
      fontSize: 8.5,
    });

    const nominees = (f9.nominees || []).slice(0, 4);
    const nomRowYs = [160.2, 142.8, 125.5, 107.5];
    nominees.forEach((nom, idx) => {
      const ry = nomRowYs[idx];
      if (!nom) return;
      drawSingleLineInBox(p1, font, nom.nomineeNameAndAddress, {
        x: 99,
        y: ry,
        maxWidth: 205,
        fontSize: 7.5,
      });
      drawSingleLineInBox(p1, font, nom.relationship, {
        x: 315,
        y: ry,
        maxWidth: 70,
        fontSize: 7.5,
      });
      drawSingleLineInBox(p1, font, nom.age, {
        x: 391,
        y: ry,
        maxWidth: 36,
        fontSize: 7.5,
        align: 'center',
      });
      drawSingleLineInBox(p1, font, nom.shareProportion, {
        x: 433,
        y: ry,
        maxWidth: 90,
        fontSize: 7.5,
        align: 'center',
      });
    });
  }

  const p2 = pages[1];
  if (p2) {
    // Statement 1..7 underline RECTS: 675.3, 658.5, 641.5, 624.7, 607.6, 590.8, 573.8
    drawSingleLineInBox(p2, font, f9.statementEmployeeName, { x: 198, y: 677.6, maxWidth: 334 });
    drawSingleLineInBox(p2, font, f9.statementSex, { x: 114, y: 660.8, maxWidth: 200 });
    drawSingleLineInBox(p2, font, f9.statementReligion, { x: 130, y: 643.8, maxWidth: 200 });
    drawSingleLineInBox(p2, font, f9.statementMaritalStatus, { x: 276, y: 627.0, maxWidth: 256 });
    drawSingleLineInBox(p2, font, f9.statementDepartmentBranch, { x: 280, y: 609.9, maxWidth: 252 });
    drawSingleLineInBox(p2, font, f9.statementPostHeldAndTicketNo, {
      x: 282,
      y: 593.1,
      maxWidth: 250,
    });
    drawSingleLineInBox(p2, font, formatDateDmy(f9.statementDateOfAppointment), {
      x: 184,
      y: 576.1,
      maxWidth: 200,
    });

    drawSingleLineInBox(p2, font, f9.permanentVillage, { x: 125, y: 542.0, maxWidth: 112, fontSize: 8.5 });
    drawSingleLineInBox(p2, font, f9.permanentThana, { x: 276, y: 542.0, maxWidth: 106, fontSize: 8.5 });
    drawSingleLineInBox(p2, font, f9.permanentSubDivision, {
      x: 444,
      y: 542.0,
      maxWidth: 88,
      fontSize: 8.5,
    });

    drawSingleLineInBox(p2, font, f9.permanentPostOffice, {
      x: 142,
      y: 525.2,
      maxWidth: 96,
      fontSize: 8.5,
    });
    drawSingleLineInBox(p2, font, f9.permanentDistrict, { x: 277, y: 525.2, maxWidth: 106, fontSize: 8.5 });
    drawSingleLineInBox(p2, font, f9.permanentState, { x: 415, y: 525.2, maxWidth: 114, fontSize: 8.5 });

    drawSingleLineInBox(p2, font, f9.employeePlace, { x: 105, y: 472.0, maxWidth: 110 });
    drawSingleLineInBox(p2, font, formatDateDmy(f9.employeeDate), { x: 102, y: 433.2, maxWidth: 112 });
    await drawImageFitInBox(pdfDoc, p2, f9.employeeSignatureDataUrl, {
      x: 396,
      y: 472,
      width: 135,
      height: 22,
    });

    drawRuledLines(
      p2,
      font,
      f9.witness1NameAndAddress,
      [
        { x: 95, y: 329.3, maxWidth: 250 },
        { x: 95, y: 312.2, maxWidth: 250 },
      ],
      8.5
    );
    drawRuledLines(
      p2,
      font,
      f9.witness2NameAndAddress,
      [
        { x: 95, y: 295.4, maxWidth: 250 },
        { x: 95, y: 278.2, maxWidth: 250 },
      ],
      8.5
    );

    await drawImageFitInBox(pdfDoc, p2, f9.witness1SignatureDataUrl, {
      x: 405,
      y: 328,
      width: 126,
      height: 15,
    });
    await drawImageFitInBox(pdfDoc, p2, f9.witness2SignatureDataUrl, {
      x: 405,
      y: 294,
      width: 126,
      height: 15,
    });

    drawSingleLineInBox(p2, font, f9.witnessPlace, { x: 105, y: 244.5, maxWidth: 110 });
    drawSingleLineInBox(p2, font, formatDateDmy(f9.witnessDate), { x: 102, y: 227.7, maxWidth: 110 });

    // Certificate by the Employer (HR Office Use)
    const isEmployerCertified = Boolean(
      officeUse.form09EmployerCertDate || officeUse.form09EmployerDesignation
    );
    if (isEmployerCertified) {
      drawSingleLineInBox(p2, font, receiptOrRefCode, {
        x: 217,
        y: 127.8,
        maxWidth: 97,
        fontSize: 8,
        color: HR_INK_COLOR,
      });
      drawSingleLineInBox(p2, font, formatDateDmy(officeUse.form09EmployerCertDate), {
        x: 101,
        y: 84.8,
        maxWidth: 78,
        fontSize: 8.5,
        color: HR_INK_COLOR,
      });
      drawSingleLineInBox(p2, boldFont, officeUse.form09EmployerDesignation, {
        x: 403,
        y: 116.0,
        maxWidth: 124,
        fontSize: 8.5,
        color: HR_INK_COLOR,
      });
      drawWrappedInBox(
        p2,
        font,
        `${DICS_COMPANY_HEADER.companyName}, ${DICS_COMPANY_HEADER.address}`,
        {
          x: 348,
          yTop: 62.5,
          maxWidth: 196,
          maxHeight: 16,
          fontSize: 6.8,
          lineHeight: 7.8,
          color: HR_INK_COLOR,
        }
      );
    }
  }

  const p3 = pages[2];
  if (p3 && officeUse.form09DuplicateIssuedToEmployee) {
    drawSingleLineInBox(p3, font, formatDateDmy(f9.employeeDate), {
      x: 102,
      y: 610.0,
      maxWidth: 112,
    });
    await drawImageFitInBox(pdfDoc, p3, f9.employeeSignatureDataUrl, {
      x: 416,
      y: 618,
      width: 120,
      height: 18,
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Public Builders: Individual Filled Original PDF + All 9 Forms ZIP         */
/* -------------------------------------------------------------------------- */
export async function buildFilledOriginalFormPdf(
  formId: AnyFormId,
  detail: HrSubmissionDetail,
  templateBytes: Uint8Array,
  photoAssets?: OnboardingPdfPhotoAssets
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { formResponses, officeUse, invitation } = detail;

  switch (formId) {
    case 'form-01':
      await fillForm01(pdfDoc, font, boldFont, formResponses['form-01'], officeUse, photoAssets);
      break;
    case 'form-02':
      await fillForm02(pdfDoc, font, formResponses['form-02']);
      break;
    case 'form-03':
      await fillForm03(pdfDoc, font, formResponses['form-03'], officeUse);
      break;
    case 'form-04':
      await fillForm04(pdfDoc, font, formResponses['form-04'], officeUse);
      break;
    case 'form-05':
      await fillForm05(pdfDoc, font, boldFont, formResponses['form-05'], officeUse);
      break;
    case 'form-06':
      await fillForm06(pdfDoc, font, boldFont, formResponses['form-06'], officeUse, photoAssets);
      break;
    case 'form-07':
      await fillForm07(pdfDoc, font, formResponses['form-07']);
      break;
    case 'form-08':
      await fillForm08(
        pdfDoc,
        font,
        boldFont,
        formResponses['form-08'],
        officeUse,
        formResponses['form-02'].dateOfJoining || formResponses['form-04'].dateOfJoining
      );
      break;
    case 'form-09':
      await fillForm09(
        pdfDoc,
        font,
        boldFont,
        formResponses['form-09'],
        officeUse,
        invitation.receiptCode || invitation.referenceLabel
      );
      break;
    default:
      throw new Error(`Unsupported form identifier: ${String(formId)}`);
  }

  return pdfDoc.save();
}

export async function buildAllNineOriginalFormsZip(
  detail: HrSubmissionDetail,
  templatesByFormId: Record<AnyFormId, Uint8Array>,
  photoAssets?: OnboardingPdfPhotoAssets
): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const descriptor of ORIGINAL_FORM_PDF_DESCRIPTORS) {
    const templateBytes = templatesByFormId[descriptor.formId];
    if (!templateBytes || templateBytes.length === 0) {
      throw new Error(`Missing original PDF template for ${descriptor.code}.`);
    }
    const filledBytes = await buildFilledOriginalFormPdf(
      descriptor.formId,
      detail,
      templateBytes,
      photoAssets
    );
    zip.file(descriptor.outputFileName, filledBytes);
  }
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

export function getOriginalFormPdfFileName(formId: AnyFormId): string {
  return ORIGINAL_FORM_PDF_BY_ID[formId]?.outputFileName || `${formId}.pdf`;
}

export function buildOnboardingFormsZipFileName(detail: HrSubmissionDetail): string {
  const rawRef =
    detail.invitation.referenceLabel ||
    detail.invitation.receiptCode ||
    detail.invitation.id.slice(0, 8);
  const safeRef = rawRef
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `DICS-Onboarding-Forms-${safeRef || 'Packet'}.zip`;
}

export function pickPhotographDocumentForForm(
  uploadedDocuments: UploadedDocumentItem[],
  preferredFileName: string
): UploadedDocumentItem | null {
  const isImage = (doc: UploadedDocumentItem) => {
    const m = doc.mimeType.toLowerCase();
    return m === 'image/jpeg' || m === 'image/jpg' || m === 'image/png';
  };

  const trimmed = cleanSingleLine(preferredFileName).toLowerCase();
  if (trimmed) {
    const exact = uploadedDocuments.find(
      (doc) => isImage(doc) && doc.fileName.toLowerCase() === trimmed
    );
    if (exact) return exact;
  }

  return (
    uploadedDocuments.find((doc) => doc.slotId === 'upload-slot-photograph' && isImage(doc)) ||
    null
  );
}
