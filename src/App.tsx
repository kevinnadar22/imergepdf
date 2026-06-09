import React, { useCallback, useState } from 'react';
import { useDropzone, DropzoneOptions, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  FileUp, 
  Trash2, 
  FileText, 
  Image as ImageIcon,
  AlertCircle,
  FileQuestion,
  Wand2,
  ChevronUp,
  ChevronDown,
  Download,
  Loader2,
  GripVertical,
  Github,
  Globe
} from 'lucide-react';
import { cn } from './lib/utils';
import { mergePreprocessedFilesToPdf, convertToPdfBytes } from './lib/pdfUtils';
import PrintPreview from './components/PrintPreview';
import { MergeFile, ProcessedFile } from './types';
import {
  ACCEPTED_FILE_TYPES,
  SUPPORTED_MIME_PREFIX_REGEX,
  SUPPORTED_EXTENSIONS_REGEX,
} from './constants';

function SortableFileItem({ 
  item,
  index,
  totalFiles,
  onRemove,
  onMove,
  onQuantityChange,
  getFileIcon 
}: { 
  key?: string;
  item: MergeFile;
  index: number;
  totalFiles: number;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onMove: (index: number, direction: 'up' | 'down', e: React.MouseEvent) => void;
  onQuantityChange: (id: string, newQuantity: number, e: React.MouseEvent) => void;
  getFileIcon: (type: string, name: string) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, margin: 0, padding: 0 }}
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 transition-colors bg-white relative cursor-grab active:cursor-grabbing",
        isDragging ? "shadow-md ring-1 ring-blue-100 z-10" : "hover:bg-[#f8f9fa]"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="text-gray-300 group-hover:text-gray-400 flex-shrink-0">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex flex-col items-center transition-opacity text-gray-300">
        <button 
          onClick={(e) => onMove(index, 'up', e)}
          disabled={index === 0}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 hover:bg-[#f1f3f4] hover:text-gray-700 rounded-full disabled:opacity-20 disabled:hover:bg-transparent transition-colors z-10"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button 
          onClick={(e) => onMove(index, 'down', e)}
          disabled={index === totalFiles - 1}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 hover:bg-[#f1f3f4] hover:text-gray-700 rounded-full disabled:opacity-20 disabled:hover:bg-transparent transition-colors z-10"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
      
      {/* Icon & Details */}
      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#f1f3f4] rounded-full flex items-center justify-center flex-shrink-0">
        {getFileIcon(item.file.type, item.file.name)}
      </div>
      <div className="min-w-0 flex-1 ml-2">
        <p className="font-medium text-sm sm:text-base truncate text-gray-800" title={item.file.name}>
          {item.file.name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {(item.file.size / 1024 / 1024).toFixed(2)} MB
          {item.pageCount !== undefined && ` • ${item.pageCount} ${item.pageCount === 1 ? 'Page' : 'Pages'}`}
        </p>
      </div>

      {item.isProcessing ? (
        <div className="flex px-3 text-[#1a73e8]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <div className="flex items-center space-x-1 mr-2 z-10" onPointerDown={(e) => e.stopPropagation()}>
          <button 
            disabled={item.quantity <= 1}
            onClick={(e) => onQuantityChange(item.id, item.quantity - 1, e)}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f1f3f4] text-gray-600 disabled:opacity-30 transition-colors"
          >
            -
          </button>
          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
          <button 
            onClick={(e) => onQuantityChange(item.id, item.quantity + 1, e)}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f1f3f4] text-gray-600 transition-colors"
          >
            +
          </button>
        </div>
      )}
      
      <button
        onClick={(e) => onRemove(item.id, e)}
        onPointerDown={(e) => e.stopPropagation()}
        className="p-2 sm:p-2.5 text-gray-400 hover:text-[#d93025] hover:bg-[#fce8e6] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#d93025] flex-shrink-0 z-10"
        title="Remove file"
      >
        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </motion.div>
  );
}

export default function App() {
  const [files, setFiles] = useState<MergeFile[]>([]);
  const [ensureEvenPages, setEnsureEvenPages] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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

  const updateQuantity = (id: string, newQuantity: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.map(f => f.id === id ? { ...f, quantity: Math.max(1, newQuantity) } : f));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === files.length - 1) return;

    setFiles(prev => {
      const result = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [result[index], result[targetIndex]] = [result[targetIndex], result[index]];
      return result;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

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

  const getFileIcon = (type: string, name: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type === 'application/pdf') return <FileText className="w-5 h-5 text-rose-500" />;
    if (name.toLowerCase().endsWith('.docx') || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return <FileText className="w-5 h-5 text-blue-600" />;
    if (name.toLowerCase().match(/\.(xlsx|xls)$/) || type.match(/spreadsheet|excel/)) return <FileText className="w-5 h-5 text-green-600" />;
    if (type.startsWith('text/') || name.toLowerCase().match(/\.(txt|csv|md|json|log|xml)$/)) return <FileText className="w-5 h-5 text-emerald-600" />;
    return <FileQuestion className="w-5 h-5 text-gray-500" />;
  };

  return (
    <>
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
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
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-[#f1f3f4] hover:bg-gray-200 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#d93025] hover:bg-[#b32b22] rounded-full transition-colors shadow-sm"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            {files.length > 0 && (
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center select-none bg-white">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-800 text-sm tracking-wide uppercase">File Order</h3>
                    <span className="text-xs font-medium bg-[#f1f3f4] text-gray-600 px-3 py-1 rounded-full">
                      {files.length} {files.length === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-xs font-medium text-[#d93025] hover:text-[#b32b22] hover:bg-[#fce8e6] px-3 py-1.5 rounded-full transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={files.map(f => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <AnimatePresence mode="popLayout">
                        {files.map((item, index) => (
                          <SortableFileItem 
                            key={item.id} 
                            item={item} 
                            index={index}
                            totalFiles={files.length}
                            onRemove={removeFile}
                            onMove={moveFile}
                            onQuantityChange={updateQuantity}
                            getFileIcon={getFileIcon}
                          />
                        ))}
                      </AnimatePresence>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            )}
          </div>

          {/* Options Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              
              <div className="space-y-4">
                <h3 className="font-medium text-gray-800 flex items-center gap-2 select-none">
                  Options
                </h3>
                
                <div 
                  className={cn(
                    "relative rounded-2xl p-4 cursor-pointer transition-all select-none overflow-hidden",
                    ensureEvenPages ? "bg-[#e8f0fe] text-[#1a73e8]" : "hover:bg-[#f1f3f4] bg-white border border-gray-100 text-gray-700"
                  )}
                  onClick={() => setEnsureEvenPages(!ensureEvenPages)}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className={cn(
                      "w-5 h-5 mt-0.5 shrink-0 rounded flex items-center justify-center transition-colors",
                      ensureEvenPages ? "bg-[#1a73e8] text-white" : "border-2 border-gray-400 bg-white"
                    )}>
                      {ensureEvenPages && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                     <div className="flex-1 space-y-1">
                      <p className="font-medium text-sm">
                        Taking Printout?
                      </p>
                      <p className={cn("text-xs leading-relaxed", ensureEvenPages ? "text-[#1a73e8]/80" : "text-gray-500")}>
                        If a file has an odd number of pages (like 1, 3, or 5), we add a blank page at the end. This stops the next file from printing on the back of it.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleMerge}
                  disabled={files.length === 0 || isMerging}
                  className={cn(
                    "w-full py-3.5 px-6 rounded-full font-medium sm:text-base flex items-center justify-center gap-2.5 transition-all select-none disabled:pointer-events-none cursor-pointer",
                    files.length === 0 
                      ? "bg-[#f1f3f4] text-gray-400"
                      : isMerging ? "bg-[#1a73e8] text-white shadow-md opacity-80" : "bg-[#1a73e8] hover:bg-[#1557b0] hover:shadow-md text-white"
                  )}
                >
                  {isMerging ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Merge to PDF
                    </>
                  )}
                </button>
              </div>

              {files.length > 0 && (
                <p className="text-base font-medium text-gray-700 text-center select-none pt-2">
                  Want to see how the print looks? Look below
                </p>
              )}

              <PrintPreview files={files} ensureEvenPages={ensureEvenPages} />

            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
