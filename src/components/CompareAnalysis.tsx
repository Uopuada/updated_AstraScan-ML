import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Merge, Info, Download, Globe, FileDigit, Save, FileText, FileJson, Table, RefreshCcw, ScanSearch } from 'lucide-react';
import { AnnotationLine, CompareResult, AutoDetectFeature } from '../types';
import { cn, exportAsGeoJSON, exportComparisonAsPDF, mergeAnnotationsWithImage } from '../lib/utils';
import { analyzeSatelliteImagery, compareSatelliteImagery, autoDetectFeatures } from '../lib/gemini';
import { ImageWorkspace } from './ImageWorkspace';

interface CompareState {
  file: File | null;
  dataUrl: string | null;
  base64: string;
  annotations: AnnotationLine[];
  autoFeatures: AutoDetectFeature[];
}

export function CompareAnalysis() {
  const [sideA, setSideA] = useState<CompareState>({ file: null, dataUrl: null, base64: '', annotations: [], autoFeatures: [] });
  const [sideB, setSideB] = useState<CompareState>({ file: null, dataUrl: null, base64: '', annotations: [], autoFeatures: [] });
  const [userNote, setUserNote] = useState<string>('');
  
  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const [syncTransform, setSyncTransform] = useState<any>(null);
  const isSyncingRef = useRef(false);

  // Auto-save comparison state
  useEffect(() => {
    const timer = setTimeout(() => {
      const stateToSave = {
        sideA: { annotations: sideA.annotations, autoFeatures: sideA.autoFeatures, dataUrl: sideA.dataUrl, base64: sideA.base64 },
        sideB: { annotations: sideB.annotations, autoFeatures: sideB.autoFeatures, dataUrl: sideB.dataUrl, base64: sideB.base64 },
        userNote,
        compareResult
      };
      if (sideA.dataUrl || sideB.dataUrl) {
        localStorage.setItem('compare_v1', JSON.stringify(stateToSave));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [sideA.annotations, sideA.autoFeatures, sideA.dataUrl, sideA.base64, sideB.annotations, sideB.autoFeatures, sideB.dataUrl, sideB.base64, userNote, compareResult]);

  const resumeState = () => {
    const saved = localStorage.getItem('compare_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSideA(prev => ({ ...prev, ...parsed.sideA }));
        setSideB(prev => ({ ...prev, ...parsed.sideB }));
        setUserNote(parsed.userNote || '');
        setCompareResult(parsed.compareResult || null);
      } catch (e) {
        console.error("Resume failed", e);
      }
    }
  };

  const handleRunComparison = async () => {
    if (!sideA.base64 || !sideB.base64) {
      setCompareError("Both datasets must be uploaded to run comparison.");
      return;
    }
    setIsComparing(true);
    setCompareError(null);
    try {
      const resultText = await compareSatelliteImagery(
        sideA.base64, "image/jpeg",
        sideB.base64, "image/jpeg",
        userNote
      );
      
      try {
        const parsed: CompareResult = JSON.parse(resultText);
        setCompareResult(parsed);
      } catch (e) {
        setCompareError("Failed to parse the structured response from the model.");
        console.error("Parse error", resultText);
      }
    } catch (err: any) {
      setCompareError(`Comparison failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsComparing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!sideA.dataUrl || !sideB.dataUrl || !compareResult) return;
    setIsExportingPDF(true);
    try {
      const [finalA, finalB] = await Promise.all([
        mergeAnnotationsWithImage(sideA.dataUrl, sideA.annotations),
        mergeAnnotationsWithImage(sideB.dataUrl, sideB.annotations)
      ]);
      
      await exportComparisonAsPDF(
        `comparison_report_${Date.now()}.pdf`,
        `Analysis comparison: ${sideA.file?.name || 'A'} vs ${sideB.file?.name || 'B'}`,
        finalA,
        finalB,
        compareResult.markdownReport
      );
    } catch (e) {
      console.error("Export PDF failed", e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const syncTrans = (ref: any) => {
     if (isSyncingRef.current) return;
     isSyncingRef.current = true;
     setSyncTransform(ref.instance.transformState);
     setTimeout(() => { isSyncingRef.current = false; }, 10);
  };

  return (
    <div className="flex flex-col h-full w-full p-6 max-w-[1400px] mx-auto space-y-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between shrink-0 mb-2 border-b border-slate-200 pb-4 gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800">Compare Imagery</h2>
          <p className="text-slate-500 text-sm">Upload two different satellite images to compare classifications side-by-side</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={resumeState}
            className="p-2 text-slate-500 hover:text-indigo-600 transition h-[42px] px-3 border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-2"
            title="Resume last session"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="text-sm font-medium">Resume Last</span>
          </button>
          
          <div className="relative w-full sm:w-64">
             <textarea
               value={userNote}
               onChange={(e) => setUserNote(e.target.value)}
               placeholder="Comparison context (optional)..."
               className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none h-[42px] leading-tight"
             />
          </div>
          <button
            onClick={handleRunComparison}
            disabled={!sideA.file || !sideB.file || isComparing}
            className={cn(
              "py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm h-[42px]",
              (!sideA.file || !sideB.file) ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" : 
              isComparing ? "bg-indigo-600 text-white cursor-wait opacity-80" : 
              "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            )}
          >
            {isComparing ? <><Loader2 className="w-4 h-4 animate-spin" /> Joint Inference...</> : <><Merge className="w-4 h-4" /> Compare Both Datasets</>}
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
        
        {/* Top: The Two Workspaces Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-1/2 min-h-[350px] shrink-0">
          <ComparePane 
            title="Dataset A" 
            state={sideA} 
            setState={setSideA} 
            syncTransform={syncTransform}
            onTransformed={syncTrans}
          />
          <ComparePane 
            title="Dataset B" 
            state={sideB} 
            setState={setSideB} 
            compareResult={compareResult} 
            syncTransform={syncTransform}
            onTransformed={syncTrans}
          />
        </div>

        {/* Bottom: The Joint Comparison Output */}
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col min-h-[250px] overflow-hidden">
          <div className="p-3 bg-slate-900 border-b border-slate-700 flex justify-between items-center shrink-0">
             <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Joint Differential Analysis</h3>
             {compareResult && (
               <button 
                 onClick={handleExportPDF} 
                 disabled={isExportingPDF}
                 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
               >
                 {isExportingPDF ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                 Export full comparison pdf
               </button>
             )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar-dark text-slate-300">
             {compareError && (
               <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-md border border-red-500/20 mb-4 inline-block">
                 <span className="font-semibold">Error: </span>{compareError}
               </div>
             )}
             
             {!compareResult && !isComparing ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                 <Merge className="w-8 h-8 opacity-50" />
                 <p className="text-sm">Upload both datasets and run the comparison to see differences.</p>
               </div>
             ) : isComparing ? (
               <div className="flex flex-col items-center justify-center h-full text-indigo-400 gap-3">
                 <Loader2 className="w-8 h-8 animate-spin" />
                 <p className="text-sm font-medium text-slate-300">Analyzing deltas between the two datasets...</p>
               </div>
             ) : compareResult ? (
                <div className="prose prose-invert prose-sm max-w-none text-slate-300
                                prose-headings:text-white prose-headings:font-bold
                                prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
                  <ReactMarkdown>{compareResult.markdownReport}</ReactMarkdown>
                </div>
             ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}

interface ComparePaneProps {
  title: string;
  state: CompareState;
  setState: React.Dispatch<React.SetStateAction<CompareState>>;
  compareResult?: CompareResult | null;
  syncTransform?: any;
  onTransformed?: (ref: any) => void;
}

function ComparePane({ title, state, setState, compareResult, syncTransform, onTransformed }: ComparePaneProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [hoverDiffIndex, setHoverDiffIndex] = useState<number | null>(null);

  const handleImageUpload = (file: File) => {
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is ${MAX_MB}MB.`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Invalid file format. Please upload a GeoTIFF, JPG, PNG, or WebP image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setState({
         file,
         dataUrl: result,
         base64: result.split(',')[1],
         annotations: [],
         autoFeatures: []
      });
      setError(null);
      setAnalysisResult(null);
    };
    reader.onerror = () => setError('Failed to read the image file.');
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setState({ file: null, dataUrl: null, base64: '', annotations: [], autoFeatures: [] });
    setAnalysisResult(null);
    setError(null);
  };

  const setAnnotations = (newAnnos: AnnotationLine[]) => {
    setState(prev => ({ ...prev, annotations: newAnnos }));
  };

  const runAnalysis = async () => {
    if (!state.dataUrl || !state.base64) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeSatelliteImagery(state.base64, "image/jpeg");
      setAnalysisResult(result);
    } catch (err: any) {
      setError(`Analysis failed: ${err.message || 'Unknown error'}.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runAutoDetect = async () => {
    if (!state.dataUrl || !state.base64) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const resultText = await autoDetectFeatures(state.base64, "image/jpeg");
      const parsed = JSON.parse(resultText);
      const features = parsed.features || [];
      setState(prev => ({ ...prev, autoFeatures: [...prev.autoFeatures, ...features] }));
    } catch (err: any) {
       setError(`Auto-detect failed: ${err.message || 'Unknown error'}`);
    } finally {
       setIsAnalyzing(false);
    }
  };

  const handleExportGeoJSON = () => {
    exportAsGeoJSON(`${title.replace(' ', '_')}_annotations_${Date.now()}.geojson`, state.annotations);
  };

  const handleImageEdited = (newDataUrl: string, newBase64: string) => {
     setState(prev => ({ ...prev, dataUrl: newDataUrl, base64: newBase64 }));
  };

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-full relative group/pane">
      <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
        <div className="flex items-center gap-2">
           {state.dataUrl && (
             <button onClick={handleExportGeoJSON} className="p-1 rounded text-slate-400 hover:text-emerald-600 transition" title="Export GeoJSON">
               <Globe className="w-3.5 h-3.5" />
             </button>
           )}
           {state.file && <span className="text-[10px] text-slate-400">{state.file.name}</span>}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col p-4 gap-4 min-h-0 overflow-y-auto custom-scrollbar">
        {/* Workspace */}
        <div className="flex-1 shrink-0 border border-slate-200 rounded-lg bg-slate-50 overflow-hidden relative group">
          <div className="absolute inset-0 z-0">
            <ImageWorkspace 
              imageDataUrl={state.dataUrl}
              annotations={state.annotations}
              autoFeatures={state.autoFeatures}
              onAnnotationsChange={setAnnotations}
              onImageUpload={handleImageUpload}
              onClearImage={clearImage}
              onImageEdited={handleImageEdited}
              isAnalyzing={isAnalyzing}
              syncTransform={syncTransform}
              onTransform={onTransformed}
            />
          </div>
          
          {/* Overlays for Difference Tooltips on Dataset B */}
          {compareResult && compareResult.differences && state.file && (
             <div className="absolute inset-0 z-20 pointer-events-none">
               {compareResult.differences.map((diff, idx) => (
                   <div
                   key={idx}
                   className="absolute border-[3px] border-indigo-500 bg-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.8)] pointer-events-auto cursor-pointer transition-all hover:bg-indigo-500/40"
                   style={{
                     left: `${Math.max(0, Math.min(100, diff.x))}%`,
                     top: `${Math.max(0, Math.min(100, diff.y))}%`,
                     width: `${Math.max(1, Math.min(100 - diff.x, diff.width))}%`,
                     height: `${Math.max(1, Math.min(100 - diff.y, diff.height))}%`
                   }}
                   onMouseEnter={() => setHoverDiffIndex(idx)}
                   onMouseLeave={() => setHoverDiffIndex(null)}
                 >
                    {/* Tooltip */}
                    {hoverDiffIndex === idx && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 text-white p-3 rounded shadow-xl w-64 z-[999] pointer-events-none">
                        <div className="flex items-start gap-2">
                           <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                           <p className="text-xs leading-relaxed">{diff.description}</p>
                        </div>
                      </div>
                    )}
                 </div>
               ))}
             </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md border border-red-100 shrink-0">
            <span className="font-semibold">Error: </span>{error}
          </div>
        )}

        {/* Local specific results if any overlay or modal */}
        {analysisResult && (
           <div className="mt-2 text-xs border border-blue-200 bg-blue-50 p-3 rounded-md text-slate-700 max-h-32 overflow-auto relative z-30">
             <div className="font-bold mb-1 text-blue-700">Individual Run:</div>
             <div className="prose prose-sm prose-blue max-w-none">
               <ReactMarkdown>{analysisResult}</ReactMarkdown>
             </div>
           </div>
        )}
      </div>

      {state.dataUrl && (
        <div className="absolute bottom-4 right-4 z-[99] flex gap-2">
          <button
            onClick={runAutoDetect}
            disabled={isAnalyzing}
            className="py-1.5 px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md text-xs font-medium shadow-md transition-colors flex items-center gap-1"
          >
             <ScanSearch className="w-3.5 h-3.5" />
             Auto-Detect
          </button>
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow-md transition-colors"
          >
            {isAnalyzing ? "Processing..." : "Analyze Individually"}
          </button>
        </div>
      )}
    </div>
  );
}
