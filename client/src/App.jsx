import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { AuthContext, AuthProvider } from './context/AuthContext';
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
  
  // Later we can add switch case for 'authority' and 'admin'
  if (user.role === 'citizen') {
    return <CitizenDashboard />;
  }
  
  if (user.role === 'authority') {
    return <AuthorityDashboard />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }
  
  // Fallback for now
  return <CitizenDashboard />;
};

// Dashboard routing logic

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com'}>
      <AuthProvider>
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
                  <div className="max-w-4xl mx-auto mt-8 p-4">
                    <h2 className="text-3xl font-bold text-deep-green mb-4">Profile</h2>
                    <p>User profile settings.</p>
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
