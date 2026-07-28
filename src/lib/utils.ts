import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { AnnotationLine, AutoDetectFeature } from "../types"
import { jsPDF } from "jspdf"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const minMath = (a: number, b: number) => a < b ? a : b;

export function mergeAnnotationsWithImage(
  dataUrl: string, 
  annotations: AnnotationLine[], 
  autoFeatures: AutoDetectFeature[] = [],
  naturalW?: number, 
  naturalH?: number
): Promise<string> {
  return new Promise((resolve) => {
    if (annotations.length === 0 && autoFeatures.length === 0) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = naturalW || img.width;
      const h = naturalH || img.height;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      
      // Draw manual annotations
      annotations.forEach(line => {
        ctx.strokeStyle = line.color;
        ctx.fillStyle = line.color;
        
        if (line.type === 'text' && line.text) {
          ctx.font = `bold ${Math.max(14, line.brushSize)}px sans-serif`;
          ctx.textBaseline = 'middle';
          ctx.fillText(line.text, line.points[0].x, line.points[0].y);
          return;
        }

        if (line.points.length < 2 && line.type !== 'freehand') return;
        
        ctx.lineWidth = line.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        const start = line.points[0];
        const end = line.points[line.points.length - 1];

        if (line.type === 'rectangle') {
          const w = end.x - start.x;
          const h = end.y - start.y;
          ctx.rect(start.x, start.y, w, h);
          ctx.stroke();
        } else if (line.type === 'circle') {
          const rx = Math.abs(end.x - start.x) / 2;
          const ry = Math.abs(end.y - start.y) / 2;
          const cx = minMath(start.x, end.x) + rx;
          const cy = minMath(start.y, end.y) + ry;
          ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
          ctx.stroke();
        } else {
          ctx.moveTo(start.x, start.y);
          for (let i = 1; i < line.points.length; i++) {
            ctx.lineTo(line.points[i].x, line.points[i].y);
          }
          ctx.stroke();
        }
      });
      
      // Draw auto-detected features
      autoFeatures.forEach(f => {
        const x = (f.x * w) / 100;
        const y = (f.y * h) / 100;
        const fw = (f.width * w) / 100;
        const fh = (f.height * h) / 100;

        ctx.strokeStyle = '#10b981';
        ctx.fillStyle = '#10b981';
        ctx.lineWidth = Math.max(2, w / 400);
        ctx.setLineDash([4, 2]);
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        
        ctx.beginPath();
        ctx.rect(x, y, fw, fh);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.font = `bold ${Math.max(10, w / 80)}px sans-serif`;
        ctx.textBaseline = 'bottom';
        // A little shadow or outline could help, but simple fill is fine.
        ctx.fillText(f.label, x, y - 5);
      });

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  downloadBlob(filename.endsWith('.txt') ? filename : `${filename}.txt`, blob);
}

export function exportAsJSON(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  downloadBlob(filename.endsWith('.json') ? filename : `${filename}.json`, blob);
}

export function exportAsCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = cell instanceof Date
          ? cell.toLocaleString()
          : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(filename.endsWith('.csv') ? filename : `${filename}.csv`, blob);
}

export function exportAsGeoJSON(filename: string, annotations: AnnotationLine[]) {
  const features = annotations.map(anno => ({
    type: "Feature",
    properties: {
      type: anno.type,
      color: anno.color,
      brushSize: anno.brushSize,
      text: anno.text || ""
    },
    geometry: {
      type: anno.type === 'circle' || anno.type === 'rectangle' ? 'Polygon' : (anno.type === 'text' ? 'Point' : 'LineString'),
      coordinates: anno.points.map(p => [p.x, p.y])
    }
  }));

  const geoJson = {
    type: "FeatureCollection",
    features
  };

  const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/geo+json;charset=utf-8' });
  downloadBlob(filename.endsWith('.geojson') ? filename : `${filename}.geojson`, blob);
}

export async function exportAsPDF(filename: string, recordTitle: string, annotatedImageDataUrl: string, analysisText: string) {
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Title
  pdf.setFontSize(18);
  pdf.setTextColor(40, 40, 40);
  pdf.text("Satellite Analysis Report", margin, 20);
  
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(recordTitle, margin, 26);
  
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, 30, pageWidth - margin, 30);

  // Image
  try {
    const img = new Image();
    img.src = annotatedImageDataUrl;
    await new Promise((resolve) => { img.onload = resolve; });
    
    const imgRatio = img.height / img.width;
    let targetW = contentWidth;
    let targetH = targetW * imgRatio;
    
    // Constraints
    if (targetH > 120) {
      targetH = 120;
      targetW = targetH / imgRatio;
    }

    pdf.addImage(annotatedImageDataUrl, 'JPEG', margin + (contentWidth - targetW) / 2, 35, targetW, targetH);
    
    // Text below
    pdf.setFontSize(12);
    pdf.setTextColor(40, 40, 40);
    pdf.text("Analysis Findings", margin, 40 + targetH + 10);
    
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    
    // Clean text for PDF (remove markdown bold/italic markers)
    const cleanText = analysisText
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*\s?/g, "")
      .replace(/\*\s?/g, "• ")
      .replace(/---/g, "-------------------");

    const splitText = pdf.splitTextToSize(cleanText, contentWidth);
    let currentY = 40 + targetH + 18;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const lineHeight = 5; // 5mm roughly matches 10pt font with spacing

    splitText.forEach((line: string) => {
      if (currentY + lineHeight > pageHeight - margin) {
        pdf.addPage();
        currentY = margin + 10; // Top of the new page
      }
      pdf.text(line, margin, currentY);
      currentY += lineHeight;
    });

  } catch (e) {
    console.warn("PDF image embedding failed", e);
    pdf.text("Error embedding image in report", margin, 40);
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export async function exportComparisonAsPDF(
  filename: string, 
  title: string, 
  imgA: string, 
  imgB: string, 
  comparisonText: string
) {
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Title
  pdf.setFontSize(18);
  pdf.setTextColor(40, 40, 40);
  pdf.text("Differential Analysis Report", margin, 20);
  
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(title, margin, 26);
  
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, 30, pageWidth - margin, 30);

  // Images side by side
  try {
     const [imageA, imageB] = await Promise.all([
        new Promise<HTMLImageElement>((resolve) => { const img = new Image(); img.onload = () => resolve(img); img.src = imgA; }),
        new Promise<HTMLImageElement>((resolve) => { const img = new Image(); img.onload = () => resolve(img); img.src = imgB; })
     ]);

     const halfWidth = (contentWidth - 5) / 2;
     
     const ratioA = imageA.height / imageA.width;
     const hA = halfWidth * ratioA;
     
     const ratioB = imageB.height / imageB.width;
     const hB = halfWidth * ratioB;

     const targetH = Math.min(hA, hB, 80);
     const targetWA = targetH / ratioA;
     const targetWB = targetH / ratioB;

     pdf.addImage(imgA, 'JPEG', margin, 35, targetWA, targetH);
     pdf.addImage(imgB, 'JPEG', margin + halfWidth + 5, 35, targetWB, targetH);
     
     pdf.setFontSize(8);
     pdf.text("Dataset A", margin, 35 + targetH + 5);
     pdf.text("Dataset B", margin + halfWidth + 5, 35 + targetH + 5);

     // Text below
     pdf.setFontSize(12);
     pdf.setTextColor(40, 40, 40);
     let yPos = 35 + targetH + 15;
     pdf.text("Comparison Report", margin, yPos);
     yPos += 8;

     pdf.setFontSize(10);
     pdf.setTextColor(60, 60, 60);

     const cleanText = comparisonText
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*\s?/g, "")
      .replace(/\*\s?/g, "• ")
      .replace(/---/g, "-------------------");

    const splitText = pdf.splitTextToSize(cleanText, contentWidth);
    const pageHeight = pdf.internal.pageSize.getHeight();
    const lineHeight = 5;

    splitText.forEach((line: string) => {
      if (yPos + lineHeight > pageHeight - margin) {
        pdf.addPage();
        yPos = margin + 10;
      }
      pdf.text(line, margin, yPos);
      yPos += lineHeight;
    });

  } catch (e) {
    console.error("Comparison PDF failed", e);
  }

  pdf.save(filename);
}
