import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Eraser, PenTool } from 'lucide-react';

interface SignaturePadFieldProps {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  helperText?: string;
  onChange: (dataUrl: string) => void;
}

export const SignaturePadField: React.FC<SignaturePadFieldProps> = ({
  id,
  label,
  value,
  required = false,
  helperText,
  onChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
      setHasStroke(true);
    } else {
      setHasStroke(false);
    }
  }, [value]);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const { x, y } = getCoords(e);
    ctx.strokeStyle = '#0B1F3A';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.5, y + 0.5);
    ctx.stroke();
    setHasStroke(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const finishStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasStroke(false);
    onChange('');
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-xs font-medium text-slate-700">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {hasStroke && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="w-3 h-3" />
              <span>Captured</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700"
          >
            <Eraser className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="rounded-md border border-slate-300 bg-white overflow-hidden">
        <canvas
          id={id}
          ref={canvasRef}
          width={520}
          height={120}
          aria-label={label}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
          onPointerCancel={finishStroke}
          className="w-full h-28 block touch-none cursor-crosshair bg-slate-50/40"
        />
        <div className="px-3 py-1.5 border-t border-slate-200 bg-slate-50 flex items-center gap-1.5 text-[11px] text-slate-500">
          <PenTool className="w-3 h-3 text-slate-400 shrink-0" />
          <span>
            {helperText || 'Draw signature using mouse, trackpad, or touch screen.'}
          </span>
        </div>
      </div>
    </div>
  );
};
