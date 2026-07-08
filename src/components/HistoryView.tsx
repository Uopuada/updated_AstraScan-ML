import React, { useState } from 'react';
import { AnalysisRecord } from '../types';
import { ImageWorkspace } from './ImageWorkspace';
import ReactMarkdown from 'react-markdown';
import { SearchX, Search, Download, FileText, FileJson, FileSpreadsheet, FileDigit, Loader2 } from 'lucide-react';
import { exportAsText, exportAsJSON, exportAsCSV, exportAsPDF, mergeAnnotationsWithImage } from '../lib/utils';

interface HistoryViewProps {
  history: AnalysisRecord[];
}

export function HistoryView({ history }: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [exportMenuOpenId, setExportMenuOpenId] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState<string | null>(null);

  const filteredHistory = history.filter(record => {
    const query = searchQuery.toLowerCase();
    const matchesFileName = record.fileName?.toLowerCase().includes(query) ?? false;
    const matchesResult = record.analysisResult?.toLowerCase().includes(query) ?? false;
    const dateStr = new Date(record.timestamp).toLocaleString().toLowerCase();
    const matchesDate = dateStr.includes(query);
    
    return matchesFileName || matchesResult || matchesDate;
  });

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <SearchX className="w-16 h-16 stroke-1 mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700 mb-2">No History Yet</h2>
        <p className="text-sm">Run an analysis in the Single Workspace to see past results here.</p>
      </div>
    );
  }

  const getExportData = (record: AnalysisRecord) => {
     return {
        fileName: record.fileName || 'Unknown',
        date: new Date(record.timestamp).toISOString(),
        annotationCount: record.annotations.length,
        report: record.analysisResult || '',
        size: record.metadata?.size ? `${(record.metadata.size / 1024).toFixed(1)} KB` : 'N/A',
        dimensions: record.metadata?.dimensions || 'N/A'
     };
  };

  const handleExportText = (record: AnalysisRecord) => {
    setExportMenuOpenId(null);
    const data = getExportData(record);
    const content = `# History Record\n**Date:** ${new Date(record.timestamp).toLocaleString()}\n**File:** ${data.fileName}\n**Annotations:** ${data.annotationCount}\n\n## Analysis Details\n${data.report}`;
    exportAsText(`scan_record_${data.date.split('T')[0]}.txt`, content);
  };

  const handleExportJSON = (record: AnalysisRecord) => {
    setExportMenuOpenId(null);
    const data = getExportData(record);
    exportAsJSON(`scan_record_${data.date.split('T')[0]}.json`, data);
  };

  const handleExportCSV = (record: AnalysisRecord) => {
    setExportMenuOpenId(null);
    const data = getExportData(record);
    exportAsCSV(`scan_record_${data.date.split('T')[0]}.csv`, [data]);
  };

  const handleExportPDF = async (record: AnalysisRecord) => {
    setExportMenuOpenId(null);
    setIsExportingPDF(record.id);
    
    try {
      // 1. Get image dimensions
      const img = new Image();
      img.src = record.imageDataUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      
      // 2. Merge annotations
      const annotatedUrl = await mergeAnnotationsWithImage(
        record.imageDataUrl, 
        record.annotations, 
        img.width, 
        img.height
      );

      // 3. Export
      const timestamp = new Date(record.timestamp).toLocaleString();
      const title = `${record.fileName} - Analyzed at ${timestamp}`;
      await exportAsPDF(`scan_report_${record.id.slice(0, 8)}.pdf`, title, annotatedUrl, record.analysisResult);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setIsExportingPDF(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-8 max-w-7xl mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between shrink-0 mb-6 gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">History Log</h2>
          <p className="text-slate-500 text-sm">Past analysis executions for this session</p>
        </div>
        
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input 
             type="text" 
             placeholder="Search by date, filename, or keyword..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full lg:w-[350px] pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           />
        </div>
      </header>

      <div className="flex-1 overflow-auto custom-scrollbar pr-2 space-y-8 pb-32">
        {filteredHistory.length === 0 ? (
           <div className="text-center py-12 text-slate-500">
             <p>No records match your search criteria.</p>
           </div>
        ) : (
          filteredHistory.map((record) => (
            <div key={record.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible flex flex-col lg:flex-row relative">
              <div className="w-full lg:w-1/3 p-4 flex flex-col bg-slate-50 border-r border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 truncate" title={record.fileName}>
                  {new Date(record.timestamp).toLocaleString()} - {record.fileName || 'Unknown File'}
                </div>
                {record.metadata && (
                  <div className="flex gap-3 text-[10px] text-slate-500 mb-3 font-mono">
                    <span>DIM: {record.metadata.dimensions}</span>
                    <span>SIZE: {(record.metadata.size / 1024).toFixed(1)}KB</span>
                  </div>
                )}
                <div className="flex-1 min-h-[250px] relative rounded-lg overflow-hidden border border-slate-300">
                  <ImageWorkspace
                    imageDataUrl={record.imageDataUrl}
                    annotations={record.annotations}
                    onAnnotationsChange={() => {}}
                    onImageUpload={() => {}}
                    onClearImage={() => {}}
                    isAnalyzing={false}
                    readOnly={true}
                  />
                </div>
              </div>
              
              <div className="w-full lg:w-2/3 flex flex-col p-6 bg-slate-800 text-slate-300">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-4 relative">
                   <h3 className="text-xs font-bold tracking-wide uppercase text-white">Analysis Result</h3>
                   
                   <div className="relative">
                     <button 
                       onClick={() => setExportMenuOpenId(exportMenuOpenId === record.id ? null : record.id)} 
                       className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 transition" 
                       title="Export Menu"
                     >
                        <Download className="w-4 h-4" />
                     </button>
                     {exportMenuOpenId === record.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-slate-200 z-[999] py-1">
                           <button 
                             onClick={() => handleExportPDF(record)} 
                             disabled={isExportingPDF === record.id} 
                             className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                           >
                             {isExportingPDF === record.id ? <Loader2 className="w-3 h-3 animate-spin text-slate-400" /> : <FileDigit className="w-3 h-3 text-red-600"/>} 
                             PDF Report
                           </button>
                           <div className="h-px bg-slate-100 my-1"></div>
                           <button onClick={() => handleExportText(record)} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"><FileText className="w-3 h-3"/> Text / MD</button>
                           <button onClick={() => handleExportJSON(record)} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"><FileJson className="w-3 h-3"/> JSON</button>
                           <button onClick={() => handleExportCSV(record)} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"><FileSpreadsheet className="w-3 h-3"/> CSV</button>
                        </div>
                     )}
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar-dark pr-4">
                  {record.analysisResult ? (
                    <div className="prose prose-invert prose-sm max-w-none 
                                    prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                                    prose-a:text-blue-400 hover:prose-a:text-blue-300
                                    prose-li:marker:text-slate-500">
                      <ReactMarkdown>{record.analysisResult}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No interpretation returned.</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
