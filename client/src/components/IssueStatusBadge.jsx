import React from 'react';
import { ClipboardList, Clock, CheckCircle } from 'lucide-react';

const IssueStatusBadge = ({ status }) => {
  if (status === 'Reported') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-sand border border-deep-green/20 text-deep-green shadow-sm">
        <ClipboardList size={16} />
        REPORTED
      </span>
    );
  }
  if (status === 'In Progress') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-amber/10 border border-amber/30 text-amber-600 shadow-sm animate-pulse">
        <Clock size={16} className="animate-spin-slow" />
        IN PROGRESS
      </span>
    );
  }
  if (status === 'Resolved' || status === 'Closed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-civic-green/10 border border-civic-green/30 text-civic-green shadow-sm">
        <CheckCircle size={16} />
        RESOLVED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-gray-100 border border-gray-200 text-gray-700 shadow-sm">
      {status}
    </span>
  );
};

export default IssueStatusBadge;
