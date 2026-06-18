import React from 'react';
import { 
  FileText, 
  Image as ImageIcon,
  FileQuestion
} from 'lucide-react';

export const getFileIcon = (type: string, name: string) => {
  if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
  if (type === 'application/pdf') return <FileText className="w-5 h-5 text-rose-500" />;
  if (name.toLowerCase().endsWith('.docx') || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return <FileText className="w-5 h-5 text-blue-600" />;
  if (name.toLowerCase().match(/\.(xlsx|xls)$/) || type.match(/spreadsheet|excel/)) return <FileText className="w-5 h-5 text-green-600" />;
  if (type.startsWith('text/') || name.toLowerCase().match(/\.(txt|csv|md|json|log|xml)$/)) return <FileText className="w-5 h-5 text-emerald-600" />;
  return <FileQuestion className="w-5 h-5 text-gray-500" />;
};
