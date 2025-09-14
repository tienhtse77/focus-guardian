
import React, { useState, useCallback } from 'react';
import type { GreenlistItem, BlacklistItem } from './types';
import { useExtensionStorage } from './hooks/useExtensionStorage';
import Greenlist from './components/Greenlist';
import Blacklist from './components/Blacklist';

const App: React.FC = () => {
  const [greenlist, setGreenlist] = useExtensionStorage<GreenlistItem[]>('greenlist', [
    { id: '1', title: 'React Docs', url: 'https://react.dev' },
    { id: '2', title: 'Tailwind CSS', url: 'https://tailwindcss.com' },
    { id: '3', title: 'Finish Q3 report', url: '#' },
  ]);
  const [blacklist, setBlacklist] = useExtensionStorage<BlacklistItem[]>('blacklist', [
    { id: '1', domain: 'youtube.com' },
    { id: '2', domain: 'facebook.com' },
    { id: '3', domain: 'twitter.com' },
  ]);

  const addGreenlistItem = useCallback((item: Omit<GreenlistItem, 'id'>) => {
    setGreenlist(prev => [...prev, { ...item, id: Date.now().toString() }]);
  }, [setGreenlist]);

  const removeGreenlistItem = useCallback((id: string) => {
    setGreenlist(prev => prev.filter(item => item.id !== id));
  }, [setGreenlist]);

  const addBlacklistItem = useCallback((item: Omit<BlacklistItem, 'id'>) => {
    setBlacklist(prev => [...prev, { ...item, id: Date.now().toString() }]);
  }, [setBlacklist]);

  const removeBlacklistItem = useCallback((id: string) => {
    setBlacklist(prev => prev.filter(item => item.id !== id));
  }, [setBlacklist]);

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-200">
      <header className="bg-white dark:bg-slate-800 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 inline-block mr-2 -mt-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Focus Guardian
          </h1>
          <p className="text-slate-500 dark:text-slate-400 hidden sm:block">Your personal productivity shield</p>
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-200">Welcome to Your Focus Dashboard</h2>
            <p className="text-slate-500 dark:text-slate-400">Manage your lists below. The extension is active and will redirect you from any blacklisted domains.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Greenlist
            items={greenlist}
            onAddItem={addGreenlistItem}
            onRemoveItem={removeGreenlistItem}
          />
          <Blacklist
            items={blacklist}
            onAddItem={addBlacklistItem}
            onRemoveItem={removeBlacklistItem}
          />
        </div>
      </main>
      
      <footer className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Focus Guardian. Stay focused and achieve your goals.</p>
      </footer>
    </div>
  );
};

export default App;
