import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ReactGA from 'react-ga4';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportIssue from './pages/ReportIssue';
import MapPage from './pages/MapPage';
import IssueDetail from './pages/IssueDetail';
import Home from './pages/Home';
import CitizenDashboard from './pages/dashboards/CitizenDashboard';
import AuthorityDashboard from './pages/dashboards/AuthorityDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import { Link } from 'react-router-dom';

// Initialize GA4
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (MEASUREMENT_ID) {
  ReactGA.initialize(MEASUREMENT_ID);
}

const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (MEASUREMENT_ID) {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }
  }, [location]);

  return null;
};

const DashboardRouter = () => {
  const { user } = useContext(AuthContext);
  
  if (!user) return null;
  
  if (user.role === 'citizen') {
    return <CitizenDashboard />;
  }
  
  if (user.role === 'authority') {
    return <AuthorityDashboard />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }
  
  // Fallback if role is invalid or not yet loaded correctly
  return <div className="p-8 text-center text-ink/60">Invalid or missing account role. Please log in again.</div>;
};

// Dashboard routing logic

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com'}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <RouteTracker />
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/issues/:id" element={<IssueDetail />} />
                <Route path="/report" element={
                  <ProtectedRoute>
                    <ReportIssue />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardRouter />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
              </Routes>
            </Layout>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
