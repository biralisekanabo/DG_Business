'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LuFileText, LuDownload, LuCheck, LuX } from 'react-icons/lu';
import SignaturePad from '@/components/Signature/SignaturePad';

interface SignatureBlockProps {
  title: string;
  description: string;
  onGenerate: (signatureData: string) => Promise<void>;
  isLoading?: boolean;
  generatedUrl?: string;
}

export default function SignatureBlock({
  title,
  description,
  onGenerate,
  isLoading = false,
  generatedUrl,
}: SignatureBlockProps) {
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(!!generatedUrl);

  const handleSign = async (signatureImage: string) => {
    setIsProcessing(true);
    try {
      await onGenerate(signatureImage);
      setHasGenerated(true);
      setShowSignaturePad(false);
    } catch (error) {
      console.error('Erreur lors de la signature:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6'
      >
        <div className='flex items-start justify-between'>
          <div className='flex items-start gap-4'>
            <div className='bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 p-3 rounded-lg'>
              <LuFileText className='w-6 h-6 text-emerald-600 dark:text-emerald-400' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-100'>{title}</h3>
              <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>{description}</p>
            </div>
          </div>

          {hasGenerated ? (
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-1 text-green-600 dark:text-green-400 font-medium'>
                <LuCheck className='w-5 h-5' />
                <span>Signé</span>
              </div>
              {generatedUrl && (
                <a
                  href={generatedUrl}
                  download
                  className='flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium'
                >
                  <LuDownload className='w-4 h-4' />
                  Télécharger
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowSignaturePad(true)}
              disabled={isProcessing || isLoading}
              className='flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium'
            >
              {isProcessing ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Signature...
                </>
              ) : (
                <>
                  <LuCheck className='w-4 h-4' />
                  Signer maintenant
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {showSignaturePad && (
        <SignaturePad
          onSign={handleSign}
          onCancel={() => setShowSignaturePad(false)}
          title={title}
          message={description}
        />
      )}
    </>
  );
}
