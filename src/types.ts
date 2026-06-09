export interface MergeFile {
  id: string;
  file: File;
  quantity: number;
  pdfBytes?: Uint8Array;
  pageCount?: number;
  isProcessing?: boolean;
}

export interface VisualPage {
  type: 'content' | 'blank';
  fileName?: string;
  filePageNum?: number;
  globalPageNum: number;
}

export interface VisualSheet {
  sheetIndex: number;
  front?: VisualPage;
  back?: VisualPage;
}

export interface ProcessedFile {
  bytes: Uint8Array;
  quantity: number;
}
