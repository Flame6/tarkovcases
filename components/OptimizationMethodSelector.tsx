import React, { useState, useRef, useEffect } from 'react';
import { OPTIMIZATION_METHODS, DEFAULT_OPTIMIZATION_METHOD } from '../constants';
import type { OptimizationMethod } from '../types';
import { QuestionMarkCircleIcon } from './Icons';

interface OptimizationMethodSelectorProps {
  selectedMethod: OptimizationMethod;
  onMethodChange: (method: OptimizationMethod) => void;
  disabled?: boolean;
}

export const OptimizationMethodSelector: React.FC<OptimizationMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectMethod = (method: OptimizationMethod) => {
    onMethodChange(method);
    setIsOpen(false);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'fast': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'slow': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-white/20">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-[#1a1a1a]/50 hover:bg-[#2a2a2a]/50 border border-white/20 hover:border-white/30 rounded-lg transition-colors ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
        disabled={disabled}
      >
        <span className="text-white font-medium uppercase tracking-wider">
          Optimization Algorithm (Advanced)
        </span>
        {isOpen ? (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="mt-4 bg-[#1a1a1a]/50 border border-white/20 rounded-lg">
          {Object.entries(OPTIMIZATION_METHODS).map(([key, method]) => (
            <div
              key={key}
              className={`px-4 py-3 cursor-pointer hover:bg-[#2a2a2a]/50 border-b border-white/10 last:border-b-0 ${
                selectedMethod === key ? 'bg-[#2a2a2a]/50 text-blue-400' : 'text-white'
              }`}
              onClick={() => handleSelectMethod(key as OptimizationMethod)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{method.name}</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${getComplexityColor(method.complexity)}`}>
                    {method.complexity === 'low' ? 'Simple' : 
                     method.complexity === 'medium' ? 'Medium' : 'Complex'}
                  </span>
                  <span className={`text-xs ${getSpeedColor(method.speed)}`}>
                    {method.speed === 'fast' ? 'Fast' : 
                     method.speed === 'medium' ? 'Medium' : 'Slow'}
                  </span>
                  <div className="relative group">
                    <QuestionMarkCircleIcon className="w-4 h-4 text-gray-400" />
                    <div className="absolute right-0 w-64 p-2 mt-1 text-xs text-gray-300 bg-[#1a1a1a] border border-white/20 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 z-20">
                      <p>{method.description}</p>
                      <div className="mt-2 pt-2 border-t border-white/20">
                        <div className="flex justify-between">
                          <span>Complexity:</span>
                          <span className={getComplexityColor(method.complexity)}>
                            {method.complexity === 'low' ? 'Low' : 
                             method.complexity === 'medium' ? 'Medium' : 'High'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Speed:</span>
                          <span className={getSpeedColor(method.speed)}>
                            {method.speed === 'fast' ? 'Fast' : 
                             method.speed === 'medium' ? 'Medium' : 'Slow'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
