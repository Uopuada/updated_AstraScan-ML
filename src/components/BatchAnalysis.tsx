import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Plus, X, Layers, Download, FileDigit, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import { AnalysisRecord } from '../types';
import { cn, exportAsText, exportAsJSON, exportAsCSV, exportAsPDF } from '../lib/utils';
import { analyzeSatelliteImagery } from '../lib/gemini';

interface BatchAnalysisProps {
  onAddRecord: (record: AnalysisRecord) => void;
}

interface BatchFile {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}

export function BatchAnalysis({ onAddRecord }: BatchAnalysisProps) {
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState({ current: 0, total: 0 });
  const [consolidatedReport, setConsolidatedReport] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportText = () => {
     if (!consolidatedReport) return;
     exportAsText(`batch_analysis_${Date.now()}.txt`, consolidatedReport);
  };
  
  const handleExportJSON = () => {
    if (!consolidatedReport) return;
    const data = {
       processedCount: batchFiles.length,
       timestamp: new Date().toISOString(),
       report: consolidatedReport
    };
    exportAsJSON(`batch_analysis_${Date.now()}.json`, data);
  };

  const handleExportCSV = () => {
    if (!consolidatedReport) return;
    const data = {
       processedCount: batchFiles.length,
       report: consolidatedReport.replace(/,/g, ';').replace(/\n/g, ' ')
    };
    exportAsCSV(`batch_analysis_${Date.now()}.csv`, [data]);
  };

  const handleExportPDF = async () => {
    if (!consolidatedReport) return;
    setIsExportingPDF(true);
    try {
      await exportAsPDF(
        `batch_report_${Date.now()}.pdf`, 
        `Batch Result - ${batchFiles.length} images processed`, 
        '', // No single image for batch report
        consolidatedReport
      );
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(f => ({
        file: f,
        status: 'pending' as const,
        progress: 0
      }));
      setBatchFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setBatchFiles(batchFiles.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
         const result = reader.result as string;
         resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const runBatch = async () => {
    if (batchFiles.length === 0) return;
    setIsProcessing(true);
    setOverallProgress({ current: 0, total: batchFiles.length });
    
    let consolidatedMarkdown = `# Batch Analysis Report\nProcessed **${batchFiles.length}** imagery records.\n\n`;

    for (let i = 0; i < batchFiles.length; i++) {
       const batchItem = batchFiles[i];
       
       // Update status to processing
       setBatchFiles(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'processing', progress: 30 } : item));

       try {
         const dataUrl = await fileToBase64(batchItem.file);
         const base64 = dataUrl.split(',')[1];
         
         setBatchFiles(prev => prev.map((item, idx) => idx === i ? { ...item, progress: 60 } : item));
         const result = await analyzeSatelliteImagery(base64, batchItem.file.type, false);
         
         consolidatedMarkdown += `## Source: ${batchItem.file.name}\n${result}\n\n---\n\n`;

         onAddRecord({
           id: crypto.randomUUID(),
           timestamp: Date.now(),
           fileName: `[BATCH] ${batchItem.file.name}`,
           imageDataUrl: dataUrl,
           base64Data: base64,
           mimeType: batchItem.file.type,
           analysisResult: result,
           annotations: [],
         });

         setBatchFiles(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'completed', progress: 100 } : item));

       } catch (err) {
         consolidatedMarkdown += `## Source: ${batchItem.file.name}\n**Error processing file:** Pipeline failure.\n\n---\n\n`;
         setBatchFiles(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'failed', progress: 100 } : item));
       }
       setOverallProgress({ current: i + 1, total: batchFiles.length });
    }

    setConsolidatedReport(consolidatedMarkdown);
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-full w-full p-6 max-w-[1400px] mx-auto space-y-4">
      <header className="flex items-center justify-between shrink-0 mb-2 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Batch Processing</h2>
          <p className="text-slate-500 text-sm">Upload multiple images to sequentially process and generate a consolidated history.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {batchFiles.length > 0 && (
             <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Overall Progress</span>
                <div className="flex items-center gap-2">
                   <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                         className="bg-indigo-600 h-full transition-all duration-300" 
                         style={{ width: `${(overallProgress.current / overallProgress.total) * 100}%` }}
                      />
                   </div>
                   <span className="text-xs font-bold text-slate-600">{overallProgress.current}/{overallProgress.total}</span>
                </div>
             </div>
          )}
          <button
            onClick={runBatch}
            disabled={batchFiles.length === 0 || isProcessing}
            className={cn(
              "py-2 px-6 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm",
              batchFiles.length === 0 ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" : 
              isProcessing ? "bg-indigo-600 text-white cursor-wait opacity-80" : 
              "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            )}
          >
            {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Layers className="w-4 h-4" /> Start Batch</>}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Queue side */}
        <div className="col-span-1 lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-0 relative">
           <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center shrink-0">
             <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline Queue</h3>
             <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold">{batchFiles.length} items</span>
           </div>
           <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             {batchFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-white">
                   <Layers className="w-8 h-8 opacity-20" />
                   <p className="text-sm">Queue is empty.</p>
                   <p className="text-xs">Add files to begin.</p>
                </div>
             ) : (
                <div className="space-y-3">
                   {batchFiles.map((item, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                         <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 truncate flex-1 pr-2">
                               {item.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
                               {item.status === 'completed' && <div className="w-3 h-3 rounded-full bg-emerald-500" />}
                               {item.status === 'failed' && <div className="w-3 h-3 rounded-full bg-red-500" />}
                               {item.status === 'pending' && <div className="w-3 h-3 rounded-full bg-slate-200" />}
                               <span className="truncate text-xs font-medium text-slate-600 tracking-tight">
                                  {item.file.name}
                               </span>
                            </div>
                            <button onClick={() => removeFile(idx)} disabled={isProcessing} className="text-slate-400 hover:text-red-500 transition disabled:opacity-50">
                               <X className="w-4 h-4" />
                            </button>
                         </div>
                         {(item.status === 'processing' || item.status === 'completed' || item.status === 'failed') && (
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                  className={cn(
                                     "h-full transition-all duration-500",
                                     item.status === 'failed' ? "bg-red-500" : "bg-indigo-500"
                                  )}
                                  style={{ width: `${item.progress}%` }}
                               />
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             )}
           </div>
           
           <div className="p-4 border-t border-slate-200 bg-white shrink-0">
              <label className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-md cursor-pointer transition-colors shadow-sm text-sm font-medium">
                 <Plus className="w-4 h-4" /> Add Files
                 <input type="file" multiple accept="image/*" className="hidden" onChange={handleFilesUpload} disabled={isProcessing} />
              </label>
           </div>
        </div>

        {/* Results side */}
        <div className="col-span-1 lg:col-span-8 bg-slate-800 text-slate-300 rounded-xl flex flex-col shadow-lg overflow-hidden border border-slate-700 min-h-0">
            <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center shrink-0">
               <h3 className="text-sm font-bold tracking-wide uppercase text-white">Consolidated Report</h3>
               {consolidatedReport && (
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={handleExportPDF} 
                      disabled={isExportingPDF}
                      className="text-indigo-400 hover:text-indigo-300 p-1 transition" 
                      title="Download PDF"
                    >
                      {isExportingPDF ? <Loader2 className="w-3 h-3 animate-spin"/> : <FileDigit className="w-4 h-4" />}
                    </button>
                    <button onClick={handleExportText} className="text-indigo-400 hover:text-indigo-300 p-1 transition" title="Download Text">
                       <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={handleExportJSON} className="text-indigo-400 hover:text-indigo-300 p-1 transition" title="Download JSON">
                       <FileJson className="w-4 h-4" />
                    </button>
                    <button onClick={handleExportCSV} className="text-indigo-400 hover:text-indigo-300 p-1 transition" title="Download CSV">
                       <FileSpreadsheet className="w-4 h-4" />
                    </button>
                 </div>
               )}
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar-dark min-h-0">
               {!consolidatedReport && !isProcessing ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                    <p className="text-sm">Batch report will appear here once inference completes.</p>
                 </div>
               ) : isProcessing ? (
                 <div className="flex flex-col items-center justify-center h-full text-indigo-400 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-medium text-slate-300">Evaluating {overallProgress.current} of {overallProgress.total}...</p>
                 </div>
               ) : consolidatedReport ? (
                 <div className="prose prose-invert prose-sm max-w-none text-slate-300
                                 prose-headings:text-white prose-headings:font-bold
                                 prose-a:text-blue-400 hover:prose-a:text-blue-300
                                 prose-hr:border-slate-700">
                    <ReactMarkdown>{consolidatedReport}</ReactMarkdown>
                 </div>
               ) : null}
            </div>
        </div>

      </div>
    </div>
  );
}
