
import React, { useState } from 'react';

interface UrlCheckerProps {
  blacklist: string[];
}

const UrlChecker: React.FC<UrlCheckerProps> = ({ blacklist }) => {
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleCheckUrl = () => {
    if (!url.trim()) {
      setMessage({ type: 'info', text: 'Please enter a URL to check.' });
      return;
    }

    let domain;
    try {
      // Prepend protocol if missing for URL constructor
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      domain = new URL(fullUrl).hostname.replace('www.', '');
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid URL format. Please enter a valid URL.' });
      return;
    }

    if (blacklist.some(b => domain.includes(b))) {
      setMessage({ type: 'error', text: `Access Denied! ${domain} is on your blacklist. Stay focused!` });
    } else {
      setMessage({ type: 'success', text: `All clear! ${domain} is not on your blacklist. Opening in a new tab...` });
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank', 'noopener,noreferrer');
    }
  };

  const getMessageBgColor = () => {
    if (!message) return '';
    switch (message.type) {
      case 'error': return 'bg-red-100 dark:bg-red-900 border-red-500 dark:border-red-400 text-red-700 dark:text-red-200';
      case 'success': return 'bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-400 text-green-700 dark:text-green-200';
      case 'info': return 'bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-200';
      default: return '';
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-3 text-slate-700 dark:text-slate-200">Productivity Checkpoint</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-4">
        Enter a URL to see if it's on your blacklist. This simulates how a browser extension would block distracting sites.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="e.g., youtube.com"
          className="flex-grow w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
          onKeyDown={(e) => e.key === 'Enter' && handleCheckUrl()}
        />
        <button
          onClick={handleCheckUrl}
          className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-slate-800 transition transform hover:scale-105"
        >
          Check URL
        </button>
      </div>
      {message && (
         <div className={`mt-4 p-4 rounded-md border-l-4 ${getMessageBgColor()}`} role="alert">
          <p className="font-bold">{message.type.charAt(0).toUpperCase() + message.type.slice(1)}</p>
          <p>{message.text}</p>
        </div>
      )}
    </div>
  );
};

export default UrlChecker;
