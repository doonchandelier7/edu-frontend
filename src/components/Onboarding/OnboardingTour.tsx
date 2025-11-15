import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowRightIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to EduCrypto! 🎉',
    description: 'Your journey to mastering trading starts here. Let\'s take a quick tour of the platform.',
    position: 'center',
  },
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description: 'Your dashboard shows your portfolio value, P&L, returns, and quick access to trading, learning, and leaderboards.',
    target: '[data-tour="dashboard"]',
    position: 'bottom',
  },
  {
    id: 'navigation',
    title: 'Navigation Menu',
    description: 'Use the navigation bar to access Home, Learn, Trade, Portfolio, Leaderboard, and Profile sections.',
    target: '[data-tour="navigation"]',
    position: 'bottom',
  },
  {
    id: 'trading',
    title: 'Start Trading',
    description: 'Click on Trade to access the trading interface where you can buy and sell stocks and cryptocurrencies with virtual money.',
    target: '[data-tour="trading"]',
    position: 'bottom',
  },
  {
    id: 'portfolio',
    title: 'Track Your Portfolio',
    description: 'Monitor your holdings, view your profit/loss, and track your performance over time.',
    target: '[data-tour="portfolio"]',
    position: 'bottom',
  },
  {
    id: 'leaderboard',
    title: 'Compete on Leaderboard',
    description: 'See how you rank against other traders and compete to be at the top!',
    target: '[data-tour="leaderboard"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'You now know the basics. Start trading, learn from courses, and climb the leaderboard. Good luck!',
    position: 'center',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [arrowPosition, setArrowPosition] = useState<{ top: number; left: number; direction: 'top' | 'bottom' | 'left' | 'right' } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (currentStep < tourSteps.length) {
      const step = tourSteps[currentStep];
      if (step.target) {
        const element = document.querySelector(step.target);
        if (element) {
          // Scroll element into view
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add highlight class to element
          element.classList.add('tour-highlight');
          
          // Calculate arrow position - arrow points TO the element
          setTimeout(() => {
            const rect = element.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const modalHeight = 400; // Approximate modal height
            const modalWidth = 500; // Approximate modal width
            const modalCenterY = viewportHeight / 2;
            const modalCenterX = viewportWidth / 2;
            
            // Determine arrow position - arrow should point TO the element
            let direction: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
            let top = 0;
            let left = 0;
            
            const elementCenterY = rect.top + (rect.height / 2);
            const elementCenterX = rect.left + (rect.width / 2);
            
            // Calculate distances from modal center to element center
            const deltaY = elementCenterY - modalCenterY;
            const deltaX = elementCenterX - modalCenterX;
            
            // Determine arrow position near the element, pointing toward it
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
              // Vertical alignment - arrow points to element from above or below
              if (deltaY > 0) {
                // Element is below modal - arrow points up to element (from above)
                direction = 'bottom';
                top = rect.top - 30;
                left = elementCenterX;
              } else {
                // Element is above modal - arrow points down to element (from below)
                direction = 'top';
                top = rect.bottom + 30;
                left = elementCenterX;
              }
            } else {
              // Horizontal alignment - arrow points to element from left or right
              if (deltaX > 0) {
                // Element is to the right of modal - arrow points left to element
                direction = 'right';
                top = elementCenterY;
                left = rect.left - 30;
              } else {
                // Element is to the left of modal - arrow points right to element
                direction = 'left';
                top = elementCenterY;
                left = rect.right + 30;
              }
            }
            
            setArrowPosition({ top, left, direction });
          }, 400);
          
          return () => {
            element.classList.remove('tour-highlight');
            setArrowPosition(null);
          };
        }
      } else {
        setArrowPosition(null);
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    if (user?.id) {
      localStorage.setItem(`onboardingCompleted_${user.id}`, 'true');
    }
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingSkipped', 'true');
    if (user?.id) {
      localStorage.setItem(`onboardingSkipped_${user.id}`, 'true');
    }
    onSkip();
  };

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 10000 !important;
          outline: 3px solid #3b82f6 !important;
          outline-offset: 4px;
          border-radius: 8px;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7) !important;
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            outline-color: #3b82f6;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.5) !important;
          }
          50% {
            outline-color: #8b5cf6;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px rgba(139, 92, 246, 0.8) !important;
          }
        }
      `}</style>
      <div className="fixed inset-0 z-[9999]">
        {/* Dark Overlay - Only show if not center position */}
        {currentStepData.position !== 'center' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-all duration-300" />
        )}

        {/* Arrow pointing to target element */}
        {arrowPosition && currentStepData.target && (
          <div
            className="absolute z-[10000] pointer-events-none animate-bounce"
            style={{
              top: `${arrowPosition.top}px`,
              left: `${arrowPosition.left}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className={`text-blue-500 ${
                arrowPosition.direction === 'top' ? 'rotate-180' :
                arrowPosition.direction === 'bottom' ? '' :
                arrowPosition.direction === 'left' ? 'rotate-90' :
                'rotate-[-90deg]'
              }`}
            >
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-2xl"
                style={{ 
                  filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 1)) drop-shadow(0 0 20px rgba(147, 51, 234, 0.8))',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              >
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {/* Tour Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 max-w-lg w-full p-8 relative">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-400">
                  Step {currentStep + 1} of {tourSteps.length}
                </span>
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                  title="Skip Tour"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                {currentStepData.title}
              </h2>
              <p className="text-gray-300 leading-relaxed text-base">
                {currentStepData.description}
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                  currentStep === 0
                    ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700/70 text-white hover:bg-gray-600 hover:scale-105'
                }`}
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex gap-2 items-center">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'bg-blue-500 w-8 h-2.5 shadow-lg shadow-blue-500/50'
                        : index < currentStep
                        ? 'bg-green-500 w-2.5 h-2.5'
                        : 'bg-gray-600 w-2.5 h-2.5'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Skip Button */}
            <button
              onClick={handleSkip}
              className="w-full text-center text-gray-400 hover:text-white text-sm font-medium transition-colors py-2 rounded-lg hover:bg-gray-700/30"
            >
              Skip Tour
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;

