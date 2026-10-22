import { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Home,
  Map as MapIcon,
  PlusCircle,
  LayoutDashboard,
  User,
  LogOut,
  Shield,
  Activity,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import Footer from './Footer';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavItems = () => {
    if (!user) {
      return [
        { name: 'Home', path: '/', icon: <Home size={19} /> },
        { name: 'Live Map', path: '/map', icon: <MapIcon size={19} /> },
        { name: 'Report', path: '/report', icon: <PlusCircle size={19} /> },
      ];
    }

    if (user.role === 'citizen') {
      return [
        { name: 'Home', path: '/', icon: <Home size={19} /> },
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={19} /> },
        { name: 'Report Issue', path: '/report', icon: <PlusCircle size={19} /> },
        { name: 'Civic Map', path: '/map', icon: <MapIcon size={19} /> },
        { name: 'Profile', path: '/profile', icon: <User size={19} /> },
      ];
    }

    if (user.role === 'authority') {
      return [
        { name: 'Command Queue', path: '/dashboard', icon: <LayoutDashboard size={19} /> },
        { name: 'Live Map', path: '/map', icon: <MapIcon size={19} /> },
        { name: 'Log Incident', path: '/report', icon: <PlusCircle size={19} /> },
        { name: 'Profile', path: '/profile', icon: <User size={19} /> },
      ];
    }

    if (user.role === 'admin') {
      return [
        { name: 'Admin Control', path: '/dashboard', icon: <Shield size={19} /> },
        { name: 'Civic Map', path: '/map', icon: <MapIcon size={19} /> },
        { name: 'Profile', path: '/profile', icon: <User size={19} /> },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#0F1715] flex flex-col font-sans selection:bg-[#122B22] selection:text-[#F8F7F4]">
      {/* Desktop Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#122B22]/95 backdrop-blur-md border-b border-emerald-900/40 text-[#F8F7F4] px-4 lg:px-8 py-3.5 transition-all shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#122B22] rounded-[10px] flex items-center justify-center text-emerald-400">
                <Sparkles size={18} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight leading-tight group-hover:text-emerald-300 transition-colors font-display">
                CivicFix<span className="text-emerald-400 font-bold ml-0.5">AI</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-emerald-400/80 uppercase -mt-0.5">
                Intelligent Civic Tech
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 shadow-inner border border-emerald-500/20'
                      : 'text-stone-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-stone-400'}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action / User Context */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-emerald-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-700/60 border border-emerald-400/30 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-stone-100 max-w-[120px] truncate leading-tight">
                      {user.name || 'User'}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest leading-none mt-0.5">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-stone-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                  title="Sign Out"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-stone-200 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  Join CivicFix
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-stone-200 hover:bg-white/10 transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-emerald-800/40 mt-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-emerald-800/40">
              {user ? (
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-100">{user.name}</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-900/50">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2 text-sm font-semibold rounded-xl bg-white/5 text-stone-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2 text-sm font-bold rounded-xl bg-emerald-500 text-stone-950 shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {children}
      </main>

      {/* Modern Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
