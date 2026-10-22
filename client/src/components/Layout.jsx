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
        { name: 'Home', path: '/', icon: <Home size={18} /> },
        { name: 'Live Map', path: '/map', icon: <MapIcon size={18} /> },
        { name: 'Report', path: '/report', icon: <PlusCircle size={18} /> },
      ];
    }

    if (user.role === 'citizen') {
      return [
        { name: 'Home', path: '/', icon: <Home size={18} /> },
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Report Issue', path: '/report', icon: <PlusCircle size={18} /> },
        { name: 'Civic Map', path: '/map', icon: <MapIcon size={18} /> },
        { name: 'Profile', path: '/profile', icon: <User size={18} /> },
      ];
    }

    if (user.role === 'authority') {
      return [
        { name: 'Command Queue', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'Live Map', path: '/map', icon: <MapIcon size={18} /> },
        { name: 'Log Incident', path: '/report', icon: <PlusCircle size={18} /> },
        { name: 'Profile', path: '/profile', icon: <User size={18} /> },
      ];
    }

    if (user.role === 'admin') {
      return [
        { name: 'Admin Control', path: '/dashboard', icon: <Shield size={18} /> },
        { name: 'Civic Map', path: '/map', icon: <MapIcon size={18} /> },
        { name: 'Profile', path: '/profile', icon: <User size={18} /> },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[#07070B] text-[#F5F3FF] flex flex-col font-sans selection:bg-[#A855F7] selection:text-[#FFFFFF]">
      {/* Dark Futuristic Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#07070B]/90 backdrop-blur-xl border-b border-[#292938] px-4 lg:px-8 py-3.5 transition-all shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Neon Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-sky-400 p-0.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#07070B] rounded-[10px] flex items-center justify-center text-purple-400">
                <Sparkles size={18} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight leading-tight group-hover:text-purple-300 transition-colors font-display text-white">
                CivicFix<span className="text-purple-400 font-bold ml-0.5">AI</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider text-sky-400 uppercase -mt-0.5">
                Futuristic Civic Tech
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'text-[#A1A1B5] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={isActive ? 'text-purple-400' : 'text-stone-400'}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Account Profile */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-[#292938]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-950/70 border border-purple-500/40 overflow-hidden flex items-center justify-center text-xs font-bold text-purple-300 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white max-w-[120px] truncate leading-tight">
                      {user.name || 'User'}
                    </span>
                    <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest leading-none mt-0.5">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-[#A1A1B5] hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95"
                >
                  Join Platform
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
          <div className="md:hidden pt-4 pb-3 border-t border-[#292938] mt-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 font-bold'
                      : 'text-[#A1A1B5] hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-[#292938]">
              {user ? (
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{user.name}</span>
                    <span className="text-[10px] uppercase font-bold text-purple-400 px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30">
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
                    className="text-center py-2 text-sm font-semibold rounded-xl bg-white/5 text-[#A1A1B5]"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2 text-sm font-bold rounded-xl bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
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

      {/* Futuristic Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
