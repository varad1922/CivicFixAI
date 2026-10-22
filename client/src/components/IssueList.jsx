import { Link } from 'react-router-dom';
import IssueStatusBadge from './IssueStatusBadge';
import {
  MapPin,
  Calendar,
  ChevronRight,
  Flame,
  AlertOctagon,
  FileText,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';

const IssueList = ({ issues = [], emptyMessage = 'No civic issues found.', showReportCta = true }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
          <FileText size={28} />
        </div>
        <h3 className="text-lg font-bold text-stone-900 mb-1">No Reports Available</h3>
        <p className="text-stone-500 text-sm max-w-sm mb-6">{emptyMessage}</p>
        {showReportCta && (
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#122B22] text-white font-semibold text-sm hover:bg-[#1A3E31] transition-all shadow-md shadow-emerald-950/20 active:scale-95"
          >
            <PlusCircle size={16} />
            <span>Report a Civic Issue</span>
          </Link>
        )}
      </div>
    );
  }

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/70">
            <AlertOctagon size={11} /> Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/70">
            <Flame size={11} /> High
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
            {severity || 'Medium'}
          </span>
        );
    }
  };

  return (
    <div className="w-full">
      {/* Desktop View: Elevated Modern Table */}
      <div className="hidden lg:block overflow-hidden bg-white rounded-2xl border border-stone-200/80 shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200/70 text-stone-500 text-xs uppercase tracking-wider font-semibold">
              <th className="py-4 px-5">Issue Details</th>
              <th className="py-4 px-4">Category</th>
              <th className="py-4 px-4">Severity</th>
              <th className="py-4 px-4">Status</th>
              <th className="py-4 px-4">Date Logged</th>
              <th className="py-4 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {issues.map((issue) => (
              <tr
                key={issue._id}
                className="hover:bg-stone-50/70 transition-colors group cursor-pointer"
              >
                <td className="py-4 px-5">
                  <div className="flex items-center gap-3">
                    {issue.images?.[0]?.url ? (
                      <img
                        src={issue.images[0].url}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200/80 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-400 shrink-0">
                        <FileText size={20} />
                      </div>
                    )}
                    <div className="min-w-0 max-w-sm">
                      <Link
                        to={`/issues/${issue._id}`}
                        className="font-bold text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-1 text-sm block"
                      >
                        {issue.title}
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">
                          {issue.location?.address || 'Location Coordinates Logged'}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700">
                    {issue.category}
                  </span>
                </td>
                <td className="py-4 px-4">{getSeverityBadge(issue.severity)}</td>
                <td className="py-4 px-4">
                  <IssueStatusBadge status={issue.status} size="sm" />
                </td>
                <td className="py-4 px-4 text-xs text-stone-500 font-medium">
                  {issue.createdAt
                    ? new Date(issue.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent'}
                </td>
                <td className="py-4 px-5 text-right">
                  <Link
                    to={`/issues/${issue._id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <span>View</span>
                    <ChevronRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card Grid View */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {issues.map((issue) => (
          <motion.div
            key={issue._id}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <IssueStatusBadge status={issue.status} size="sm" />
                <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
                  <Calendar size={12} />
                  {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>

              {issue.images?.[0]?.url && (
                <div className="relative h-36 w-full rounded-xl overflow-hidden mb-3 border border-stone-200/60">
                  <img
                    src={issue.images[0].url}
                    alt={issue.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">{getSeverityBadge(issue.severity)}</div>
                </div>
              )}

              <Link
                to={`/issues/${issue._id}`}
                className="font-bold text-base text-stone-900 hover:text-emerald-800 transition-colors line-clamp-1"
              >
                {issue.title}
              </Link>
              <p className="text-xs text-stone-500 line-clamp-2 mt-1 mb-3">
                {issue.description}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                {issue.category}
              </span>
              <Link
                to={`/issues/${issue._id}`}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
              >
                Details <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default IssueList;
