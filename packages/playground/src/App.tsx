import React, { useState } from 'react';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { SchemaStudioPage } from './pages/SchemaStudioPage';
import { QueryLabPage } from './pages/QueryLabPage';
import { DiffEvolutionPage } from './pages/DiffEvolutionPage';

type Tab = 'playground' | 'schema-studio' | 'query-lab' | 'diff-evolution';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'playground', label: 'Playground', icon: '⌨️' },
  { id: 'schema-studio', label: 'Schema Studio', icon: '📐' },
  { id: 'query-lab', label: 'Query Lab', icon: '🔍' },
  { id: 'diff-evolution', label: 'Diff Evolution', icon: '🔄' },
];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('playground');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-500">LEAN Format</span>
            <span className="text-xs text-gray-400">Playground</span>
          </div>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-xs">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="p-4 max-w-7xl mx-auto">
        {activeTab === 'playground' && <PlaygroundPage />}
        {activeTab === 'schema-studio' && <SchemaStudioPage />}
        {activeTab === 'query-lab' && <QueryLabPage />}
        {activeTab === 'diff-evolution' && <DiffEvolutionPage />}
      </main>
    </div>
  );
}
