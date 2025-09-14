// Fix: Declare chrome as a global variable. This resolves all TypeScript errors
// related to 'chrome' not being defined, as it's an environment-specific global.
declare const chrome: any;

import React, { useState, useEffect, useCallback } from 'react';

// A custom hook to work with chrome.storage.local.
export const useExtensionStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Effect to load the value from storage on initial render.
  useEffect(() => {
    // Fix: Use `typeof chrome` to safely check for the existence of the chrome API
    // without causing a ReferenceError in non-extension environments.
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([key], (result) => {
        if (result[key] !== undefined) {
          setStoredValue(result[key]);
        } else {
            // If not in storage, set the initial value
            chrome.storage.local.set({ [key]: initialValue });
        }
      });
    } else {
        console.warn("Extension storage is not available. Using initial value.");
    }
  }, [key, initialValue]);

  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      // Fix: Use `typeof chrome` to safely check for the existence of the chrome API.
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [key]: valueToStore });
      }
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);
  
  // Effect to listen for changes from other parts of the extension.
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes[key]) {
        setStoredValue(changes[key].newValue);
      }
    };

    // Fix: Use `typeof chrome` to safely check for the existence of the chrome API.
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
        // Fix: Use `typeof chrome` to safely check for the existence of the chrome API.
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        }
    };
  }, [key]);

  return [storedValue, setValue];
};
