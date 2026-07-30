import React from 'react';
import { LayoutDashboard, History, Layers, List, LogOut } from 'lucide-react';
import { ViewMode } from '../types';
import { cn } from '../lib/utils';
import { logout } from '../lib/firebase';

interface SidebarProps {
  view: ViewMode;
  setView: (view: ViewMode) => void;
}

export function Sidebar({ view, setView }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white p-6 flex flex-col h-full">
      <div className="mb-8 flex items-center gap-2">
        <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">A</div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">AstraScan ML</h1>
      </div>
      
      <nav className="space-y-1 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Analysis Dashboard</div>
        
        <button 
          onClick={() => setView('single')}
          className={cn(
            "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            view === 'single' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Single Analysis
        </button>
        
        <button 
          onClick={() => setView('compare')}
          className={cn(
            "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            view === 'compare' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <Layers className="h-4 w-4" />
          Compare Imagery
        </button>

        <button 
          onClick={() => setView('batch')}
          className={cn(
            "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            view === 'batch' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <List className="h-4 w-4" />
          Batch Processing
        </button>

        <button 
          onClick={() => setView('history')}
          className={cn(
            "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            view === 'history' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <History className="h-4 w-4" />
          History Log
        </button>
      </nav>

      <div className="mt-auto space-y-4">
        <div className="flex gap-2 text-xs font-medium text-slate-500 justify-center">
          <button onClick={() => setView('about' as ViewMode)} className="hover:text-blue-600 hover:underline">About</button>
          <span>•</span>
          <button onClick={() => setView('privacy' as ViewMode)} className="hover:text-blue-600 hover:underline">Privacy</button>
        </div>
        
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">Training Reference</div>
          <div className="text-sm font-semibold truncate text-slate-700">ML-Schema-Key-v4.pdf</div>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-green-600 font-bold uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            Active Reference
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
