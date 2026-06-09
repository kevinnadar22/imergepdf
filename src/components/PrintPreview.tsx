import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { MergeFile, VisualPage, VisualSheet } from '../types';
import { getVisualSheets } from '../lib/previewUtils';

interface PrintPreviewProps {
  files: MergeFile[];
  ensureEvenPages: boolean;
}

function StatsSummary({ 
  sheetCount, 
  pageCount, 
  blankCount 
}: { 
  sheetCount: number; 
  pageCount: number; 
  blankCount: number; 
}) {
  return (
    <div className="bg-[#f8f9fa] border border-gray-200/80 rounded-2xl p-3 flex justify-around text-center select-none text-xs">
      <div>
        <p className="text-gray-400 font-medium text-[10px] uppercase tracking-wider">Sheets Required</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">{sheetCount}</p>
      </div>
      <div className="border-r border-gray-200" />
      <div>
        <p className="text-gray-400 font-medium text-[10px] uppercase tracking-wider">Total Pages</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">{pageCount}</p>
      </div>
      {blankCount > 0 && (
        <>
          <div className="border-r border-gray-200" />
          <div>
            <p className="text-[#1a73e8]/70 font-medium text-[10px] uppercase tracking-wider">Blank Added</p>
            <p className="text-sm font-medium text-[#1a73e8] mt-0.5">{blankCount}</p>
          </div>
        </>
      )}
    </div>
  );
}

function PageCell({ page }: { page?: VisualPage }) {
  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-gray-200 bg-gray-50/50 rounded-xl h-24 text-center p-2.5 select-none">
        <span className="text-xs text-gray-400">Empty</span>
        <span className="text-[10px] text-gray-400/80 mt-0.5">No Print (Back)</span>
      </div>
    );
  }

  if (page.type === 'blank') {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-blue-200 bg-[#e8f0fe]/30 rounded-xl h-24 text-center p-2 select-none relative transition-colors hover:bg-[#e8f0fe]/50">
        <span className="text-xs font-medium text-[#1a73e8]">Blank Page</span>
        <span className="text-[10px] text-[#1a73e8]/70 mt-0.5 leading-tight text-center">
          Keeps next file on front
        </span>
        <span className="absolute bottom-1.5 right-2 text-[10px] text-blue-500/60 font-mono font-medium">
          #{page.globalPageNum}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between border border-gray-200 bg-white rounded-xl h-24 p-3 relative shadow-xs hover:border-[#1a73e8]/30 transition-all duration-200">
      <div className="space-y-0.5 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate" title={page.fileName}>
          {page.fileName}
        </p>
        <p className="text-[10px] text-gray-400">
          Page {page.filePageNum}
        </p>
      </div>
      <div className="flex justify-between items-end mt-auto">
        <FileText className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[10px] text-gray-500 font-mono font-medium bg-[#f1f3f4] px-1.5 py-0.5 rounded border border-gray-200/50">
          Page {page.globalPageNum}
        </span>
      </div>
    </div>
  );
}

function SheetCard({ sheet }: { key?: React.Key; sheet: VisualSheet }) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-3 space-y-2 relative shadow-xs transition-shadow duration-200">
      <div className="flex justify-between items-center text-[10px] font-medium text-gray-400 select-none uppercase tracking-wider">
        <span>Sheet {sheet.sheetIndex}</span>
        <span>{sheet.back ? "Double-Sided" : "Single-Sided"}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <div className="text-[9px] uppercase tracking-wider text-gray-400 font-medium mb-1 text-center select-none">
            Front
          </div>
          <PageCell page={sheet.front} />
        </div>

        <div className="flex flex-col">
          <div className="text-[9px] uppercase tracking-wider text-gray-400 font-medium mb-1 text-center select-none">
            Back
          </div>
          <PageCell page={sheet.back} />
        </div>
      </div>
    </div>
  );
}

export default function PrintPreview({ files, ensureEvenPages }: PrintPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'sheets' | 'list'>('sheets');

  const isAnyFileProcessing = files.some(
    (f) => f.isProcessing || typeof f.pageCount === 'undefined'
  );

  if (isAnyFileProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-gray-500 bg-gray-50 rounded-2xl border border-gray-100/80">
        <Loader2 className="w-5 h-5 animate-spin text-[#1a73e8] mb-2" />
        <p className="font-medium text-gray-600 text-xs">Calculating print preview...</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Processing document pages</p>
      </div>
    );
  }

  const { sheets, pages, totalPagesCount, blankPagesCount } = getVisualSheets(files, ensureEvenPages);

  return (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800 select-none text-sm">
          Print Preview
        </h3>
        <div className="flex bg-[#f1f3f4] p-0.5 rounded-lg border border-gray-200">
          <button
            onClick={() => setPreviewMode('sheets')}
            className={cn(
              "px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer",
              previewMode === 'sheets'
                ? "bg-white text-gray-800 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            Sheets
          </button>
          <button
            onClick={() => setPreviewMode('list')}
            className={cn(
              "px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer",
              previewMode === 'list'
                ? "bg-white text-gray-800 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            Pages
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <StatsSummary 
          sheetCount={sheets.length} 
          pageCount={totalPagesCount} 
          blankCount={blankPagesCount} 
        />

        {previewMode === 'sheets' ? (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 max-h-[360px] overflow-y-auto space-y-3">
            {sheets.map((sheet) => (
              <SheetCard key={sheet.sheetIndex} sheet={sheet} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 max-h-[360px] overflow-y-auto space-y-2">
            {pages.map((page, idx) => {
              if (page.type === 'blank') {
                return (
                  <div
                    key={`list-blank-${idx}`}
                    className="flex items-center justify-between bg-[#e8f0fe]/30 border border-blue-100/60 rounded-xl px-3 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#1a73e8]">Blank Page</span>
                      <span className="text-[10px] text-[#1a73e8]/70 font-normal">
                        (Separates files)
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-500 font-mono font-medium">
                      Page {page.globalPageNum}
                    </span>
                  </div>
                );
              }
              return (
                <div
                  key={`list-page-${idx}`}
                  className="flex items-center justify-between bg-white border border-gray-200/60 hover:border-[#1a73e8]/20 rounded-xl px-3 py-2.5 text-xs shadow-2xs transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-700 truncate" title={page.fileName}>
                      {page.fileName}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      (Page {page.filePageNum})
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono font-medium shrink-0 bg-[#f8f9fa] px-1.5 py-0.5 rounded border border-gray-200/60">
                    Page {page.globalPageNum}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
