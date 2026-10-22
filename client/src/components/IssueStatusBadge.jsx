import React from 'react';
import { AlertCircle, Clock, CheckCircle2, HelpCircle } from 'lucide-react';

const IssueStatusBadge = ({ status, size = 'md' }) => {
  const normalized = String(status || '').trim();

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1 font-semibold',
    md: 'text-xs px-3 py-1 gap-1.5 font-bold',
    lg: 'text-sm px-4 py-1.5 gap-2 font-bold',
  }[size] || 'text-xs px-3 py-1 gap-1.5 font-bold';

  if (normalized === 'Reported') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-amber-950/40 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping mr-0.5" />
        <AlertCircle size={size === 'lg' ? 16 : 13} className="text-amber-400" />
        <span>Reported</span>
      </span>
    );
  }

  if (normalized === 'In Progress' || normalized === 'Under Review' || normalized === 'Assigned') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-sky-950/40 text-sky-300 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.25)] ${sizeClasses}`}
      >
        <Clock size={size === 'lg' ? 16 : 13} className="text-sky-400 animate-spin-slow" />
        <span>In Progress</span>
      </span>
    );
  }

  if (normalized === 'Resolved' || normalized === 'Closed') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-purple-950/50 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)] ${sizeClasses}`}
      >
        <CheckCircle2 size={size === 'lg' ? 16 : 13} className="text-purple-400" />
        <span>Resolved</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-[#1A1A28] text-stone-400 border border-[#292938] ${sizeClasses}`}
    >
      <HelpCircle size={size === 'lg' ? 16 : 13} className="text-stone-500" />
      <span>{normalized || 'Pending'}</span>
    </span>
  );
};

export default IssueStatusBadge;
