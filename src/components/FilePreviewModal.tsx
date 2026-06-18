import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';

interface FilePreviewModalProps {
  previewFile: File | null;
  onClose: () => void;
  getFileIcon: (type: string, name: string) => React.ReactNode;
}

export function FilePreviewModal({ previewFile, onClose, getFileIcon }: FilePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (previewFile) {
      // Reset loading state when a new file is previewed
      setIsLoading(true);
    }
  }, [previewFile]);

  return (
    <AnimatePresence>
      {previewFile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col relative"
            style={{ maxHeight: '90vh' }}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900 truncate pr-4">{previewFile.name}</h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center relative min-h-[50vh]">
              {isLoading && (previewFile.type.startsWith('image/') || previewFile.type === 'application/pdf') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 gap-3">
                  <Loader2 className="w-8 h-8 text-[#1a73e8] animate-spin" />
                  <p className="text-sm font-medium text-gray-500">Loading preview...</p>
                </div>
              )}
              
              {previewFile.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(previewFile)} 
                  alt={previewFile.name} 
                  className={`max-w-full max-h-[70vh] object-contain rounded-lg transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setIsLoading(false)}
                />
              ) : previewFile.type === 'application/pdf' ? (
                <iframe 
                  src={URL.createObjectURL(previewFile)} 
                  className={`w-full h-[70vh] rounded-lg border-0 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                  title={previewFile.name}
                  onLoad={() => setIsLoading(false)}
                />
              ) : (
                 <div className="flex flex-col items-center justify-center text-gray-500 py-20">
                   {getFileIcon(previewFile.type, previewFile.name)}
                   <p className="mt-4 text-sm">Preview not available for this file type.</p>
                 </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
