import React from 'react';
import { CheckCircle2, Circle, CheckCircle, Clock } from 'lucide-react';

const IssueTimeline = ({ currentStatus }) => {
  const steps = ['Reported', 'In Progress', 'Resolved'];
  
  let currentStepIndex = 0;
  if (currentStatus === 'In Progress') currentStepIndex = 1;
  if (currentStatus === 'Resolved' || currentStatus === 'Closed') currentStepIndex = 2;

  return (
    <div className="py-4">
      <div className="relative border-l-2 border-deep-green/10 ml-3 md:ml-4 space-y-6">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex || (index === 2 && currentStepIndex === 2);
          const isCurrent = index === currentStepIndex && index !== 2;
          const isFuture = index > currentStepIndex;

          return (
            <div key={step} className="relative flex items-center pl-6">
              {/* Icon / Marker */}
              <div className={`absolute -left-[13px] flex items-center justify-center w-6 h-6 rounded-full bg-paper`}>
                {isCompleted && (
                  <CheckCircle className="w-6 h-6 text-civic-green bg-paper rounded-full" />
                )}
                {isCurrent && (
                  <Clock className="w-6 h-6 text-amber-500 animate-pulse bg-paper rounded-full" />
                )}
                {isFuture && (
                  <Circle className="w-5 h-5 text-ink/30 bg-paper rounded-full" />
                )}
              </div>

              {/* Text */}
              <div className={`flex flex-col ${isFuture ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isCurrent ? 'text-amber-600' : isCompleted ? 'text-civic-green' : 'text-ink/60'}`}>
                    {step}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded tracking-wider uppercase">
                      Current
                    </span>
                  )}
                  {isCompleted && index === 2 && (
                    <span className="text-[10px] font-bold bg-civic-green/20 text-civic-green px-2 py-0.5 rounded tracking-wider uppercase">
                      Complete
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IssueTimeline;
