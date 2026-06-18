import React from 'react';
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
} from '@dnd-kit/sortable';
import { AnimatePresence } from 'motion/react';
import { MergeFile } from '../types';
import { SortableFileItem } from './SortableFileItem';
import { getFileIcon } from '../lib/fileUtils';

interface FileListProps {
  files: MergeFile[];
  setFiles: React.Dispatch<React.SetStateAction<MergeFile[]>>;
  setShowClearConfirm: (show: boolean) => void;
  setPreviewFile: (file: File) => void;
}

export function FileList({ files, setFiles, setShowClearConfirm, setPreviewFile }: FileListProps) {
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

  const updateQuantity = (id: string, newQuantity: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.map(f => f.id === id ? { ...f, quantity: Math.max(1, newQuantity) } : f));
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

  if (files.length === 0) return null;

  return (
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
                  onPreview={setPreviewFile}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
