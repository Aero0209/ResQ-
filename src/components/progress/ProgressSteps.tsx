import React from 'react';
import { FaCar, FaWrench, FaPhoneAlt } from 'react-icons/fa';

interface ProgressStepsProps {
  currentStep: number;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep }) => {
  const steps = [
    { icon: FaCar, label: 'Véhicule' },
    { icon: FaWrench, label: 'Panne' },
    { icon: FaPhoneAlt, label: 'Contact' },
  ];

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center relative">
        {/* Progress Bar Background */}
        <div className="absolute h-1 bg-gray-700 w-full top-1/2 transform -translate-y-1/2 z-0" />
        
        {/* Active Progress Bar */}
        <div 
          className="absolute h-1 bg-accent-500 top-1/2 transform -translate-y-1/2 z-0 transition-all duration-300"
          style={{ width: `${(currentStep - 1) * 50}%` }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index + 1 <= currentStep;
          const isCompleted = index + 1 < currentStep;

          return (
            <div key={index} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-accent-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span
                className={`mt-2 text-sm font-medium transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressSteps; 