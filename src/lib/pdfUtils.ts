import { PDFDocument } from 'pdf-lib';
import * as mammoth from 'mammoth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

async function docxToPdfBuffer(file: File): Promise<ArrayBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  
  const container = document.createElement('div');
  container.innerHTML = result.value || '<p>Blank document</p>';
  container.style.width = '794px'; // A4 width at 96 DPI
  container.style.padding = '40px';
  container.style.backgroundColor = 'white';
  container.style.color = 'black';
  container.style.fontFamily = 'Helvetica, Arial, sans-serif';
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    
    const ratio = pdfWidth / canvas.width;
    const scaledHeight = canvas.height * ratio;

    let heightLeft = scaledHeight;
    let position = 0;

    doc.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position -= pdfHeight;
      doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;
    }

    return doc.output('arraybuffer');
  } finally {
    document.body.removeChild(container);
  }
}


async function textToPdfBuffer(file: File): Promise<ArrayBuffer> {
  const text = await file.text();
  const doc = new jsPDF('p', 'pt', 'a4');
  
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  
  const margin = 40;
  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = doc.internal.pageSize.getHeight();
  const maxLineWidth = pdfWidth - margin * 2;
  
  // Replace tabs with spaces for better rendering
  const sanitizedText = text.replace(/\t/g, '    ');
  const lines = doc.splitTextToSize(sanitizedText, maxLineWidth);
  
  let cursorY = margin + 10;
  const lineHeight = 14; 
  
  for (let i = 0; i < lines.length; i++) {
    if (cursorY + lineHeight > pdfHeight - margin) {
      doc.addPage();
      cursorY = margin + 10;
    }
    doc.text(lines[i], margin, cursorY);
    cursorY += lineHeight;
  }
  
  return doc.output('arraybuffer');
}

async function excelToPdfBuffer(file: File): Promise<ArrayBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const csv = XLSX.utils.sheet_to_csv(sheet);
  
  // We can reuse the textToPdfBuffer logic by passing a mock File
  const mockFile = new File([csv], 'mock.txt', { type: 'text/plain' });
  return textToPdfBuffer(mockFile);
}

/**
 * Converts any browser-supported image file to a standard JPG ArrayBuffer.
 * This ensures broad format support (webp, gif, etc.) by using HTMLCanvas.
 */
async function imageToJpgBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw white background in case of transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              blob.arrayBuffer().then(resolve).catch(reject);
            } else {
              reject(new Error('Canvas conversion failed'));
            }
          },
          'image/jpeg',
          0.95
        );
      } else {
        reject(new Error('No canvas context available'));
      }
      URL.revokeObjectURL(url);
    };
    
    img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
    img.src = url;
  });
}

export async function convertToPdfBytes(file: File): Promise<{ bytes: Uint8Array, pageCount: number }> {
  const mergedPdf = await PDFDocument.create();

  if (file.type === 'application/pdf') {
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      return { bytes: new Uint8Array(buffer), pageCount: pdf.getPageCount() };
    } catch (err) {
      console.error(`Failed to load PDF ${file.name}:`, err);
      throw new Error(`Failed to process PDF: ${file.name}. It might be encrypted or malformed.`);
    }
  } else if (file.name.toLowerCase().match(/\.(docx)$/) || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const buffer = await docxToPdfBuffer(file);
      const pdf = await PDFDocument.load(buffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      return { bytes: await mergedPdf.save(), pageCount: pdf.getPageCount() };
    } catch (err) {
      console.error(`Failed to process DOCX ${file.name}:`, err);
      throw new Error(`Failed to process Word Document: ${file.name}.`);
    }
  } else if (file.name.toLowerCase().match(/\.(xlsx|xls|csv)$/) || 
             file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
             file.type === 'application/vnd.ms-excel') {
    try {
      const buffer = await excelToPdfBuffer(file);
      const pdf = await PDFDocument.load(buffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      return { bytes: await mergedPdf.save(), pageCount: pdf.getPageCount() };
    } catch (err) {
      console.error(`Failed to process Excel ${file.name}:`, err);
      throw new Error(`Failed to process Excel Document: ${file.name}.`);
    }
  } else if (file.type.startsWith('text/') || 
             file.name.toLowerCase().match(/\.(txt|csv|md|json|log|xml)$/)) {
    try {
      const buffer = await textToPdfBuffer(file);
      const pdf = await PDFDocument.load(buffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      return { bytes: await mergedPdf.save(), pageCount: pdf.getPageCount() };
    } catch (err) {
      console.error(`Failed to process Text File ${file.name}:`, err);
      throw new Error(`Failed to process Text Document: ${file.name}.`);
    }
  } else if (file.type.startsWith('image/')) {
    try {
      const buffer = await imageToJpgBuffer(file);
      const image = await mergedPdf.embedJpg(buffer);
      
      const page = mergedPdf.addPage([595.28, 841.89]);
      const { width: pageWidth, height: pageHeight } = page.getSize();
      
      const imgWidth = image.width;
      const imgHeight = image.height;
      
      const margin = 30;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      
      const widthRatio = maxWidth / imgWidth;
      const heightRatio = maxHeight / imgHeight;
      const ratio = Math.min(widthRatio, heightRatio, 1);
      
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;
      
      const xText = (pageWidth - scaledWidth) / 2;
      const yText = (pageHeight - scaledHeight) / 2;
      
      page.drawImage(image, {
        x: xText,
        y: yText,
        width: scaledWidth,
        height: scaledHeight,
      });
      return { bytes: await mergedPdf.save(), pageCount: 1 };
    } catch (err) {
      console.error(`Failed to process image ${file.name}:`, err);
      throw new Error(`Failed to process image: ${file.name}`);
    }
  } else {
    throw new Error(`Unsupported format: ${file.name}. Please convert to PDF or Image first.`);
  }
}

export type ProcessedFile = {
  bytes: Uint8Array;
  quantity: number;
};

export async function mergePreprocessedFilesToPdf(
  files: ProcessedFile[],
  ensureEvenPages: boolean
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const pdf = await PDFDocument.load(file.bytes);
    const indices = pdf.getPageIndices();
    
    for (let q = 0; q < file.quantity; q++) {
      const copiedPages = await mergedPdf.copyPages(pdf, indices);
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
      
      if (ensureEvenPages) {
        const pagesSoFar = mergedPdf.getPageCount();
        if (pagesSoFar > 0 && pagesSoFar % 2 !== 0) {
           mergedPdf.addPage([595.28, 841.89]);
        }
      }
    }
  }

  return await mergedPdf.save();
}
