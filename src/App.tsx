/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SingleAnalysis } from './components/SingleAnalysis';
import { CompareAnalysis } from './components/CompareAnalysis';
import { BatchAnalysis } from './components/BatchAnalysis';
import { HistoryView } from './components/HistoryView';
import { AnalysisRecord, ViewMode } from './types';
import { AuthWrapper } from './components/Auth';
import { auth, db } from './lib/firebase';
import { collection, query, orderBy, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { AboutContent, PrivacyContent } from './components/LegalContent';

function MainApp() {
  const [view, setView] = useState<ViewMode>('single');
  const [history, setHistory] = useState<AnalysisRecord[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'analysisRecords'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: AnalysisRecord[] = [];
      snapshot.forEach((doc) => {
        records.push(doc.data() as AnalysisRecord);
      });
      setHistory(records);
    }, (error) => {
      console.error("Error fetching history:", error);
    });

    return unsubscribe;
  }, []);

  const handleAddRecord = async (record: AnalysisRecord) => {
    // Add locally for optimistic UI
    setHistory((prev) => [record, ...prev]);
    
    // Save to Firestore
    const user = auth.currentUser;
    if (user) {
      try {
        const recordToSave = { ...record, userId: user.uid };
        
        // Basic check to see if we're likely over the 1MB Firestore limit (~1,048,576 bytes)
        // A base64 string is 4/3 the size of the original data, meaning ~750KB image is 1MB base64.
        const sizeEstimation = (record.imageDataUrl?.length || 0) + (record.base64Data?.length || 0);
        if (sizeEstimation > 900000) {
           console.warn("Document is too large for Firestore sync (limit is 1MB). It will only be stored locally.");
           alert("This image is too large to sync to the cloud. It has been saved locally for this session only.");
           return;
        }

        await setDoc(doc(db, 'users', user.uid, 'analysisRecords', record.id), recordToSave);
      } catch (error: any) {
        console.error("Error saving record:", error);
        alert("Failed to sync record to the cloud. It is available locally.");
      }
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar view={view} setView={setView} />
      
      <main className="flex-1 overflow-hidden flex flex-col relative w-full h-full">
        {view === 'single' && <SingleAnalysis onAddRecord={handleAddRecord} />}
        {view === 'compare' && <CompareAnalysis />}
        {view === 'batch' && <BatchAnalysis onAddRecord={handleAddRecord} />}
        {view === 'history' && <HistoryView history={history} />}
        {view === 'about' && (
          <div className="flex-1 overflow-y-auto p-8 lg:p-12">
            <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <AboutContent />
            </div>
          </div>
        )}
        {view === 'privacy' && (
          <div className="flex-1 overflow-y-auto p-8 lg:p-12">
            <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <PrivacyContent />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthWrapper>
      <MainApp />
    </AuthWrapper>
  );
}

