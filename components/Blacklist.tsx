
import React, { useState } from 'react';
import type { BlacklistItem } from '../types';

interface BlacklistProps {
  items: BlacklistItem[];
  onAddItem: (item: Omit<BlacklistItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
}

const BlacklistItemComponent: React.FC<{ item: BlacklistItem; onRemove: (id: string) => void }> = ({ item, onRemove }) => {
  return (
    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-3 rounded-md transition-shadow hover:shadow-md">
      <p className="font-mono text-slate-700 dark:text-slate-300 truncate">{item.domain}</p>
      <button
        onClick={() => onRemove(item.id)}
        className="flex-shrink-0 p-2 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-800 dark:hover:text-red-300 transition"
        aria-label={`Remove ${item.domain}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

const Blacklist: React.FC<BlacklistProps> = ({ items, onAddItem, onRemoveItem }) => {
  const [newDomain, setNewDomain] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomain.trim()) {
      // Basic domain cleanup
      const cleanedDomain = newDomain.trim().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      onAddItem({ domain: cleanedDomain });
      setNewDomain('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Blacklist</h2>
      </div>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Distracting domains to avoid. Accessing these will trigger a reminder.</p>

      <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="Add a domain (e.g., distractingsite.com)"
          className="flex-grow w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none transition"
        />
        <button type="submit" className="px-6 py-2 bg-slate-700 text-white font-semibold rounded-md hover:bg-slate-900 dark:bg-slate-600 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition">
          Add
        </button>
      </form>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {items.length > 0 ? (
          items.map(item => <BlacklistItemComponent key={item.id} item={item} onRemove={onRemoveItem} />)
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">Your blacklist is empty. Add a distracting domain to protect your focus.</p>
        )}
      </div>
    </div>
  );
};

export default Blacklist;
