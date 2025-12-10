import React, { useState, useEffect, useRef } from 'react';
import { CASE_TYPES, DEFAULT_STASH_EDITION } from '../constants';
import type { CaseCounts, StashEdition, CaseType, OptimizationMethod } from '../types';
import { getUsageCount, incrementUsageCount } from '../services/usageCounter';
import { UsageCounter } from './UsageCounter';
import { LoaderIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';
import { CaseCard } from './CaseCard';
import { OptimizationMethodSelector } from './OptimizationMethodSelector';

interface InputFormProps {
  onOptimize: (caseCounts: CaseCounts, edition: StashEdition) => void;
  onOptimizeAll?: (caseCounts: CaseCounts, edition: StashEdition) => void;
  isLoading: boolean;
  caseCounts?: CaseCounts;
  onCaseCountsChange?: (counts: CaseCounts) => void;
  onDecrement?: (caseType: CaseType) => void;
  onRemovePlacedCase?: (caseType: CaseType) => void;
  onClearAll?: () => void;
  placedCounts?: CaseCounts;
  selectedOptimizationMethod?: OptimizationMethod;
  onOptimizationMethodChange?: (method: OptimizationMethod) => void;
}

const STORAGE_KEY = 'tarkovStashOptimizerFormData';

const loadFormData = (): CaseCounts | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Support both old format (with stashEdition) and new format (just caseCounts)
      if (data.caseCounts) {
        return data.caseCounts;
      } else if (data && typeof data === 'object') {
        // Assume it's the caseCounts object directly
        return data as CaseCounts;
      }
    }
  } catch (error) {
    console.error("Could not load form data from localStorage", error);
  }
  return null;
};

const saveFormData = (caseCounts: CaseCounts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ caseCounts }));
  } catch (error) {
    console.error("Could not save form data to localStorage", error);
  }
};

export const InputForm: React.FC<InputFormProps> = ({ 
  onOptimize,
  onOptimizeAll,
  isLoading, 
  caseCounts: externalCaseCounts,
  onCaseCountsChange,
  onDecrement,
  onRemovePlacedCase,
  onClearAll,
  placedCounts,
  selectedOptimizationMethod,
  onOptimizationMethodChange
}) => {
  const initialCounts = Object.fromEntries(
    CASE_TYPES.map(type => [type, 0])
  ) as CaseCounts;

  // Load saved form data or use defaults
  const savedData = loadFormData();
  const [internalCaseCounts, setInternalCaseCounts] = useState<CaseCounts>(savedData ?? initialCounts);
  
  // Use external counts if provided, otherwise use internal state
  const caseCounts = externalCaseCounts ?? internalCaseCounts;
  const setCaseCounts = onCaseCountsChange ?? setInternalCaseCounts;
  const [usageCount, setUsageCount] = useState<number>(0);
  const [showCustomBoxes, setShowCustomBoxes] = useState<boolean>(false);
  
  // Separate regular cases from custom boxes
  const regularCases = CASE_TYPES.filter(type => !type.startsWith('custom_'));
  const customBoxes = CASE_TYPES.filter(type => type.startsWith('custom_'));

  useEffect(() => {
    // Load global usage count on mount
    getUsageCount().then(count => setUsageCount(count));
    
    // Refresh count every 30 seconds to show updates from other users
    const interval = setInterval(() => {
      getUsageCount().then(count => setUsageCount(count));
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Save form data whenever it changes (but skip initial empty state)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Skip saving on initial mount
    }
    // Only save if there are actual counts
    const hasAnyCounts = Object.values(caseCounts).some(count => count > 0);
    if (hasAnyCounts) {
      saveFormData(caseCounts);
    }
  }, [caseCounts]);

  const handleIncrement = (caseType: CaseType) => {
    // Increment remaining count
    const currentRemaining = caseCounts[caseType] || 0;
    const newRemaining = {
      ...caseCounts,
      [caseType]: currentRemaining + 1,
    };
    setCaseCounts(newRemaining);
  };

  const handleReset = (caseType: CaseType) => {
    // Reset remaining count to 0
    const newRemaining = {
      ...caseCounts,
      [caseType]: 0,
    };
    setCaseCounts(newRemaining);
  };

  const handleDecrement = (caseType: CaseType) => {
    // Decrement remaining count
    const currentRemaining = caseCounts[caseType] || 0;
    const newRemaining = {
      ...caseCounts,
      [caseType]: Math.max(0, currentRemaining - 1),
    };
    setCaseCounts(newRemaining);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await incrementUsageCount();
    const latestCount = await getUsageCount(true);
    setUsageCount(latestCount);
    // Calculate total owned (remaining + placed) for optimize
    const totalOwned: CaseCounts = { ...caseCounts };
    if (placedCounts) {
      Object.keys(placedCounts).forEach((type) => {
        const key = type as keyof CaseCounts;
        totalOwned[key] = (totalOwned[key] || 0) + (placedCounts[key] || 0);
      });
    }
    onOptimize(totalOwned, DEFAULT_STASH_EDITION);
  };

  const handleOptimizeAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onOptimizeAll) return;
    await incrementUsageCount();
    const latestCount = await getUsageCount(true);
    setUsageCount(latestCount);
    // Calculate total owned (remaining + placed) for optimize all
    const totalOwned: CaseCounts = { ...caseCounts };
    if (placedCounts) {
      Object.keys(placedCounts).forEach((type) => {
        const key = type as keyof CaseCounts;
        totalOwned[key] = (totalOwned[key] || 0) + (placedCounts[key] || 0);
      });
    }
    onOptimizeAll(totalOwned, DEFAULT_STASH_EDITION);
  };

  const handleClear = () => {
    setCaseCounts(initialCounts);
    localStorage.removeItem(STORAGE_KEY);
    // Also clear all placed cases if handler is provided
    if (onClearAll) {
      onClearAll();
    }
  };
  
  // Calculate total cases including both remaining and placed cases
  const remainingCases = Object.values(caseCounts).reduce((sum: number, count: number) => sum + count, 0);
  const placedCasesCount = placedCounts ? Object.values(placedCounts).reduce((sum: number, count: number) => sum + count, 0) : 0;
  const totalCases = remainingCases + placedCasesCount;

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-[#9A8866] mb-2 uppercase tracking-wide">Configure Your Stash</h2>
            <p className="text-[#9A8866] mb-1">Click case cards to add them to your collection. Each click adds one case.</p>
            <p className="text-sm text-gray-500">
              <strong className="text-gray-400">Tip:</strong> Right-click to remove cases • Drag cards to manually place them • Click X on active cards to reset
            </p>
        </div>
        <UsageCounter count={usageCount} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {regularCases.map(type => (
          <CaseCard
            key={type}
            caseType={type}
            count={caseCounts[type] || 0}
            onIncrement={() => handleIncrement(type)}
            onReset={() => handleReset(type)}
            onDecrement={() => handleDecrement(type)}
            onRemovePlacedCase={onRemovePlacedCase ? () => onRemovePlacedCase(type) : undefined}
            placedCount={placedCounts?.[type] || 0}
          />
        ))}
      </div>
      
      {/* Custom Boxes Section */}
      <div className="mt-6 pt-6 border-t border-white/20">
        <button
          type="button"
          onClick={() => setShowCustomBoxes(!showCustomBoxes)}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a1a]/50 hover:bg-[#2a2a2a]/50 border border-white/20 hover:border-white/30 rounded-lg transition-colors"
        >
          <span className="text-white font-medium uppercase tracking-wider">
            Custom Boxes / Rigs
          </span>
          {showCustomBoxes ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {showCustomBoxes && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {customBoxes.map(type => (
              <CaseCard
                key={type}
                caseType={type}
                count={caseCounts[type] || 0}
                onIncrement={() => handleIncrement(type)}
                onReset={() => handleReset(type)}
                onDecrement={() => handleDecrement(type)}
                onRemovePlacedCase={onRemovePlacedCase ? () => onRemovePlacedCase(type) : undefined}
                placedCount={placedCounts?.[type] || 0}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Optimization Method Selector */}
      <div className="mt-6 pt-6 border-t border-white/20">
        <OptimizationMethodSelector
          selectedMethod={selectedOptimizationMethod || 'greedy'}
          onMethodChange={onOptimizationMethodChange || (() => {})}
          disabled={isLoading}
        />
      </div>
      
      <div className="mt-8 pt-6 border-t border-white/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <p className="text-gray-300">Total Containers: <span className="text-white font-semibold">{totalCases}</span></p>
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 bg-[#1a1a1a] text-gray-300 text-sm font-medium uppercase tracking-wider transition-colors hover:bg-[#2a2a2a] border border-white/20 hover:border-white/40"
          >
            Clear
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {onOptimizeAll && (
            <button
              type="button"
              onClick={handleOptimizeAll}
              disabled={isLoading || totalCases === 0}
              className="flex items-center justify-center min-w-[170px] px-6 py-3 bg-[#D48806] !text-black font-bold uppercase tracking-wider transition-colors hover:bg-[#E5A020] border border-[#D48806]/50 hover:border-[#E5A020]/70 disabled:bg-gray-800 disabled:border-gray-700 disabled:cursor-not-allowed disabled:text-gray-500"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 !text-black" />
                  <span className="!text-black">Optimizing...</span>
                </>
              ) : (
                <span className="!text-black">Optimize All</span>
              )}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || totalCases === 0}
            className="flex items-center justify-center min-w-[170px] px-6 py-3 bg-[#2a2a2a] text-white font-bold uppercase tracking-wider transition-colors hover:bg-[#3a3a3a] border border-white/30 hover:border-white/50 disabled:bg-gray-800 disabled:border-gray-700 disabled:cursor-not-allowed disabled:text-gray-500"
          >
            {isLoading ? (
              <>
                <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" />
                Optimizing...
              </>
            ) : (
              'Place Remaining Cases'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};