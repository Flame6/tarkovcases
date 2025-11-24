import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, XIcon } from './Icons';

interface InstructionsProps {
  defaultExpanded?: boolean;
}

export const Instructions: React.FC<InstructionsProps> = ({ defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-6 bg-[#2D2D2D]/60 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a1a]/50 hover:bg-[#2a2a2a]/50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="instructions-content"
      >
        <span className="text-white font-semibold uppercase tracking-wider text-sm">
          How to Use This Tool
        </span>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div id="instructions-content" className="px-4 py-4 text-gray-300 space-y-4">
          {/* Quick Start */}
          <section>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Quick Start</h3>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Click on case cards to add them to your collection (or use the + button)</li>
              <li>Click <strong className="text-white">"Optimize All"</strong> to automatically arrange all your cases</li>
              <li>Or click <strong className="text-white">"Place Remaining Cases"</strong> to only place cases that aren't already in your stash</li>
              <li>Drag cases from the left panel onto the stash grid to manually place them</li>
            </ol>
          </section>

          {/* Understanding the Buttons */}
          <section>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Understanding the Buttons</h3>
            <div className="space-y-2 ml-2">
              <div>
                <strong className="text-white">Optimize All:</strong>
                <span className="ml-2">Clears your current layout and automatically arranges ALL your cases from scratch. Use this when starting fresh.</span>
              </div>
              <div>
                <strong className="text-white">Place Remaining Cases:</strong>
                <span className="ml-2">Keeps your manually placed cases and only arranges cases that haven't been placed yet. Use this to fill gaps after manual placement.</span>
              </div>
            </div>
          </section>

          {/* Case Card Interactions */}
          <section>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Case Card Interactions</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-white">Click</strong> a case card to add one to your collection</li>
              <li><strong className="text-white">Right-click</strong> a case card to remove one from your collection</li>
              <li><strong className="text-white">Drag</strong> a case card onto the stash grid to manually place it</li>
              <li><strong className="text-white">Click the X</strong> button on an active card to reset its count to zero</li>
            </ul>
          </section>

          {/* Manual Placement */}
          <section>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Manual Placement Tips</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Drag cases from the left panel onto the stash grid to place them manually</li>
              <li>Cases will automatically rotate if they fit better in a rotated position</li>
              <li>Right-click a placed case on the grid to remove it</li>
              <li>Drag a placed case to move it to a new position</li>
              <li>Drag a case to the trash icon (top-right of grid) to remove it</li>
            </ul>
          </section>

          {/* Understanding Counts */}
          <section>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Understanding Case Counts</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-white">Owned:</strong> Total number of this case type you have</li>
              <li><strong className="text-white">Placed:</strong> How many are currently in your stash layout</li>
              <li><strong className="text-white">Remaining:</strong> How many you own but haven't placed yet</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};

