import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ClearConfirmModal({ isOpen, onClose, onConfirm }: ClearConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 shadow-xl max-w-sm w-full space-y-5 border border-gray-100"
          >
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Clear all files?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to remove all files? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-[#f1f3f4] hover:bg-gray-200 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-[#d93025] hover:bg-[#b32b22] rounded-full transition-colors shadow-sm"
              >
                Clear All
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
