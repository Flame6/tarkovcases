import React, { useState, useEffect } from 'react';
import { XIcon } from './Icons';

const WELCOME_MODAL_KEY = 'tarkovStashOptimizerWelcomeDismissed';

interface WelcomeModalProps {
  onDismiss: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has dismissed before
    const dismissed = localStorage.getItem(WELCOME_MODAL_KEY);
    if (!dismissed) {
      // Small delay for smooth appearance
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_MODAL_KEY, 'true');
    }
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      <div 
        className="bg-[#2D2D2D] border border-white/30 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
          <h2 id="welcome-modal-title" className="text-2xl font-bold text-white uppercase tracking-wide">
            Welcome to Tarkov Stash Optimizer
          </h2>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close welcome modal"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 text-gray-300 space-y-4">
          <p className="text-lg">
            This tool helps you optimize your Escape from Tarkov stash layout by automatically arranging cases for maximum space efficiency.
          </p>

          <section>
            <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wide">Quick Start Guide</h3>
            <ol className="list-decimal list-inside space-y-3 ml-2">
              <li>
                <strong className="text-white">Add Your Cases:</strong> Click on the case cards below to add cases to your collection. Each click adds one case.
              </li>
              <li>
                <strong className="text-white">Optimize:</strong> Click <strong className="text-amber-400">"Optimize All"</strong> to automatically arrange all your cases, or <strong className="text-amber-400">"Place Remaining Cases"</strong> to only place cases that aren't already in your stash.
              </li>
              <li>
                <strong className="text-white">Manual Placement (Optional):</strong> Drag cases from the left panel onto the stash grid to place them manually. Right-click to remove.
              </li>
              <li>
                <strong className="text-white">Review:</strong> Check the optimized layout on the right side. You can continue to adjust manually if needed.
              </li>
            </ol>
          </section>

          <section className="bg-[#1a1a1a]/50 p-4 rounded border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-2">Pro Tips</h4>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Use <strong className="text-white">"Place Remaining Cases"</strong> if you've already manually placed some cases and want to fill the gaps</li>
              <li>Right-click case cards to remove cases from your collection</li>
              <li>Drag placed cases on the grid to reposition them</li>
              <li>Drag cases to the trash icon to remove them from the layout</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/20 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-400">Don't show this again</span>
          </label>
          <button
            onClick={handleDismiss}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider transition-colors rounded"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

