'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LuX, LuCheck } from 'react-icons/lu';

interface SignaturePadProps {
  onSign: (signatureData: string) => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export default function SignaturePad({
  onSign,
  onCancel,
  title = 'Signature numérique requise',
  message = 'Veuillez signer dans le cadre ci-dessous',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration du canvas
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 400;
    canvas.height = 200;

    // Fond blanc
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bordure
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x = 0,
      y = 0;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x = 0,
      y = 0;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();

    setIsEmpty(false);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    setIsEmpty(true);
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    const signatureImage = canvas.toDataURL('image/png');
    onSign(signatureImage);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
    >
      <motion.div
        className='bg-white rounded-lg shadow-xl w-full max-w-md p-6'
        initial={{ y: -20 }}
        animate={{ y: 0 }}
      >
        <h2 className='text-xl font-bold text-gray-800 mb-2'>{title}</h2>
        <p className='text-sm text-gray-600 mb-4'>{message}</p>

        <div className='w-full mb-4 relative overflow-hidden rounded border-2 border-gray-300 bg-gray-50'>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className='w-full cursor-crosshair touch-none'
            style={{ display: 'block' }}
          />
        </div>

        <div className='flex gap-3'>
          <button
            onClick={clearCanvas}
            className='flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 transition'
          >
            Effacer
          </button>

          <button
            onClick={onCancel}
            className='flex-1 px-4 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600 transition flex items-center justify-center gap-2'
          >
            <LuX /> Annuler
          </button>

          <button
            onClick={handleSign}
            disabled={isEmpty}
            className='flex-1 px-4 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
          >
            <LuCheck /> Signer
          </button>
        </div>

        <p className='text-xs text-gray-500 mt-4 text-center'>
          Signez dans le cadre avec votre stylet ou votre souris
        </p>
      </motion.div>
    </motion.div>
  );
}
