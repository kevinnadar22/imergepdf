import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { AnimatePresence, motion } from 'motion/react';
import { 
  FileUp, 
  AlertCircle,
  Github,
  Globe
} from 'lucide-react';
import { cn } from './lib/utils';
import { mergePreprocessedFilesToPdf, convertToPdfBytes } from './lib/pdfUtils';
import { getFileIcon } from './lib/fileUtils';
import { MergeFile, ProcessedFile } from './types';
import {
  ACCEPTED_FILE_TYPES,
  SUPPORTED_MIME_PREFIX_REGEX,
  SUPPORTED_EXTENSIONS_REGEX,
} from './constants';

import { FilePreviewModal } from './components/FilePreviewModal';
import { ClearConfirmModal } from './components/ClearConfirmModal';
import { FileList } from './components/FileList';
import { OptionsSidebar } from './components/OptionsSidebar';

export default function App() {
  const [files, setFiles] = useState<MergeFile[]>([]);
  const [ensureEvenPages, setEnsureEvenPages] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const handleClearAll = () => {
    setFiles([]);
    setShowClearConfirm(false);
  };

  const processFile = async (id: string, file: File) => {
    try {
      const result = await convertToPdfBytes(file);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, pdfBytes: result.bytes, pageCount: result.pageCount, isProcessing: false } : f));
    } catch (err: any) {
      setError(err.message || `Failed to process ${file.name}`);
      setFiles(prev => prev.filter(f => f.id !== id));
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const newFiles = acceptedFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      quantity: 1,
      isProcessing: true
    })).reverse(); // Reverse to fix order of selection
    
    setFiles(prev => [...prev, ...newFiles]);
    
    newFiles.forEach(nf => {
      processFile(nf.id, nf.file);
    });
  }, []);

  useEffect(() => {
    const handlePaste = (e: Event) => {
      const clipboardEvent = e as ClipboardEvent;
      if (clipboardEvent.clipboardData?.files && clipboardEvent.clipboardData.files.length > 0) {
        const pastedFiles = Array.from(clipboardEvent.clipboardData.files);
        const validFiles = pastedFiles.filter(file => 
           file.type.match(SUPPORTED_MIME_PREFIX_REGEX) || 
           file.name.match(SUPPORTED_EXTENSIONS_REGEX)
        );
        
        if (validFiles.length > 0) {
          onDrop(validFiles);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onDrop]);

  const dropzoneOptions = {
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    onDropRejected: (fileRejections: FileRejection[]) => {
      const unsupported = fileRejections.find(
        f => !f.file.type.match(SUPPORTED_MIME_PREFIX_REGEX) && 
             !f.file.name.match(SUPPORTED_EXTENSIONS_REGEX)
      );
      if (unsupported) {
        setError(`Unsupported file format: ${unsupported.file.name}. Please upload PDFs, images, DOCX, XLSX, or text files.`);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions as any);

  const handleMerge = async () => {
    if (files.length === 0) return;
    
    setIsMerging(true);
    setError(null);
    
    try {
      const processedFiles: ProcessedFile[] = files
        .filter(f => f.pdfBytes && !f.isProcessing)
        .map(f => ({ bytes: f.pdfBytes!, quantity: f.quantity }));
      
      const pdfBytes = await mergePreprocessedFilesToPdf(processedFiles, ensureEvenPages);
      
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_document_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during merging.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <>
      <FilePreviewModal 
        previewFile={previewFile} 
        onClose={() => setPreviewFile(null)} 
        getFileIcon={getFileIcon} 
      />

      <ClearConfirmModal 
        isOpen={showClearConfirm} 
        onClose={() => setShowClearConfirm(false)} 
        onConfirm={handleClearAll} 
      />

      <div className="min-h-screen bg-[#f8f9fa] text-gray-900 selection:bg-blue-100 py-10 px-4 sm:px-8 lg:px-16 font-sans">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <header className="space-y-3 text-center select-none mb-4">
            <h1 className="font-display font-medium text-4xl tracking-tight text-gray-900">
              IMergePDF
            </h1>
            <p className="font-sans text-base text-gray-600 max-w-xl mx-auto">
              Combine your documents, spreadsheets, and images into a single PDF.
            </p>
            <div className="flex justify-center items-center gap-4 pt-2">
              <a href="https://github.com/kevinnadar22" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5 text-sm font-medium">
                <Github className="w-4 h-4" />
                kevinnadar22
              </a>
              <span className="text-gray-300">•</span>
              <a href="https://mariakevin.in" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5 text-sm font-medium">
                <Globe className="w-4 h-4" />
                mariakevin.in
              </a>
            </div>
          </header>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl flex items-center gap-3 shadow-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Main Dropzone / List Area */}
            <div className="lg:col-span-8 space-y-6">
              <div 
                {...getRootProps()} 
                className={cn(
                  "relative group cursor-pointer rounded-3xl p-10 sm:p-14 transition-all flex flex-col items-center justify-center text-center overflow-hidden",
                  isDragActive ? "bg-[#e8f0fe] border-2 border-dashed border-[#1a73e8]" : "bg-white border hover:shadow-md hover:bg-gray-50/50"
                )}
              >
                <input {...getInputProps()} />
                <div className="relative z-10 flex flex-col items-center space-y-4">
                  <div className={cn(
                    "p-4 rounded-full transition-colors",
                    isDragActive ? "text-[#1a73e8]" : "text-gray-500 group-hover:text-[#1a73e8]"
                  )}>
                    <FileUp className="w-10 h-10 transition-transform group-hover:-translate-y-1" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium text-lg text-gray-800">
                      {isDragActive ? "Drop files here" : "Drag & drop files or click to upload"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports PDFs, Images, Word, Excel & Text files.
                    </p>
                  </div>
                </div>
              </div>

              {/* File List */}
              <FileList 
                files={files} 
                setFiles={setFiles} 
                setShowClearConfirm={setShowClearConfirm} 
                setPreviewFile={setPreviewFile}
              />
            </div>

            {/* Options Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <OptionsSidebar 
                files={files}
                ensureEvenPages={ensureEvenPages}
                setEnsureEvenPages={setEnsureEvenPages}
                handleMerge={handleMerge}
                isMerging={isMerging}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
