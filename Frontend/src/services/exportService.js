/**
 * Export Service — Client-side canvas export in multiple formats (PNG, JPG, PDF)
 * No external libraries required. Uses the browser Canvas API.
 */

/**
 * Trigger a file download in the browser
 * @param {Blob} blob - File blob
 * @param {string} filename - Download filename
 */
const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Sanitize a title for use as a filename
 * @param {string} title - Raw canvas title
 * @returns {string} Safe filename
 */
const sanitizeFilename = (title) => {
    return (title || 'canvas').replace(/[^a-z0-9_\-\s]/gi, '').replace(/\s+/g, '_');
};

/**
 * Export a canvas element as PNG
 * @param {HTMLCanvasElement} canvasElement - The canvas DOM element
 * @param {string} title - Canvas title for filename
 */
export const exportAsPNG = (canvasElement, title = 'canvas') => {
    if (!canvasElement) {
        console.error('[ExportService] No canvas element provided');
        return;
    }

    canvasElement.toBlob((blob) => {
        if (blob) {
            downloadBlob(blob, `${sanitizeFilename(title)}.png`);
        }
    }, 'image/png');
};

/**
 * Export a canvas element as JPG
 * @param {HTMLCanvasElement} canvasElement - The canvas DOM element
 * @param {string} title - Canvas title for filename
 * @param {number} quality - JPG quality (0-1), default 0.92
 */
export const exportAsJPG = (canvasElement, title = 'canvas', quality = 0.92) => {
    if (!canvasElement) {
        console.error('[ExportService] No canvas element provided');
        return;
    }

    // JPG doesn't support transparency, so draw on white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasElement.width;
    tempCanvas.height = canvasElement.height;
    const ctx = tempCanvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvasElement, 0, 0);

    tempCanvas.toBlob((blob) => {
        if (blob) {
            downloadBlob(blob, `${sanitizeFilename(title)}.jpg`);
        }
    }, 'image/jpeg', quality);
};

/**
 * Export a canvas element as PDF (single page, no external library)
 * Uses minimal PDF 1.4 spec generation from canvas image data.
 * @param {HTMLCanvasElement} canvasElement - The canvas DOM element
 * @param {string} title - Canvas title for filename
 */
export const exportAsPDF = (canvasElement, title = 'canvas') => {
    if (!canvasElement) {
        console.error('[ExportService] No canvas element provided');
        return;
    }

    // Get canvas as JPEG data URL (smaller than PNG for PDF embedding)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasElement.width;
    tempCanvas.height = canvasElement.height;
    const ctx = tempCanvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvasElement, 0, 0);

    const imgDataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
    const base64Data = imgDataUrl.split(',')[1];
    const binaryData = atob(base64Data);

    // Page dimensions (A4: 595.28 x 841.89 points)
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    // Scale canvas to fit page with margins
    const margin = 36; // 0.5 inch margins
    const availWidth = pageWidth - 2 * margin;
    const availHeight = pageHeight - 2 * margin;

    const canvasAspect = canvasElement.width / canvasElement.height;
    const pageAspect = availWidth / availHeight;

    let imgWidth, imgHeight;
    if (canvasAspect > pageAspect) {
        imgWidth = availWidth;
        imgHeight = availWidth / canvasAspect;
    } else {
        imgHeight = availHeight;
        imgWidth = availHeight * canvasAspect;
    }

    // Center on page
    const xOffset = margin + (availWidth - imgWidth) / 2;
    const yOffset = margin + (availHeight - imgHeight) / 2;

    // Build minimal PDF
    const offsets = [];
    let pdf = '';
    let objectCount = 0;

    const addObject = (content) => {
        objectCount++;
        offsets.push(pdf.length);
        pdf += `${objectCount} 0 obj\n${content}\nendobj\n`;
        return objectCount;
    };

    pdf += '%PDF-1.4\n';

    // Object 1: Catalog
    addObject('<< /Type /Catalog /Pages 2 0 R >>');

    // Object 2: Pages
    addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');

    // Object 3: Page
    addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /XObject << /Img 5 0 R >> >> >>`);

    // Object 4: Content stream (draw the image)
    const contentStream = `q ${imgWidth} 0 0 ${imgHeight} ${xOffset} ${yOffset} cm /Img Do Q`;
    addObject(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);

    // Object 5: Image XObject
    addObject(`<< /Type /XObject /Subtype /Image /Width ${canvasElement.width} /Height ${canvasElement.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${binaryData.length} >>\nstream\n${binaryData}\nendstream`);

    // Cross-reference table
    const xrefOffset = pdf.length;
    pdf += 'xref\n';
    pdf += `0 ${objectCount + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 0; i < objectCount; i++) {
        pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }

    // Trailer
    pdf += `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefOffset}\n%%EOF`;

    // Convert to binary blob (PDF can contain binary image data)
    const pdfArray = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) {
        pdfArray[i] = pdf.charCodeAt(i) & 0xFF;
    }

    const blob = new Blob([pdfArray], { type: 'application/pdf' });
    downloadBlob(blob, `${sanitizeFilename(title)}.pdf`);
};

/**
 * Export with format selection
 * @param {HTMLCanvasElement} canvasElement - The canvas DOM element
 * @param {string} format - 'png', 'jpg', or 'pdf'
 * @param {string} title - Canvas title for filename
 */
export const exportCanvas = (canvasElement, format, title = 'canvas') => {
    switch (format.toLowerCase()) {
        case 'png':
            return exportAsPNG(canvasElement, title);
        case 'jpg':
        case 'jpeg':
            return exportAsJPG(canvasElement, title);
        case 'pdf':
            return exportAsPDF(canvasElement, title);
        default:
            console.error(`[ExportService] Unsupported format: ${format}`);
    }
};

export default { exportAsPNG, exportAsJPG, exportAsPDF, exportCanvas };
