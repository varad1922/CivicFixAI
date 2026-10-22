import React from 'react';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

const IssueTimeline = ({ currentStatus, timeline = [] }) => {
  const steps = [
    { key: 'Reported', label: 'Reported', desc: 'Logged & geo-tagged' },
    { key: 'In Progress', label: 'In Progress', desc: 'Dispatched to crew' },
    { key: 'Resolved', label: 'Resolved', desc: 'Repairs completed' },
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
        {/* Track */}
        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-[#292938] -z-0 rounded-full" />
        <div
          className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-amber-500 via-sky-400 to-purple-500 -z-0 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          style={{ width: `${(activeIndex / 2) * (100 - 15)}%` }}
        />

        {steps.map((step, idx) => {
          const isDone = idx < activeIndex || (idx === 2 && activeIndex === 2);
          const isCurrent = idx === activeIndex && activeIndex !== 2;

          let bubbleClasses = 'bg-[#151520] text-stone-500 border-2 border-[#292938]';
          if (isDone) {
            bubbleClasses =
              'bg-purple-600 text-white border-2 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]';
          } else if (isCurrent) {
            bubbleClasses =
              idx === 0
                ? 'bg-amber-500 text-stone-950 border-2 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-4 ring-amber-500/20'
                : 'bg-sky-500 text-stone-950 border-2 border-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.5)] ring-4 ring-sky-500/20';
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
                  <Circle size={10} className="fill-[#292938]" />
                )}
              </div>
              <span
                className={`mt-2 text-xs font-bold transition-colors ${
                  isCurrent
                    ? idx === 0
                      ? 'text-amber-400'
                      : 'text-sky-400'
                    : isDone
                    ? 'text-purple-300'
                    : 'text-stone-500'
                }`}
              >
                {step.label}
              </span>
              <span className="hidden sm:block text-[11px] text-[#A1A1B5] max-w-[110px] mt-0.5">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detailed timeline log */}
      {timeline && timeline.length > 0 && (
        <div className="mt-6 pt-6 border-t border-[#292938]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A1B5] mb-4">
            Audit Activity Log
          </h4>
          <div className="space-y-3">
            {timeline.map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#101018] border border-[#292938] text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#A855F7] mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#F5F3FF]">
                      Status updated to <span className="text-purple-400 font-extrabold">{entry.status}</span>
                    </span>
                    <span className="text-stone-500 text-[11px]">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Recent'}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-[#A1A1B5] mt-1 italic">
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
