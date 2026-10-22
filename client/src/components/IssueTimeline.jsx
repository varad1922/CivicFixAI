import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';

const IssueTimeline = ({ currentStatus, timeline = [] }) => {
  const steps = [
    { key: 'Reported', label: 'Reported', desc: 'Civic issue logged & geo-tagged' },
    { key: 'In Progress', label: 'In Progress', desc: 'Dispatched to municipal team' },
    { key: 'Resolved', label: 'Resolved', desc: 'Repairs completed & verified' },
  ];

  let activeIndex = 0;
  if (currentStatus === 'In Progress' || currentStatus === 'Under Review' || currentStatus === 'Assigned') {
    activeIndex = 1;
  } else if (currentStatus === 'Resolved' || currentStatus === 'Closed') {
    activeIndex = 2;
  }

  return (
    <div className="w-full py-4">
      {/* Horizontal step tracker */}
      <div className="relative flex items-center justify-between mb-8 max-w-xl mx-auto px-4">
        {/* Connecting track */}
        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-stone-200 -z-0 rounded-full" />
        <div
          className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-orange-500 via-blue-500 to-emerald-500 -z-0 rounded-full transition-all duration-500"
          style={{ width: `${(activeIndex / 2) * (100 - 15)}%` }}
        />

        {steps.map((step, idx) => {
          const isDone = idx < activeIndex || (idx === 2 && activeIndex === 2);
          const isCurrent = idx === activeIndex && activeIndex !== 2;
          const isFuture = idx > activeIndex;

          let bubbleClasses = 'bg-white text-stone-400 border-2 border-stone-300';
          if (isDone) {
            bubbleClasses = 'bg-emerald-600 text-white border-2 border-emerald-600 shadow-md shadow-emerald-600/20';
          } else if (isCurrent) {
            bubbleClasses =
              idx === 0
                ? 'bg-orange-500 text-white border-2 border-orange-500 ring-4 ring-orange-500/20 shadow-md'
                : 'bg-blue-600 text-white border-2 border-blue-600 ring-4 ring-blue-600/20 shadow-md';
          }

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 text-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${bubbleClasses}`}
              >
                {isDone ? (
                  <CheckCircle2 size={18} />
                ) : isCurrent ? (
                  <Clock size={16} className="animate-spin-slow" />
                ) : (
                  <Circle size={12} className="fill-stone-300" />
                )}
              </div>
              <span
                className={`mt-2 text-xs font-bold transition-colors ${
                  isCurrent
                    ? idx === 0
                      ? 'text-orange-600'
                      : 'text-blue-600'
                    : isDone
                    ? 'text-emerald-700'
                    : 'text-stone-400'
                }`}
              >
                {step.label}
              </span>
              <span className="hidden sm:block text-[11px] text-stone-500 max-w-[110px] mt-0.5">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detailed timeline log (if records exist) */}
      {timeline && timeline.length > 0 && (
        <div className="mt-6 pt-6 border-t border-stone-200/70">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4">
            Audit Activity History
          </h4>
          <div className="space-y-3">
            {timeline.map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-stone-900">
                      Status changed to <span className="text-emerald-700">{entry.status}</span>
                    </span>
                    <span className="text-stone-400 text-[11px]">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Recent'}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-stone-600 mt-1 italic">
                      "{entry.note}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueTimeline;
