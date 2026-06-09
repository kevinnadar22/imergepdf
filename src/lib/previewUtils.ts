import { MergeFile, VisualPage, VisualSheet } from '../types';

/**
 * Calculates physical duplex sheets and visual page alignments for the current document sequence
 */
export const getVisualSheets = (
  files: MergeFile[],
  ensureEvenPages: boolean
): {
  sheets: VisualSheet[];
  pages: VisualPage[];
  totalPagesCount: number;
  blankPagesCount: number;
} => {
  const pages: VisualPage[] = [];
  let globalPageNum = 1;
  let blankPagesCount = 0;

  for (const item of files) {
    if (item.isProcessing || typeof item.pageCount === 'undefined') continue;

    for (let q = 0; q < item.quantity; q++) {
      for (let p = 1; p <= item.pageCount; p++) {
        pages.push({
          type: 'content',
          fileName: item.file.name,
          filePageNum: p,
          globalPageNum: globalPageNum++,
        });
      }

      if (ensureEvenPages && item.pageCount % 2 !== 0) {
        pages.push({
          type: 'blank',
          globalPageNum: globalPageNum++,
        });
        blankPagesCount++;
      }
    }
  }

  const sheets: VisualSheet[] = [];
  for (let i = 0; i < pages.length; i += 2) {
    sheets.push({
      sheetIndex: Math.floor(i / 2) + 1,
      front: pages[i],
      back: pages[i + 1],
    });
  }

  return { sheets, pages, totalPagesCount: pages.length, blankPagesCount };
};
