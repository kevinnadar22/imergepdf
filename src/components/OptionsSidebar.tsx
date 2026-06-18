import React from 'react';
import { Loader2, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import PrintPreview from './PrintPreview';
import { MergeFile } from '../types';

interface OptionsSidebarProps {
  files: MergeFile[];
  ensureEvenPages: boolean;
  setEnsureEvenPages: (value: boolean) => void;
  handleMerge: () => void;
  isMerging: boolean;
}

export function OptionsSidebar({ 
  files, 
  ensureEvenPages, 
  setEnsureEvenPages, 
  handleMerge, 
  isMerging 
}: OptionsSidebarProps) {
  return (
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
        <>
          <p className="text-base font-medium text-gray-700 text-center select-none pt-2">
            Want to see how the print looks? Look below
          </p>
          <PrintPreview files={files} ensureEvenPages={ensureEvenPages} />
        </>
      )}
    </div>
  );
}
