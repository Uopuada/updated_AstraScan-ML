import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Map as MapIcon, RefreshCw, Download, FileText, FileJson, FileSpreadsheet, AlignLeft, ScanSearch, FileDigit } from 'lucide-react';
import { AnalysisRecord, AnnotationLine, AutoDetectFeature } from '../types';
import { cn, exportAsText, exportAsJSON, exportAsCSV, exportAsGeoJSON, exportAsPDF, mergeAnnotationsWithImage } from '../lib/utils';
import { analyzeSatelliteImagery, summarizeText, autoDetectFeatures } from '../lib/gemini';
import { ImageWorkspace } from './ImageWorkspace';
import { Globe } from 'lucide-react';

interface SingleAnalysisProps {
  onAddRecord: (record: AnalysisRecord) => void;
}

export function SingleAnalysis({ onAddRecord }: SingleAnalysisProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string>('');
  const [annotations, setAnnotations] = useState<AnnotationLine[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const [userNote, setUserNote] = useState<string>('');
  const [autoFeatures, setAutoFeatures] = useState<AutoDetectFeature[]>([]);
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleImageEdited = (newDataUrl: string, newBase64: string) => {
    setImageDataUrl(newDataUrl);
    setBase64Data(newBase64);
    // When editing (crop/rotate), natural size needs to be updated. ImageWorkspace handles passing new dimensions safely visually.
    const img = new Image();
    img.onload = () => setImgNaturalSize({ w: img.width, h: img.height });
    img.src = newDataUrl;
  };

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
      const img = new Image();
      img.onload = () => setImgNaturalSize({ w: img.width, h: img.height });
      img.src = result;
      
      setImageDataUrl(result);
      setBase64Data(result.split(',')[1]);
      setImageFile(file);
      setError(null);
      setAnalysisResult(null);
      setSummaryResult(null);
      setAnnotations([]);
      setAutoFeatures([]);
    };
    reader.onerror = () => {
      setError('Failed to read the image file.');
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImageDataUrl(null);
    setBase64Data('');
    setAnalysisResult(null);
    setSummaryResult(null);
    setError(null);
    setAnnotations([]);
    setAutoFeatures([]);
  };

  const runAutoDetect = async () => {
    if (!imageFile || !base64Data) return;
    setIsAutoDetecting(true);
    setError(null);
    try {
      const resultText = await autoDetectFeatures(base64Data, imageFile.type);
      const parsed = JSON.parse(resultText);
      const features = parsed.features || [];
      setAutoFeatures(prev => [...prev, ...features]);
    } catch (err: any) {
       setError(`Auto-detect failed: ${err.message || 'Unknown error'}`);
    } finally {
       setIsAutoDetecting(false);
    }
  };

  const runAnalysis = async () => {
    if (!imageFile || !base64Data || !imageDataUrl) return;

    setIsAnalyzing(true);
    setError(null);
    setSummaryResult(null);

    try {
      const isTargeted = annotations.length > 0 || autoFeatures.length > 0;
      let finalBase64 = base64Data;
      let targetMime = imageFile.type;
      
      // If annotations exist, compile them visually so Gemini can 'see' what to target
      if (isTargeted) {
        const mergedDataUrl = await mergeAnnotationsWithImage(imageDataUrl, annotations, autoFeatures, imgNaturalSize.w, imgNaturalSize.h);
        finalBase64 = mergedDataUrl.split(',')[1];
        targetMime = 'image/jpeg';
      }

      const result = await analyzeSatelliteImagery(finalBase64, targetMime, isTargeted, userNote);
      setAnalysisResult(result);
      
      onAddRecord({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        fileName: imageFile.name,
        imageDataUrl: imageDataUrl,
        base64Data,
        mimeType: imageFile.type,
        analysisResult: result,
        annotations,
        autoFeatures,
        metadata: {
           size: imageFile.size,
           lastModified: imageFile.lastModified,
           dimensions: `${imgNaturalSize.w}x${imgNaturalSize.h}`
        }
      });

    } catch (err: any) {
      const errMsg = err.message || 'Unknown error';
      setError(`Analysis failed: ${errMsg}. This might be due to API quota limits, network issues, or image complexity.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runSummary = async () => {
    if (!analysisResult) return;
    setIsSummarizing(true);
    try {
      const result = await summarizeText(analysisResult);
      setSummaryResult(result);
    } catch(err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const getExportData = () => {
     return {
        fileName: imageFile?.name || 'Unknown',
        date: new Date().toISOString(),
        annotationCount: annotations.length,
        report: analysisResult || '',
        summary: summaryResult || ''
     };
  };

  const handleExportText = () => {
    setExportMenuOpen(false);
    const data = getExportData();
    const content = `# Analysis for ${data.fileName}\nDate: ${data.date}\nAnnotations attached: ${data.annotationCount}\n\n${data.summary ? `## Summary\n${data.summary}\n\n` : ''}## Full Report\n${data.report}`;
    exportAsText(`scan_result_${Date.now()}.txt`, content);
  };
  
  const handleExportJSON = () => {
    setExportMenuOpen(false);
    exportAsJSON(`scan_result_${Date.now()}.json`, getExportData());
  };
  
  const handleExportCSV = () => {
    setExportMenuOpen(false);
    exportAsCSV(`scan_result_${Date.now()}.csv`, [getExportData()]);
  };

  const handleExportGeoJSON = () => {
    setExportMenuOpen(false);
    exportAsGeoJSON(`scan_annotations_${Date.now()}.geojson`, annotations);
  };

  const handleExportPDF = async () => {
    if (!analysisResult || !imageDataUrl) return;
    setExportMenuOpen(false);
    setIsExportingPDF(true);
    try {
      const annotatedUrl = await mergeAnnotationsWithImage(imageDataUrl, annotations, autoFeatures, imgNaturalSize.w, imgNaturalSize.h);
      const timestamp = new Date().toLocaleString();
      const title = `${imageFile?.name || 'Satellite Imagery'} - Analyzed at ${timestamp}`;
      await exportAsPDF(`vessel_report_${Date.now()}.pdf`, title, annotatedUrl, analysisResult);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Satellite Analysis Pipeline</h2>
            {imageDataUrl && (
              <button 
                onClick={clearImage}
                title="Refresh workspace for a new image"
                className="text-sm px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-md transition-colors flex items-center gap-1.5 font-medium shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                New Analysis
              </button>
            )}
          </div>
          <p className="text-slate-500 text-sm">Workspace: Primary Single-View Analysis</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column: Workspace */}
        <section className="col-span-1 lg:col-span-7 flex flex-col gap-4 h-full min-h-0">
          <div className="flex-1 relative border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col p-4 overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Imagery Workspace</h3>
              {imageDataUrl && (
                <span className="text-[10px] text-slate-400">{imageFile?.name}</span>
              )}
            </div>
            
            <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative group">
              <ImageWorkspace 
                imageDataUrl={imageDataUrl}
                annotations={annotations}
                autoFeatures={autoFeatures}
                onAnnotationsChange={setAnnotations}
                onImageUpload={handleImageUpload}
                onClearImage={clearImage}
                onImageEdited={handleImageEdited}
                isAnalyzing={isAnalyzing || isAutoDetecting}
              />
              
              {/* Optional Note Overlay */}
              {imageFile && (
                <div className="absolute bottom-4 left-4 z-20 w-64 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg p-3 transition-all">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Analysis Context (Optional)</label>
                  <textarea
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="e.g. Location: Egypt desert, seeking buried structures..."
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none h-16 text-slate-700"
                  />
                </div>
              )}
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex items-start gap-2">
                <span className="font-semibold shrink-0">Error:</span> 
                <span className="flex-1">{error}</span>
              </div>
            )}
            
            <div className="mt-4 shrink-0 flex gap-3">
              <button
                onClick={runAutoDetect}
                disabled={!imageFile || isAnalyzing || isAutoDetecting}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm",
                  !imageFile ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" : 
                  isAutoDetecting ? "bg-indigo-100 text-indigo-700 cursor-wait" : 
                  "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                )}
              >
                {isAutoDetecting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Auto-Detecting...</>
                ) : (
                  <><ScanSearch className="w-4 h-4" /> Auto-Detect Features</>
                )}
              </button>
              <button
                onClick={runAnalysis}
                disabled={!imageFile || isAnalyzing || isAutoDetecting}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm",
                  !imageFile ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" : 
                  isAnalyzing ? "bg-blue-600 text-white cursor-wait opacity-80" : 
                  "bg-blue-600 text-white hover:bg-blue-700 border border-transparent"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Pipeline...
                  </>
                ) : (
                  <>{annotations.length > 0 ? "Run Targeted ML Pipeline" : "Run ML Pipeline"}</>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Results */}
        <section className="col-span-1 lg:col-span-5 flex flex-col h-full min-h-0">
          <div className="bg-slate-800 text-slate-300 rounded-xl flex-1 flex flex-col shadow-lg overflow-hidden border border-slate-700">
            <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold tracking-wide uppercase text-white">Interpretation Model</h3>
              <div className="flex gap-2 relative">
                {analysisResult && !isAnalyzing && (
                  <>
                    <button onClick={runSummary} disabled={isSummarizing} className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-700 transition" title="Summarize Report">
                      {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlignLeft className="w-4 h-4" />}
                    </button>
                    <div className="relative">
                      <button onClick={() => setExportMenuOpen(!exportMenuOpen)} className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-700 transition" title="Export Formats">
                         <Download className="w-4 h-4" />
                      </button>
                      {exportMenuOpen && (
                        <div className="absolute right-0 mt-1 w-44 bg-white rounded-md shadow-lg border border-slate-200 z-50 py-1">
                           <button onClick={handleExportPDF} disabled={isExportingPDF} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                              {isExportingPDF ? <Loader2 className="w-3 h-3 animate-spin"/> : <FileDigit className="w-3 h-3 text-red-600"/>}
                              PDF Report
                           </button>
                           <div className="h-px bg-slate-100 my-1"></div>
                           <button onClick={handleExportText} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"><FileText className="w-3 h-3"/> Text / MD</button>
                           <button onClick={handleExportJSON} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"><FileJson className="w-3 h-3"/> JSON Report</button>
                           <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"><FileSpreadsheet className="w-3 h-3"/> CSV Data</button>
                           <div className="h-px bg-slate-100 my-1"></div>
                           <button onClick={handleExportGeoJSON} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"><Globe className="w-3 h-3 text-emerald-600"/> Export GeoJSON</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {analysisResult && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">LATEST RUN</span>}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar-dark min-h-0">
              {!imageFile && !analysisResult ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                  <MapIcon className="w-10 h-10 stroke-1 mb-4 opacity-40 text-slate-400" />
                  <p>Awaiting source imagery to begin classification.</p>
                </div>
              ) : isAnalyzing || isAutoDetecting ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                  <p className="font-medium text-slate-200 text-sm">{isAutoDetecting ? 'Scanning for features...' : 'Examining terrain & features...'}</p>
                  <p className="text-xs mt-2 text-center max-w-[250px] text-slate-500">Running inference. This may take a few moments...</p>
                </div>
              ) : analysisResult ? (
                <div className="flex flex-col gap-6">
                  {summaryResult && (
                    <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-4">
                      <h4 className="text-indigo-300 font-bold text-xs uppercase tracking-wider border-b border-indigo-500/30 pb-2 mb-2">Executive Summary</h4>
                      <div className="prose prose-invert prose-sm max-w-none text-slate-200
                                      prose-li:marker:text-indigo-400">
                         <ReactMarkdown>{summaryResult}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  <div className="prose prose-invert prose-sm max-w-none pb-4 text-slate-300
                                  prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                                  prose-a:text-blue-400 hover:prose-a:text-blue-300
                                  prose-li:marker:text-slate-500">
                    <ReactMarkdown>{analysisResult}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  <p>Ready for model execution.</p>
                </div>
              )}
            </div>
            {analysisResult && !isAnalyzing && !isAutoDetecting && (
              <div className="p-4 bg-slate-900 shrink-0 border-t border-slate-700">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500">Model: gemini-3.6-flash</span>
                  <span className="text-emerald-400 font-medium">Completed</span>
                </div>
                <div className="h-1 bg-slate-700 rounded-full w-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-full"></div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
