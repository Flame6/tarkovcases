import React from 'react';
import { LoaderIcon, HelpIcon } from './Icons';
import { Tooltip } from './Tooltip';
import type { CaseCounts, StashEdition } from '../types';
import { DEFAULT_STASH_EDITION } from '../constants';

interface ActionButtonsProps {
  onOptimize: (caseCounts: CaseCounts, edition: StashEdition) => void;
  onOptimizeAll?: (caseCounts: CaseCounts, edition: StashEdition) => void;
  isLoading: boolean;
  caseCounts: CaseCounts;
  totalCases: number;
}

export const ActionButtons = React.forwardRef<HTMLButtonElement, ActionButtonsProps>(({
  onOptimize,
  onOptimizeAll,
  isLoading,
  caseCounts,
  totalCases,
}, ref) => {
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
    <div className="mb-4 py-2 px-3 bg-[#2D2D2D]/95 backdrop-blur-md border border-white/20 rounded shadow-xl">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        {onOptimizeAll && (
          <div className="flex items-center gap-2">
            <button
              ref={ref}
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
            <Tooltip 
              content={
                <div className="text-left">
                  <strong>Optimize All:</strong> Clears your current layout and automatically arranges ALL your cases from scratch. Use this when starting fresh.
                </div>
              }
              position="bottom"
            >
              <button
                type="button"
                className="text-gray-400 hover:text-gray-300 transition-colors p-1"
                aria-label="Help: Optimize All"
              >
                <HelpIcon className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        )}
        <div className="flex items-center gap-2">
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
          <Tooltip 
            content={
              <div className="text-left">
                <strong>Place Remaining Cases:</strong> Keeps your manually placed cases and only arranges cases that haven't been placed yet. Use this to fill gaps after manual placement.
              </div>
            }
            position="bottom"
          >
            <button
              type="button"
              className="text-gray-400 hover:text-gray-300 transition-colors p-1"
              aria-label="Help: Place Remaining Cases"
            >
              <HelpIcon className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

