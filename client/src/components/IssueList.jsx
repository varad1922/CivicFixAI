import { Link } from 'react-router-dom';

const IssueList = ({ issues, emptyMessage = 'No issues found.' }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="p-8 text-center text-ink/60 bg-paper rounded border border-deep-green/10">
        <p>{emptyMessage}</p>
        <Link to="/report" className="text-info-blue hover:underline mt-2 inline-block font-medium">Report an issue now</Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop View: Table */}
      <div className="hidden lg:block overflow-x-auto bg-paper rounded border border-deep-green/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sand">
              <th className="p-4 border-b border-deep-green/10 text-sm font-bold text-deep-green">Title</th>
              <th className="p-4 border-b border-deep-green/10 text-sm font-bold text-deep-green">Category</th>
              <th className="p-4 border-b border-deep-green/10 text-sm font-bold text-deep-green">Severity</th>
              <th className="p-4 border-b border-deep-green/10 text-sm font-bold text-deep-green">Status</th>
              <th className="p-4 border-b border-deep-green/10 text-sm font-bold text-deep-green">Date</th>
              <th className="p-4 border-b border-deep-green/10 text-sm font-bold text-deep-green text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => (
              <tr key={issue._id} className="hover:bg-sand/30 border-b border-deep-green/5 transition-colors">
                <td className="p-4 font-semibold text-ink max-w-xs truncate">{issue.title}</td>
                <td className="p-4 text-ink/80">{issue.category}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    issue.severity === 'Critical' ? 'bg-danger/20 text-danger' : 
                    issue.severity === 'High' ? 'bg-orange/20 text-orange' : 
                    'bg-sand text-deep-green'
                  }`}>
                    {issue.severity}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    issue.status === 'Resolved' ? 'bg-civic-green/20 text-civic-green' : 
                    'bg-deep-green/10 text-deep-green'
                  }`}>
                    {issue.status}
                  </span>
                </td>
                <td className="p-4 text-ink/60 text-sm">{new Date(issue.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  <Link to={`/issues/${issue._id}`} className="text-info-blue hover:underline font-medium text-sm">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet View: Cards */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
        {issues.map(issue => (
          <Link 
            key={issue._id} 
            to={`/issues/${issue._id}`}
            className="block bg-paper p-4 rounded-lg shadow-sm border border-deep-green/10 hover:border-deep-green/30 active:scale-[0.99] transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                issue.status === 'Resolved' ? 'bg-civic-green/20 text-civic-green' : 'bg-deep-green/10 text-deep-green'
              }`}>
                {issue.status}
              </span>
              <span className="text-xs text-ink/50 font-medium">
                {new Date(issue.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <h3 className="font-bold text-lg mb-1 leading-tight text-deep-green">{issue.title}</h3>
            <p className="text-sm text-ink/70 mb-3 line-clamp-2">{issue.description}</p>
            
            <div className="flex justify-between items-center text-xs font-semibold pt-3 border-t border-deep-green/5">
              <span className="text-ink/80">{issue.category}</span>
              <span className={issue.severity === 'Critical' ? 'text-danger' : 'text-orange'}>
                {issue.severity}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default IssueList;
