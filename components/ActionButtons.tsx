import React from 'react';
import { LoaderIcon } from './Icons';
import type { CaseCounts, StashEdition } from '../types';

interface ActionButtonsProps {
  onOptimize: (caseCounts: CaseCounts, edition: StashEdition) => void;
  onOptimizeAll?: (caseCounts: CaseCounts, edition: StashEdition) => void;
  isLoading: boolean;
  caseCounts: CaseCounts;
  totalCases: number;
}

const DEFAULT_STASH_EDITION: StashEdition = 'Edge of Darkness';

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onOptimize,
  onOptimizeAll,
  isLoading,
  caseCounts,
  totalCases,
}) => {
  const handleOptimize = async (e: React.MouseEvent) => {
    e.preventDefault();
    onOptimize(caseCounts, DEFAULT_STASH_EDITION);
  };

  const handleOptimizeAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onOptimizeAll) return;
    onOptimizeAll(caseCounts, DEFAULT_STASH_EDITION);
  };

  return (
    <div className="sticky top-0 z-50 mb-4 py-2 px-3 bg-[#2D2D2D]/95 backdrop-blur-md border border-white/20 rounded shadow-xl">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        {onOptimizeAll && (
          <button
            type="button"
            onClick={handleOptimizeAll}
            disabled={isLoading || totalCases === 0}
            className="flex items-center justify-center px-4 py-2 bg-[#1a4a1a] text-white font-semibold text-sm uppercase tracking-wider transition-colors hover:bg-[#2a6a2a] border border-green-500/30 hover:border-green-500/50 disabled:bg-gray-800 disabled:border-gray-700 disabled:cursor-not-allowed disabled:text-gray-500"
          >
            {isLoading ? (
              <>
                <LoaderIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Optimizing...
              </>
            ) : (
              'Optimize All'
            )}
          </button>
        )}
        <button
          type="button"
          onClick={handleOptimize}
          disabled={isLoading || totalCases === 0}
          className="flex items-center justify-center px-4 py-2 bg-[#2a2a2a] text-white font-semibold text-sm uppercase tracking-wider transition-colors hover:bg-[#3a3a3a] border border-white/30 hover:border-white/50 disabled:bg-gray-800 disabled:border-gray-700 disabled:cursor-not-allowed disabled:text-gray-500"
        >
          {isLoading ? (
            <>
              <LoaderIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Optimizing...
            </>
          ) : (
            'Place Remaining Cases'
          )}
        </button>
      </div>
    </div>
  );
};

