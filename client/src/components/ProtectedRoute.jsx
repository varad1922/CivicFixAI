import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-400 p-0.5 animate-spin shadow-[0_0_15px_rgba(168,85,247,0.4)]">
          <div className="w-full h-full bg-[#07070B] rounded-[14px] flex items-center justify-center text-purple-400">
            <Sparkles size={18} />
          </div>
        </div>
        <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">
          Authenticating Session...
        </p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
