import React from 'react';
import { motion } from 'motion/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Trash2, 
  ChevronUp,
  ChevronDown,
  Loader2,
  GripVertical
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MergeFile } from '../types';

interface SortableFileItemProps {
  key?: string | number;
  item: MergeFile;
  index: number;
  totalFiles: number;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onMove: (index: number, direction: 'up' | 'down', e: React.MouseEvent) => void;
  onQuantityChange: (id: string, newQuantity: number, e: React.MouseEvent) => void;
  getFileIcon: (type: string, name: string) => React.ReactNode;
  onPreview: (file: File) => void;
}

export function SortableFileItem({ 
  item,
  index,
  totalFiles,
  onRemove,
  onMove,
  onQuantityChange,
  getFileIcon,
  onPreview
}: SortableFileItemProps) {
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
      <div 
        className="flex flex-row items-center flex-1 cursor-pointer hover:bg-gray-100 rounded-lg p-1 -ml-1 transition-colors"
        onClick={() => onPreview(item.file)}
      >
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
