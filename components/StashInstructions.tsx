import React from 'react';
import { HelpIcon } from './Icons';

interface StashInstructionsProps {
  totalCases: number;
}

export const StashInstructions: React.FC<StashInstructionsProps> = ({ totalCases }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-gray-200 uppercase tracking-wide">Stash Layout</h2>
      </div>

      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 mx-auto flex items-center justify-center bg-[#1a1a1a] border-2 border-dashed border-white/20 rounded-lg">
          <HelpIcon className="w-12 h-12 text-gray-500" />
        </div>

        <div className="max-w-md space-y-4">
          <h3 className="text-xl font-bold text-white uppercase tracking-wide">
            Ready to Optimize Your Stash?
          </h3>

          {totalCases === 0 ? (
            <div className="space-y-3 text-gray-300">
              <p className="text-lg">
                Start by adding cases to your collection on the left.
              </p>
              <div className="bg-[#1a1a1a]/50 p-4 rounded border border-white/10 text-left space-y-2">
                <p className="text-sm font-semibold text-white mb-2">Quick Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
                  <li>Click on case cards to add them to your collection</li>
                  <li>Each click adds one case of that type</li>
                  <li>Once you've added your cases, click "Optimize All"</li>
                  <li>Your optimized layout will appear here</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-gray-300">
              <p className="text-lg">
                You have <span className="text-white font-bold">{totalCases}</span> case{totalCases !== 1 ? 's' : ''} ready to optimize!
              </p>
              <div className="bg-[#1a1a1a]/50 p-4 rounded border border-white/10 text-left space-y-2">
                <p className="text-sm font-semibold text-white mb-2">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
                  <li>Click <strong className="text-white">"Optimize All"</strong> to automatically arrange all your cases</li>
                  <li>Or click <strong className="text-white">"Place Remaining Cases"</strong> if you've already manually placed some</li>
                  <li>Your optimized layout will appear here once you run optimization</li>
                </ol>
              </div>
              <div className="bg-amber-900/20 border border-amber-700/30 p-3 rounded text-sm text-amber-200 mt-4">
                <strong>Tip:</strong> You can also drag cases from the left panel onto the grid to manually place them before optimizing.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

