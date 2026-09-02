import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Map as MapIcon, PlusCircle, LayoutDashboard, User } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={24} /> },
    { name: 'Map', path: '/map', icon: <MapIcon size={24} /> },
    { name: 'Report', path: '/report', icon: <PlusCircle size={28} className="text-orange" /> },
    ...(user ? [{ name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={24} /> }] : []),
    ...(user ? [{ name: 'Profile', path: '/profile', icon: <User size={24} /> }] : []),
  ];

  const NavigationDesktop = () => (
    <header className="hidden md:flex bg-deep-green text-paper p-4 justify-between items-center shadow-sm">
      <Link to="/" className="text-2xl font-bold hover:text-sand transition-colors">
        CivicFix AI
      </Link>
      <nav className="flex gap-6 items-center">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`font-medium flex items-center gap-2 hover:text-sand ${
              location.pathname === item.path ? 'text-sand underline decoration-2 underline-offset-4' : ''
            }`}
          >
            {item.name === 'Report' && item.icon}
            {item.name}
          </Link>
        ))}
        {user ? (
          <button onClick={logout} className="text-danger font-medium hover:text-red-400 ml-4">Logout</button>
        ) : (
          <div className="flex gap-4 ml-4 border-l border-paper/30 pl-4">
            <Link to="/login" className="hover:text-sand font-medium">Login</Link>
            <Link to="/register" className="bg-sand text-deep-green px-4 py-1 rounded font-bold hover:bg-white transition-colors">Sign Up</Link>
          </div>
        )}
      </nav>
    </header>
  );

  const NavigationMobile = () => (
    <>
      <header className="md:hidden bg-deep-green text-paper p-3 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <Link to="/" className="text-xl font-bold">CivicFix</Link>
        {user ? (
          <button onClick={logout} className="text-sm font-semibold text-danger">Logout</button>
        ) : (
          <Link to="/login" className="text-sm font-semibold text-sand">Login</Link>
        )}
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-paper border-t border-deep-green/10 flex justify-around items-center p-2 pb-safe z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              location.pathname === item.path ? 'text-deep-green font-bold' : 'text-ink/60 hover:text-deep-green hover:bg-sand/30'
            }`}
          >
            <div className={location.pathname === item.path ? 'transform scale-110' : ''}>
              {item.icon}
            </div>
            <span className="text-[10px] uppercase tracking-wider">{item.name}</span>
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans pb-16 md:pb-0">
      <NavigationDesktop />
      <NavigationMobile />
      <main className="flex-grow w-full max-w-7xl mx-auto md:p-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
