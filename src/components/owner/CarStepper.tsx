
import React from "react";
import type { FormStep } from "@/types/owner";
import { formSteps, stepLabels } from "@/hooks/useCarStepper";

interface CarStepperProps {
  currentStep: FormStep;
  validatedSteps: Set<FormStep>;
  onStepClick: (step: FormStep) => void;
}

export const CarStepper: React.FC<CarStepperProps> = ({
  currentStep,
  validatedSteps,
  onStepClick
}) => {
  return (
    <div className="mb-8">
      <div className="relative">
        <div className="overflow-x-auto">
          <div className="flex space-x-2 md:space-x-4">
            {formSteps.map((step, index) => {
              const isActive = step === currentStep;
              const isComplete = validatedSteps.has(step);
              return (
                <div
                  key={step}
                  className="flex flex-col items-center flex-1"
                  onClick={() => isComplete ? onStepClick(step) : undefined}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm mb-2
                      ${isActive ? 'bg-rento-blue text-white' :
                        isComplete ? 'bg-green-500 text-white cursor-pointer' :
                        'bg-gray-200 text-gray-500'}
                    `}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs text-center hidden md:block">
                    {stepLabels[step]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
        </div>
      </div>
    </div>
  );
};
