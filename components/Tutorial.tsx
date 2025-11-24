import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XIcon } from './Icons';

const TUTORIAL_KEY = 'tarkovStashOptimizerTutorialCompleted';

interface TutorialProps {
  caseInputFormRef: React.RefObject<HTMLElement>;
  optimizeButtonRef: React.RefObject<HTMLButtonElement>;
  stashLayoutRef: React.RefObject<HTMLElement | HTMLDivElement>;
}

interface TutorialStep {
  id: number;
  targetRef: React.RefObject<HTMLElement | HTMLButtonElement | HTMLDivElement>;
  instruction: string;
}

type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';

export const Tutorial: React.FC<TutorialProps> = ({
  caseInputFormRef,
  optimizeButtonRef,
  stashLayoutRef,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition>('bottom');
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const steps: TutorialStep[] = [
    {
      id: 1,
      targetRef: caseInputFormRef,
      instruction: 'Click the cases you own (Click multiple times for multiple of same case)',
    },
    {
      id: 2,
      targetRef: optimizeButtonRef,
      instruction: 'Click auto optimize',
    },
    {
      id: 3,
      targetRef: stashLayoutRef,
      instruction: 'Look at results',
    },
  ];

  const currentStepData = steps[currentStep - 1];

  // Check if tutorial was already completed
  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_KEY);
    if (!completed) {
      // Small delay for smooth appearance
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  // Calculate popover position based on available space
  const calculatePosition = useCallback((rect: DOMRect): PopoverPosition => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverWidth = 320; // Approximate popover width
    const popoverHeight = 150; // Approximate popover height
    const spacing = 20; // Space between popover and target

    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    // Prefer bottom, then top, then right, then left
    if (spaceBelow >= popoverHeight + spacing) {
      return 'bottom';
    } else if (spaceAbove >= popoverHeight + spacing) {
      return 'top';
    } else if (spaceRight >= popoverWidth + spacing) {
      return 'right';
    } else {
      return 'left';
    }
  }, []);

  // Update popover position when step changes or window resizes
  useEffect(() => {
    if (!isVisible || !currentStepData) return;

    const updatePosition = () => {
      const targetElement = currentStepData.targetRef.current;
      if (!targetElement) {
        // If target not found, skip to next step or close tutorial
        if (currentStep < steps.length) {
          setTimeout(() => setCurrentStep(currentStep + 1), 100);
        } else {
          setIsVisible(false);
          localStorage.setItem(TUTORIAL_KEY, 'true');
        }
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);
      const position = calculatePosition(rect);
      setPopoverPosition(position);

      // Auto-scroll to bring target into view
      setTimeout(() => {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(updatePosition, 100);

    // Handle window resize
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible, currentStep, currentStepData, calculatePosition, steps.length]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSkip();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem(TUTORIAL_KEY, 'true');
  };

  if (!isVisible || !currentStepData || !targetRect) return null;

  // Calculate popover position coordinates
  const getPopoverStyle = (): React.CSSProperties => {
    const spacing = 20;
    const popoverWidth = 320;
    const popoverHeight = 150;

    let top = 0;
    let left = 0;
    let transform = '';

    switch (popoverPosition) {
      case 'bottom':
        top = targetRect.bottom + spacing;
        left = targetRect.left + targetRect.width / 2;
        transform = 'translateX(-50%)';
        break;
      case 'top':
        top = targetRect.top - popoverHeight - spacing;
        left = targetRect.left + targetRect.width / 2;
        transform = 'translateX(-50%)';
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + spacing;
        transform = 'translateY(-50%)';
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - popoverWidth - spacing;
        transform = 'translateY(-50%)';
        break;
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      transform,
      zIndex: 9999,
    };
  };

  // Calculate arrow position
  const getArrowStyle = (): React.CSSProperties => {
    const arrowSize = 12;
    let borderStyle = '';

    switch (popoverPosition) {
      case 'bottom':
        borderStyle = `border-bottom: ${arrowSize}px solid #2D2D2D; border-left: ${arrowSize}px solid transparent; border-right: ${arrowSize}px solid transparent;`;
        return {
          position: 'absolute',
          top: `-${arrowSize}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderTop: 'none',
          borderBottom: `${arrowSize}px solid #2D2D2D`,
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
        };
      case 'top':
        return {
          position: 'absolute',
          bottom: `-${arrowSize}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderBottom: 'none',
          borderTop: `${arrowSize}px solid #2D2D2D`,
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
        };
      case 'right':
        return {
          position: 'absolute',
          left: `-${arrowSize}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderRight: 'none',
          borderLeft: `${arrowSize}px solid #2D2D2D`,
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
        };
      case 'left':
        return {
          position: 'absolute',
          right: `-${arrowSize}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderLeft: 'none',
          borderRight: `${arrowSize}px solid #2D2D2D`,
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
        };
    }
  };

  // Calculate highlight overlay
  const getHighlightStyle = (): React.CSSProperties => {
    const padding = 8; // Padding around highlighted element
    return {
      position: 'fixed',
      top: `${targetRect.top - padding}px`,
      left: `${targetRect.left - padding}px`,
      width: `${targetRect.width + padding * 2}px`,
      height: `${targetRect.height + padding * 2}px`,
      border: '3px solid #fbbf24', // amber-400
      borderRadius: '4px',
      pointerEvents: 'none',
      zIndex: 9998,
      transition: 'all 0.3s ease-in-out',
    };
  };

  return (
    <>
      {/* Highlight overlay */}
      <div style={getHighlightStyle()} />

      {/* Popover */}
      <div
        ref={popoverRef}
        className="bg-[#2D2D2D] border border-white/30 rounded-lg shadow-2xl min-w-[280px] max-w-[400px] transition-all duration-300"
        style={getPopoverStyle()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        {/* Arrow */}
        <div style={getArrowStyle()} />

        {/* Content */}
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 id="tutorial-title" className="text-lg font-bold text-white uppercase tracking-wide">
                Step {currentStep} of {steps.length}
              </h3>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-white transition-colors ml-4"
              aria-label="Skip tutorial"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Instruction */}
          <p className="text-gray-300 mb-4 text-base leading-relaxed">
            {currentStepData.instruction}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              Skip Tutorial
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider transition-colors rounded text-sm"
            >
              {currentStep < steps.length ? 'Next' : 'Got it!'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

