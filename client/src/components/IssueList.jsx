import { Link } from 'react-router-dom';
import IssueStatusBadge from './IssueStatusBadge';
import {
  MapPin,
  Calendar,
  ChevronRight,
  Flame,
  AlertOctagon,
  FileText,
  PlusCircle
} from 'lucide-react';
import { motion } from 'motion/react';

const IssueList = ({ issues = [], emptyMessage = 'No civic issues found.', showReportCta = true }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="p-10 text-center bg-[#151520] rounded-3xl border border-[#292938] shadow-xl flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-950/40 text-purple-400 border border-purple-500/30 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <FileText size={26} />
        </div>
        <h3 className="text-lg font-bold text-[#F5F3FF] mb-1 font-display">No Incident Reports</h3>
        <p className="text-[#A1A1B5] text-sm max-w-sm mb-6">{emptyMessage}</p>
        {showReportCta && (
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95"
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
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-rose-950/40 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.25)]">
            <AlertOctagon size={11} /> Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-950/40 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
            <Flame size={11} /> High
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#1F1F2E] text-stone-300 border border-[#2D2D40]">
            {severity || 'Medium'}
          </span>
        );
    }
  };

  return (
    <div className="w-full">
      {/* Desktop View: Dark Futuristic Neon Table */}
      <div className="hidden lg:block overflow-hidden bg-[#151520] rounded-3xl border border-[#292938] shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#101018] border-b border-[#292938] text-[#A1A1B5] text-xs uppercase tracking-wider font-semibold">
              <th className="py-4 px-5">Incident Overview</th>
              <th className="py-4 px-4">Category</th>
              <th className="py-4 px-4">Severity</th>
              <th className="py-4 px-4">Status</th>
              <th className="py-4 px-4">Logged At</th>
              <th className="py-4 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222230]">
            {issues.map((issue) => (
              <tr
                key={issue._id}
                className="hover:bg-[#1A1A28] transition-colors group cursor-pointer"
              >
                <td className="py-4 px-5">
                  <div className="flex items-center gap-3">
                    {issue.images?.[0]?.url ? (
                      <img
                        src={issue.images[0].url}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-[#2D2D40] shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#101018] border border-[#2D2D40] flex items-center justify-center text-stone-500 shrink-0 font-bold text-xs">
                        <FileText size={18} />
                      </div>
                    )}
                    <div className="min-w-0 max-w-sm">
                      <Link
                        to={`/issues/${issue._id}`}
                        className="font-bold text-[#F5F3FF] group-hover:text-purple-400 transition-colors line-clamp-1 text-sm block font-display"
                      >
                        {issue.title}
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
                        <MapPin size={12} className="text-sky-400 shrink-0" />
                        <span className="truncate">
                          {issue.location?.address || 'Coordinates Logged'}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#101018] border border-[#2D2D40] text-stone-300">
                    {issue.category}
                  </span>
                </td>

                <td className="py-4 px-4">{getSeverityBadge(issue.severity)}</td>

                <td className="py-4 px-4">
                  <IssueStatusBadge status={issue.status} size="sm" />
                </td>

                <td className="py-4 px-4 text-xs text-[#A1A1B5] font-medium">
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 transition-colors shadow-xs"
                  >
                    <span>View Case</span>
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
            className="bg-[#151520] p-4 rounded-3xl border border-[#292938] hover:border-purple-500/40 shadow-xl transition-all flex flex-col justify-between"
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
                <div className="relative h-36 w-full rounded-2xl overflow-hidden mb-3 border border-[#292938]">
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
                className="font-bold text-base text-[#F5F3FF] hover:text-purple-400 transition-colors line-clamp-1 font-display"
              >
                {issue.title}
              </Link>
              <p className="text-xs text-[#A1A1B5] line-clamp-2 mt-1 mb-3">
                {issue.description}
              </p>
            </div>

            <div className="pt-3 border-t border-[#292938] flex items-center justify-between">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#101018] text-stone-300 border border-[#2D2D40]">
                {issue.category}
              </span>
              <Link
                to={`/issues/${issue._id}`}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
              >
                Case File <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default IssueList;
