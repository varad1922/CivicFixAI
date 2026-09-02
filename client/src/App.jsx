import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportIssue from './pages/ReportIssue';
import MapPage from './pages/MapPage';
import IssueDetail from './pages/IssueDetail';
import CitizenDashboard from './pages/dashboards/CitizenDashboard';
import AuthorityDashboard from './pages/dashboards/AuthorityDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { Link } from 'react-router-dom';

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

// Placeholder Home component
const Home = () => (
  <div className="max-w-4xl mx-auto text-center mt-12 p-4">
    <h2 className="text-3xl md:text-5xl font-extrabold text-deep-green mb-4">YOUR CITY. IN REAL TIME.</h2>
    <p className="text-lg md:text-xl text-ink/80 mb-8">Civic Intelligence & Issue Resolution Platform</p>
    <Link to="/report" className="bg-orange text-paper px-6 py-3 rounded text-lg font-bold hover:bg-orange/90 transition-colors shadow-md inline-block">
      Report an Issue
    </Link>
  </div>
);

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com'}>
      <AuthProvider>
        <Router>
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
