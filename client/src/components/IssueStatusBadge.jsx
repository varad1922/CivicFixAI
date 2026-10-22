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
        className={`inline-flex items-center rounded-full bg-orange-50 text-orange-700 border border-orange-200/80 shadow-xs ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping mr-0.5" />
        <AlertCircle size={size === 'lg' ? 16 : 13} className="text-orange-600" />
        <span>Reported</span>
      </span>
    );
  }

  if (normalized === 'In Progress' || normalized === 'Under Review' || normalized === 'Assigned') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs ${sizeClasses}`}
      >
        <Clock size={size === 'lg' ? 16 : 13} className="text-blue-600 animate-spin-slow" />
        <span>In Progress</span>
      </span>
    );
  }

  if (normalized === 'Resolved' || normalized === 'Closed') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs ${sizeClasses}`}
      >
        <CheckCircle2 size={size === 'lg' ? 16 : 13} className="text-emerald-600" />
        <span>Resolved</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-stone-100 text-stone-700 border border-stone-200 shadow-xs ${sizeClasses}`}
    >
      <HelpCircle size={size === 'lg' ? 16 : 13} className="text-stone-500" />
      <span>{normalized || 'Pending'}</span>
    </span>
  );
};

export default IssueStatusBadge;
