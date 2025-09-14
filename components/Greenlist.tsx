
import React, { useState } from 'react';
import type { GreenlistItem } from '../types';

interface GreenlistProps {
  items: GreenlistItem[];
  onAddItem: (item: Omit<GreenlistItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
}

const GreenlistItemComponent: React.FC<{ item: GreenlistItem; onRemove: (id: string) => void }> = ({ item, onRemove }) => {
  return (
    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-3 rounded-md transition-shadow hover:shadow-md">
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex-grow truncate mr-4 group">
        <p className="font-semibold text-emerald-700 dark:text-emerald-300 group-hover:underline truncate">{item.title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 truncate">{item.url}</p>
      </a>
      <button
        onClick={() => onRemove(item.id)}
        className="flex-shrink-0 p-2 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-800 dark:hover:text-red-300 transition"
        aria-label={`Remove ${item.title}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

const Greenlist: React.FC<GreenlistProps> = ({ items, onAddItem, onRemoveItem }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newUrl.trim()) {
      onAddItem({ title: newTitle, url: newUrl });
      setNewTitle('');
      setNewUrl('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Greenlist</h2>
      </div>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Your productive links and to-do items. This is your safe zone.</p>
      
      <form onSubmit={handleAddItem} className="space-y-3 mb-6">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Title (e.g., Project Documentation)"
          className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
        />
        <input
          type="text"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="URL (e.g., https://docs.project.com)"
          className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
        />
        <button type="submit" className="w-full py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-slate-800 transition">
          Add to Greenlist
        </button>
      </form>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {items.length > 0 ? (
          items.map(item => <GreenlistItemComponent key={item.id} item={item} onRemove={onRemoveItem} />)
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">Your greenlist is empty. Add a productive link to get started!</p>
        )}
      </div>
    </div>
  );
};

export default Greenlist;
