import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner'
import { ParsingAPI } from '../lib/api.js';

function AutoParsingToggle({ loadingSettings }) {
  const [checking, setChecking] = useState(true);
  const [active, setActive] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let canceled = false;
    
    async function check() {
      try {
        const res = await ParsingAPI.checkTimer();
        if (!canceled) {
          const isActive = res?.active === true || res?.active === "true";
          setActive(isActive);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!canceled) setChecking(false);
      }
    }
    
    check();
    
    return () => { 
      canceled = true;
    };
  }, []);

  async function toggle() {
    if (toggling) return;
    
    setToggling(true);
    
    try {
      if (active) {
        await ParsingAPI.deactivateTimer();
        setActive(false);
      } else {
        await ParsingAPI.activateTimer();
        setActive(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  }

  const disabled = loadingSettings || checking || toggling;

  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={active}
        onChange={toggle}
        disabled={disabled}
      />
      <div className={`
        relative w-11 h-6 bg-slate-200 dark:bg-slate-700 
        peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800
        rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white
        after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border
        after:rounded-full after:h-5 after:w-5 after:transition-all
        dark:border-slate-600 peer-checked:bg-green-600
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}>
        {(checking || toggling) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner className="w-3 h-3" />
          </div>
        )}
      </div>
      <span className="ml-3 text-sm font-medium text-slate-900 dark:text-slate-300">
        {active ? 'Автопарсинг включен' : 'Автопарсинг выключен'}
      </span>
    </label>
  );
}

export default AutoParsingToggle;