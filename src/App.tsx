/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { SingleAnalysis } from './components/SingleAnalysis';
import { CompareAnalysis } from './components/CompareAnalysis';
import { BatchAnalysis } from './components/BatchAnalysis';
import { HistoryView } from './components/HistoryView';
import { AnalysisRecord, ViewMode } from './types';

export default function App() {
  const [view, setView] = useState<ViewMode>('single');
  const [history, setHistory] = useState<AnalysisRecord[]>([]);

  const handleAddRecord = (record: AnalysisRecord) => {
    setHistory((prev) => [record, ...prev]);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar view={view} setView={setView} />
      
      <main className="flex-1 overflow-hidden flex flex-col relative w-full h-full">
        {view === 'single' && <SingleAnalysis onAddRecord={handleAddRecord} />}
        {view === 'compare' && <CompareAnalysis />}
        {view === 'batch' && <BatchAnalysis onAddRecord={handleAddRecord} />}
        {view === 'history' && <HistoryView history={history} />}
      </main>
    </div>
  );
}
