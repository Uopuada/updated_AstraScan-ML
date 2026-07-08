export interface Point {
  x: number;
  y: number;
}

export type AnnotationType = 'freehand' | 'rectangle' | 'circle' | 'text' | 'line' | 'polygon' | 'polyline';

export interface AnnotationLine {
  id: string;
  type: AnnotationType;
  points: Point[];
  color: string;
  brushSize: number;
  text?: string;
}

export interface AutoDetectFeature {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface AutoDetectResult {
  features: AutoDetectFeature[];
}

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  fileName: string;
  imageDataUrl: string;
  base64Data: string;
  mimeType: string;
  analysisResult: string | null;
  annotations: AnnotationLine[];
  metadata?: {
    size: number;
    lastModified: number;
    dimensions: string;
  };
}

export interface CompareDifference {
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
}

export interface CompareResult {
  markdownReport: string;
  differences: CompareDifference[];
}

export type ViewMode = 'single' | 'compare' | 'history' | 'batch';
