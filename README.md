# IMergePDF

A private, 100% client-side document merger, sequence planner, and print cost estimator. Easily combine PDFs, images, Word documents, Excel sheets, and text files into a single print-ready PDF.

## The Pain Point

Sending files one by one to print shops with confusing copy guidelines is hectic:
> *"Print 3 copies of document A, 2 copies of document B, and print double-sided but keep them separate."*

This often leads to double-sided printing issues, where the first page of Document B gets printed on the back of the last page of Document A. 

**IMergePDF solves this locally before your files ever leave your machine.**

---

## Features

- **Multi-Format Support:** Drop in PDFs, Images (`png`, `jpg`, `webp`, `gif`, `bmp`, `heic`), Word Docs (`docx`), Excel Sheets (`xlsx`/`xls`), and Text Files (`txt`, `csv`, `md`, `json`, `log`, `xml`) simultaneously.
- **Drag-and-Drop Sequence Planner:** Rearrange the print sequence instantly.
- **Copy Count Multipliers:** Set custom print quantities for individual files in the sequence.
- **Duplex Protection ("Taking Printout?"):** Automatically appends a blank page at the end of files with odd page counts, preventing document overlap on double-sided printouts.
- **Live Print Layout Preview:** Visualizes physical sheets of paper (Front and Back sides) to show exactly how your pages will align on paper.
- **Print Cost Estimator:** Real-time calculation of your printing cost based on a customizable page rate (automatically excludes blank pages from the bill).
- **100% Client-Side Privacy:** No document is ever uploaded to a server. All processing (rendering, page counting, and PDF merging) runs locally in your browser.

---

## Tech Stack

- **Core:** React 19, TypeScript
- **Styling:** Tailwind CSS, Framer Motion (animations)
- **PDF Manipulation:** `pdf-lib`, `jspdf`, `html2canvas`
- **Parsing Engines:** `mammoth` (Word docx), `xlsx` (Excel sheets)
- **Build Tool:** Vite

---

## Run Locally

### Prerequisites
Make sure you have **Node.js** installed.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open the browser:**
   Open the address printed in the terminal (usually `http://localhost:3000` or `http://localhost:3001`).
