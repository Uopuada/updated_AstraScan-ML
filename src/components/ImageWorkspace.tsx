import React, { useRef, useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
  UploadCloud, X, Edit2, Hand, ZoomIn, ZoomOut, RotateCcw, RotateCw, 
  Trash2, Circle, Square, Type as TypeIcon, Crop as CropIcon, Ruler,
  Undo2, Redo2, Layers, Pentagon, Spline, MousePointer2, Eye, EyeOff,
  ArrowLeftRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { AnnotationLine, Point, AutoDetectFeature } from '../types';
import { cn } from '../lib/utils';

type ToolType = 'pan' | 'freehand' | 'rectangle' | 'circle' | 'text' | 'crop' | 'measure' | 'polygon' | 'polyline';

interface ImageWorkspaceProps {
  imageDataUrl: string | null;
  annotations: AnnotationLine[];
  autoFeatures?: AutoDetectFeature[];
  onImageUpload: (file: File) => void;
  onClearImage: () => void;
  onAnnotationsChange: (annotations: AnnotationLine[]) => void;
  isAnalyzing: boolean;
  readOnly?: boolean;
  onImageEdited?: (newDataUrl: string, newBase64: string) => void;
  onTransform?: (ref: any) => void;
  syncTransform?: any;
}

export function ImageWorkspace({
  imageDataUrl,
  annotations,
  autoFeatures = [],
  onImageUpload,
  onClearImage,
  onAnnotationsChange,
  isAnalyzing,
  readOnly = false,
  onImageEdited,
  onTransform,
  syncTransform
}: ImageWorkspaceProps) {
  const [tool, setTool] = useState<ToolType>('pan');
  const [color, setColor] = useState<string>('#3b82f6');
  const [isDrawing, setIsDrawing] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  
  const [textInput, setTextInput] = useState<{ x: number, y: number, show: boolean, val: string } | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [pixelsPerMeter, setPixelsPerMeter] = useState<number>(10);
  
  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState<AnnotationLine[][]>([]);
  const [redoStack, setRedoStack] = useState<AnnotationLine[][]>([]);

  // Layer Visibility
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showAutoFeatures, setShowAutoFeatures] = useState(true);
  
  // Multi-point tool state
  const [tempPoints, setTempPoints] = useState<Point[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const toolbarScrollRef = useRef<HTMLDivElement>(null);

  const scrollToolbar = (direction: 'left' | 'right') => {
    if (toolbarScrollRef.current) {
      const scrollAmount = 200;
      toolbarScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (textInput?.show && textInputRef.current) {
      setTimeout(() => textInputRef.current?.focus(), 50);
    }
  }, [textInput?.show]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFile = (file: File) => {
    onImageUpload(file);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImgSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    if (!svgRef.current) return null;
    let clientX, clientY;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = imgSize.w / rect.width;
    const scaleY = imgSize.h / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const updateAnnotationsWithHistory = (newAnnotations: AnnotationLine[]) => {
    setUndoStack(prev => [...prev, annotations]);
    setRedoStack([]);
    onAnnotationsChange(newAnnotations);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, annotations]);
    setUndoStack(prev => prev.slice(0, -1));
    onAnnotationsChange(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, annotations]);
    setRedoStack(prev => prev.slice(0, -1));
    onAnnotationsChange(next);
  };

  const handleRotate = (degrees: number) => {
    if (!imageDataUrl || !onImageEdited) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      if (degrees === 90 || degrees === -90 || degrees === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(degrees * Math.PI / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      const newUrl = canvas.toDataURL('image/jpeg', 0.95);
      onAnnotationsChange([]); // Rotating invalidates old geometries
      setCropRect(null);
      onImageEdited(newUrl, newUrl.split(',')[1]);
      setImgSize({ w: canvas.width, h: canvas.height });
    };
    img.src = imageDataUrl;
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'pan' || readOnly) return;
    const pt = getCoordinates(e);
    if (!pt) return;

    if (tool === 'text') {
       setTextInput({ x: pt.x, y: pt.y, show: true, val: "" });
       return;
    }

    if (tool === 'crop') {
       setIsDrawing(true);
       setCropRect({ x: pt.x, y: pt.y, w: 0, h: 0 });
       return;
    }

    if (tool === 'polygon' || tool === 'polyline') {
       if (tempPoints.length > 0) {
          const firstPoint = tempPoints[0];
          const dist = Math.sqrt(Math.pow(pt.x - firstPoint.x, 2) + Math.pow(pt.y - firstPoint.y, 2));
          const threshold = imgSize.w / 50; // threshold to close polygon

          if (tool === 'polygon' && tempPoints.length > 2 && dist < threshold) {
             finishMultiPoint();
             return;
          }
       }
       setTempPoints(prev => [...prev, pt]);
       return;
    }

    setIsDrawing(true);
    const mappedTool = tool === 'measure' ? 'line' : tool as any;
    
    const newLine: AnnotationLine = {
      id: crypto.randomUUID(),
      type: mappedTool,
      points: [pt, pt],
      color,
      brushSize: Math.max(2, imgSize.w / 200),
    };
    updateAnnotationsWithHistory([...annotations, newLine]);
  };

  const finishMultiPoint = () => {
    if (tempPoints.length < 2) {
      setTempPoints([]);
      return;
    }
    const newLine: AnnotationLine = {
      id: crypto.randomUUID(),
      type: tool as any,
      points: [...tempPoints],
      color,
      brushSize: Math.max(2, imgSize.w / 200),
    };
    updateAnnotationsWithHistory([...annotations, newLine]);
    setTempPoints([]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool === 'pan' || tool === 'text' || readOnly) return;
    const pt = getCoordinates(e);
    if (!pt) return;
    
    if (tool === 'crop' && cropRect) {
      setCropRect({ ...cropRect, w: pt.x - cropRect.x, h: pt.y - cropRect.y });
      return;
    }

    const currentLines = [...annotations];
    const lastLine = currentLines[currentLines.length - 1];
    
    if (tool === 'freehand') {
      lastLine.points.push(pt);
      onAnnotationsChange(currentLines); // Don't push to history on every move
    } else if (tool !== 'polygon' && tool !== 'polyline') {
      lastLine.points[1] = pt; 
      onAnnotationsChange(currentLines);
    }
  };

  const stopDrawing = () => {
    if (tool === 'polygon' || tool === 'polyline') return;
    setIsDrawing(false);
    if (tool === 'measure') {
       // Append textual measurement label at the midpoint
       const currentLines = [...annotations];
       if (currentLines.length === 0) return;
       const lastLine = currentLines[currentLines.length - 1];
       if (lastLine.type === 'line' && lastLine.points.length >= 2) {
          const start = lastLine.points[0];
          const end = lastLine.points[1];
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const pxDist = Math.sqrt(dx * dx + dy * dy);
          const meters = pxDist / pixelsPerMeter;
          const labelDist = meters > 1000 ? `${(meters/1000).toFixed(2)} km` : `${meters.toFixed(1)} m`;

          const midX = start.x + dx / 2;
          const midY = start.y + dy / 2;

          const textAnnotation: AnnotationLine = {
             id: crypto.randomUUID(),
             type: 'text',
             points: [{ x: midX, y: midY - 15 }], // slightly above line
             color,
             brushSize: Math.max(14, imgSize.w / 50),
             text: labelDist
          };
          updateAnnotationsWithHistory([...currentLines, textAnnotation]);
       }
       setTool('pan');
    }
  };

  const commitTextAnnotation = () => {
     if (textInput && textInput.val.trim().length > 0) {
        const newAnnotation: AnnotationLine = {
          id: crypto.randomUUID(),
          type: 'text',
          points: [{ x: textInput.x, y: textInput.y }],
          color,
          brushSize: Math.max(14, imgSize.w / 50),
          text: textInput.val.trim()
        };
        updateAnnotationsWithHistory([...annotations, newAnnotation]);
     }
     setTextInput(null);
  };

  const handleKeyDownText = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitTextAnnotation();
    } else if (e.key === 'Escape') {
      setTextInput(null);
    }
  };

  const clearAnnotations = () => {
    onAnnotationsChange([]);
  };

  const applyCrop = () => {
    if (!cropRect || !imageDataUrl || !onImageEdited) return;
    
    // Normalize negative dimensions
    const minX = Math.max(0, Math.min(cropRect.x, cropRect.x + cropRect.w));
    const minY = Math.max(0, Math.min(cropRect.y, cropRect.y + cropRect.h));
    const width = Math.min(imgSize.w - minX, Math.abs(cropRect.w));
    const height = Math.min(imgSize.h - minY, Math.abs(cropRect.h));
    
    if (width < 10 || height < 10) {
      setCropRect(null);
      setTool('pan');
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(img, minX, minY, width, height, 0, 0, width, height);
      
      const newUrl = canvas.toDataURL('image/jpeg', 0.95);
      onAnnotationsChange([]);
      setUndoStack([]);
      setRedoStack([]);
      setCropRect(null);
      setTool('pan');
      onImageEdited(newUrl, newUrl.split(',')[1]);
      setImgSize({ w: width, h: height });
    };
    img.src = imageDataUrl;
  };

  const renderAnnotation = (line: AnnotationLine) => {
    if (!line.points || line.points.length === 0) return null;
    
    if (line.type === 'text' && line.text) {
       return (
         <text 
            key={line.id} 
            x={line.points[0].x} 
            y={line.points[0].y} 
            fill={line.color} 
            fontSize={line.brushSize}
            fontFamily="sans-serif"
            fontWeight="bold"
            alignmentBaseline="middle"
         >
           {line.text}
         </text>
       );
    }

    if (line.points.length < 1) return null;
    const start = line.points[0];
    const end = line.points[line.points.length - 1];

    if (line.type === 'rectangle' && line.points.length >= 2) {
       const minX = Math.min(start.x, end.x);
       const minY = Math.min(start.y, end.y);
       const width = Math.abs(end.x - start.x);
       const height = Math.abs(end.y - start.y);
       return (
         <rect 
           key={line.id} x={minX} y={minY} width={width} height={height} 
           fill="none" stroke={line.color} strokeWidth={line.brushSize} strokeLinecap="round" strokeLinejoin="round"
         />
       );
    }

    if (line.type === 'circle' && line.points.length >= 2) {
       const rx = Math.abs(end.x - start.x) / 2;
       const ry = Math.abs(end.y - start.y) / 2;
       const cx = Math.min(start.x, end.x) + rx;
       const cy = Math.min(start.y, end.y) + ry;
       return (
         <ellipse 
           key={line.id} cx={cx} cy={cy} rx={rx} ry={ry} 
           fill="none" stroke={line.color} strokeWidth={line.brushSize} 
         />
       );
    }
    
    if (line.type === 'line' && line.points.length >= 2) {
       return (
          <line
            key={line.id}
            x1={start.x} y1={start.y}
            x2={end.x} y2={end.y}
            stroke={line.color}
            strokeWidth={line.brushSize}
            strokeLinecap="round"
          />
       );
    }

    if (line.type === 'polygon') {
      return (
        <polygon
          key={line.id}
          points={line.points.map(p => `${p.x},${p.y}`).join(' ')}
          fill={line.color + "33"} // semi-transparent fill
          stroke={line.color}
          strokeWidth={line.brushSize}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    return (
      <polyline
        key={line.id}
        points={line.points.map(p => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke={line.color}
        strokeWidth={line.brushSize}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };

  const minMath = (a: number, b: number) => a < b ? a : b;

  if (!imageDataUrl) {
    return (
      <div 
        className="w-full h-full border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl flex flex-col items-center justify-center p-8 text-center transition-colors cursor-pointer group min-h-[300px]"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="mx-auto h-12 w-12 text-slate-400 mb-4 flex items-center justify-center group-hover:text-blue-500 transition-colors">
          <UploadCloud className="w-8 h-8" />
        </div>
        <p className="text-sm font-medium text-slate-700">Drop high-res imagery or <span className="text-blue-600">browse local files</span></p>
        <p className="text-xs text-slate-400 mt-1">Supported: GeoTIFF, JPG, PNG, WebP (Max 10MB)</p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    );
  }

  const isDrawingMode = tool !== 'pan' && tool !== 'crop';

  return (
    <div className="relative w-full h-full flex flex-col rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-inner group/workspace">
      
      {/* Toolbar */}
      {!readOnly && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center bg-slate-800/90 backdrop-blur-md rounded-lg border border-slate-600 shadow-xl opacity-100 md:opacity-0 md:group-hover/workspace:opacity-100 transition-opacity max-w-[calc(100%-2rem)] min-w-[40px]">
          <button 
             onClick={() => scrollToolbar('left')}
             className="px-2 self-stretch hover:bg-slate-700/50 hover:text-white text-slate-400 border-r border-slate-600 flex items-center justify-center shrink-0 transition-colors rounded-l-lg"
             title="Scroll Left"
          >
             <ChevronLeft className="w-4 h-4" />
          </button>
          <div ref={toolbarScrollRef} className="flex items-center gap-1 p-1.5 overflow-x-auto custom-scrollbar-hide whitespace-nowrap min-w-0 scroll-smooth">
            <button 
              type="button" onClick={() => { setTool('pan'); setCropRect(null); setTempPoints([]); }} 
              className={cn("p-1.5 rounded hover:bg-slate-700 text-slate-300 shrink-0", tool === 'pan' && 'bg-blue-600 text-white hover:bg-blue-600')} title="Pan/Zoom">
              <Hand className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-slate-600 mx-1 shrink-0" />

            <button 
              type="button" onClick={handleUndo} disabled={undoStack.length === 0}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 shrink-0" title="Undo Action">
              <Undo2 className="w-4 h-4" />
            </button>
            <button 
              type="button" onClick={handleRedo} disabled={redoStack.length === 0}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 shrink-0" title="Redo Action">
              <Redo2 className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-slate-600 mx-1 shrink-0" />

            {onImageEdited && (
               <>
                 <button 
                   type="button" onClick={() => handleRotate(-90)} 
                   className="p-1.5 rounded hover:bg-slate-700 text-slate-300 shrink-0" title="Rotate Left 90°">
                   <RotateCcw className="w-4 h-4" />
                 </button>
                 <button 
                   type="button" onClick={() => handleRotate(90)} 
                   className="p-1.5 rounded hover:bg-slate-700 text-slate-300 shrink-0" title="Rotate Right 90°">
                   <RotateCw className="w-4 h-4" />
                 </button>
                 <button 
                   type="button" onClick={() => { setTool('crop'); setCropRect(null); setTempPoints([]); }} 
                   className={cn("p-1.5 rounded hover:bg-slate-700 text-slate-300 shrink-0", tool === 'crop' && 'bg-blue-600 text-white')} title="Crop Imagery">
                   <CropIcon className="w-4 h-4" />
                 </button>
                 <div className="w-px h-6 bg-slate-600 mx-1 shrink-0" />
               </>
            )}

            <button 
              type="button" onClick={() => { setTool('freehand'); setCropRect(null); setTempPoints([]); }} 
              className={cn("p-1.5 rounded hover:bg-slate-700 text-slate-300 shrink-0", tool === 'freehand' && 'bg-blue-600 text-white')} title="Draw Route">
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              type="button" onClick={() => { setTool('rectangle'); setCropRect(null); setTempPoints([]); }} 
              className={cn("p-1.5 rounded hover:bg-slate-700 text-slate-300 shrink-0", tool === 'rectangle' && 'bg-blue-600 text-white')} title="Rectangle Highlight">
              <Square className="w-4 h-4" />
            </button>
            <button 
              type="button" onClick={() => { setTool('circle'); setCropRect(null); setTempPoints([]); }} 
              className={cn("p-1.5 rounded hover:bg-slate-700 text-slate-300 shrink-0", tool === 'circle' && 'bg-blue-600 text-white')} title="Circular Highlight">
              <Circle className="w-4 h-4" />
            </button>
            <button 
              type="button" onClick={() => { setTool('polygon'); setCropRect(null); setTempPoints([]); }} 
              className={cn("p-1.5 rounded hover:bg-slate-700 text-slate-300 shrink-0", tool === 'polygon' && 'bg-blue-600 text-white')} title="Polygon Shape">
              <Pentagon className="w-4 h-4" />
            </button>
            <button 
              type="button" onClick={() => { setTool('polyline'); setCropRect(null); setTempPoints([]); }} 
              className={cn("p-1.5 rounded hover:bg-slate-700 text-slate-300 shrink-0", tool === 'polyline' && 'bg-blue-600 text-white')} title="Polyline Path">
              <Spline className="w-4 h-4" />
            </button>
            <button 
              type="button" onClick={() => { setTool('text'); setCropRect(null); setTempPoints([]); }} 
              className={cn("p-1.5 rounded hover:bg-slate-700 text-slate-300 shrink-0", tool === 'text' && 'bg-blue-600 text-white')} title="Add Text Label">
              <TypeIcon className="w-4 h-4" />
            </button>
            <button 
              type="button" onClick={() => { setTool('measure'); setCropRect(null); setTempPoints([]); }} 
              className={cn("p-1.5 rounded hover:bg-slate-700 text-slate-300 shrink-0", tool === 'measure' && 'bg-blue-600 text-white')} title="Measure Distance">
              <Ruler className="w-4 h-4" />
            </button>

            {(tempPoints.length > 0) && (
              <button 
                type="button"
                onClick={finishMultiPoint}
                className="ml-2 px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] uppercase font-bold rounded shrink-0"
              >
                Finish
              </button>
            )}

            <div className="w-px h-6 bg-slate-600 mx-1 shrink-0" />

            <div className="flex items-center gap-1 px-1 shrink-0">
               <button 
                 type="button"
                 onClick={() => setShowAnnotations(!showAnnotations)} 
                 className={cn("px-2 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition-colors", showAnnotations ? "bg-blue-600/20 text-blue-400" : "text-slate-500 hover:bg-slate-700")}
                 title="Toggle Manual Annotations layer"
               >
                 {showAnnotations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                 <span>Manual</span>
               </button>
               <button 
                 type="button"
                 onClick={() => setShowAutoFeatures(!showAutoFeatures)} 
                 className={cn("px-2 py-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition-colors", showAutoFeatures ? "bg-emerald-600/20 text-emerald-400" : "text-slate-500 hover:bg-slate-700")}
                 title="Toggle AI Features layer"
               >
                 {showAutoFeatures ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                 <span>AI Features</span>
               </button>
            </div>

            {tool === 'measure' && (
               <div className="flex items-center gap-2 px-2 border-l border-slate-600 ml-1 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Scale (px/m)</span>
                  <input 
                    type="number"
                    value={pixelsPerMeter}
                    onChange={(e) => setPixelsPerMeter(Number(e.target.value))}
                    className="w-12 h-6 text-xs bg-slate-700 border border-slate-600 rounded text-white px-1 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
               </div>
            )}
            
            <div className="flex items-center shrink-0">
              <div className="w-px h-6 bg-slate-600 mx-1" />
              <div className="flex items-center gap-1 mr-1">
                {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ffffff'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn("w-5 h-5 rounded-full border-2 transition-transform", color === c ? 'border-zinc-300 scale-110' : 'border-transparent scale-90')}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="w-px h-6 bg-slate-600 mx-1" />
                <button 
                  type="button" onClick={clearAnnotations} 
                  className="p-1.5 rounded hover:bg-red-500/20 text-slate-300 hover:text-red-400" title="Clear All Annotations">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isAnalyzing && (
              <div className="flex items-center shrink-0">
                 <div className="w-px h-6 bg-slate-600 mx-1" />
                 <button type="button" onClick={onClearImage} className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white" title="Remove image">
                   <X className="w-4 h-4" />
                 </button>
              </div>
            )}
          </div>
          <button 
             onClick={() => scrollToolbar('right')}
             className="px-2 self-stretch hover:bg-slate-700/50 hover:text-white text-slate-400 border-l border-slate-600 flex items-center justify-center shrink-0 transition-colors rounded-r-lg"
             title="Scroll Right"
          >
             <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-hidden relative" style={{ cursor: tool === 'pan' ? 'grab' : tool === 'crop' ? 'cell' : 'crosshair' }}>
        {imgSize.w > 0 && imgSize.h > 0 ? (
          <TransformWrapper
            disabled={isDrawingMode || tool === 'crop' || readOnly}
            initialScale={1}
            minScale={0.1}
            maxScale={8}
            centerOnInit
            wheel={{ step: 0.1 }}
            pinch={{ step: 5 }}
            doubleClick={{ disabled: isDrawingMode || tool === 'crop' }}
            onTransform={onTransform}
            ref={(ref) => {
               if (ref && syncTransform) {
                  // Only sync if they are actually different to avoid loops
                  const current = ref.state;
                  if (Math.abs(current.scale - syncTransform.scale) > 0.01 || 
                      Math.abs(current.positionX - syncTransform.positionX) > 1 || 
                      Math.abs(current.positionY - syncTransform.positionY) > 1) {
                     ref.setTransform(syncTransform.positionX, syncTransform.positionY, syncTransform.scale, 0);
                  }
               }
            }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {tool === 'pan' && (
                  <div className="absolute bottom-4 right-4 z-20 flex gap-1 bg-slate-800/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-600 shadow-xl opacity-0 group-hover/workspace:opacity-100 transition-opacity">
                    <button type="button" onClick={() => zoomIn()} className="p-1.5 rounded hover:bg-slate-700 text-slate-300"><ZoomIn className="w-4 h-4" /></button>
                    <button type="button" onClick={() => zoomOut()} className="p-1.5 rounded hover:bg-slate-700 text-slate-300"><ZoomOut className="w-4 h-4" /></button>
                    <button type="button" onClick={() => resetTransform()} className="p-1.5 rounded hover:bg-slate-700 text-slate-300"><RotateCcw className="w-4 h-4" /></button>
                  </div>
                )}
                
                {textInput && textInput.show && (
                   <div 
                     className="absolute z-50 p-2 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg shadow-xl"
                     style={{
                        top: '40px',
                        left: '50%',
                        transform: 'translateX(-50%)'
                     }}
                   >
                     <div className="flex items-center gap-2">
                        <input
                           ref={textInputRef}
                           type="text"
                           value={textInput.val}
                           onChange={e => setTextInput(prev => prev ? { ...prev, val: e.target.value } : null)}
                           onKeyDown={handleKeyDownText}
                           placeholder="Type label and hit Enter..."
                           className="bg-transparent border-b border-slate-500 text-white text-sm outline-none px-2 py-1 min-w-[200px] placeholder:text-slate-400"
                        />
                        <button onClick={commitTextAnnotation} className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-medium">Save</button>
                        <button onClick={() => setTextInput(null)} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded font-medium">Cancel</button>
                     </div>
                   </div>
                )}

                {cropRect && tool === 'crop' && !isDrawing && (
                    <div className="absolute z-50 top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-800/95 p-2 rounded-lg border border-slate-600 shadow-xl">
                       <button onClick={applyCrop} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded font-medium shadow-sm flex items-center gap-1"><CropIcon className="w-3 h-3" /> Apply Crop</button>
                       <button onClick={() => setCropRect(null)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded font-medium">Cancel</button>
                    </div>
                )}

                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                  <div 
                    className="relative max-w-full max-h-full flex"
                    style={{ aspectRatio: `${imgSize.w}/${imgSize.h}` }}
                  >
                    <img 
                      src={imageDataUrl} 
                      alt="Workspace" 
                      className="w-full h-full object-contain pointer-events-none select-none" 
                      referrerPolicy="no-referrer"
                      draggable={false}
                    />
                    <svg
                      ref={svgRef}
                      className={cn("absolute inset-0 w-full h-full touch-none")}
                      viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}
                      preserveAspectRatio="xMidYMid meet"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    >
                      {/* Existing Annotations */}
                      {showAnnotations && annotations.map(renderAnnotation)}

                      {/* Auto-detected Features Layer */}
                      {showAutoFeatures && autoFeatures.map((f, i) => (
                        <g key={`auto-${i}`}>
                          <rect 
                            x={f.x * imgSize.w / 100}
                            y={f.y * imgSize.h / 100}
                            width={f.width * imgSize.w / 100}
                            height={f.height * imgSize.h / 100}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth={Math.max(2, imgSize.w / 400)}
                            strokeDasharray="4,2"
                          />
                          <text
                            x={f.x * imgSize.w / 100}
                            y={(f.y * imgSize.h / 100) - 5}
                            fill="#10b981"
                            fontSize={Math.max(10, imgSize.w / 80)}
                            fontWeight="bold"
                            className="drop-shadow-sm pointer-events-none"
                          >
                            {f.label}
                          </text>
                        </g>
                      ))}

                      {/* Current Multi-point tool path visualization */}
                      {tempPoints.length > 0 && (
                        <g>
                          <polyline
                             points={tempPoints.map(p => `${p.x},${p.y}`).join(' ')}
                             fill="none"
                             stroke={color}
                             strokeWidth={Math.max(2, imgSize.w / 200)}
                             strokeDasharray="5,5"
                          />
                          {tempPoints.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r={Math.max(3, imgSize.w / 150)} fill={color} />
                          ))}
                        </g>
                      )}

                      {/* Native Crop Rect overlay (while drawing or awaiting confirmation) */}
                      {tool === 'crop' && cropRect && (
                         <rect
                           x={Math.min(cropRect.x, cropRect.x + cropRect.w)}
                           y={Math.min(cropRect.y, cropRect.y + cropRect.h)}
                           width={Math.abs(cropRect.w)}
                           height={Math.abs(cropRect.h)}
                           fill="rgba(0,0,0,0.5)"
                           stroke="#10b981"
                           strokeWidth={Math.max(2, imgSize.w / 300)}
                           strokeDasharray="5,5"
                         />
                      )}
                    </svg>
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        ) : (
          <img src={imageDataUrl} alt="Loading..." className="hidden" onLoad={handleImageLoad} />
        )}
      </div>
    </div>
  );
}
