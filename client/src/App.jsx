import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="flex gap-4 items-center">
      {user ? (
        <>
          <span className="text-sand/80 text-sm">Welcome, {user.name}</span>
          <Link to="/dashboard" className="hover:text-sand font-medium">Dashboard</Link>
          <button onClick={logout} className="text-danger font-medium hover:text-red-400">Logout</button>
        </>
      ) : (
        <>
          <Link to="/login" className="hover:text-sand font-medium">Login</Link>
          <Link to="/register" className="bg-sand text-deep-green px-4 py-1 rounded font-bold hover:bg-white transition-colors">Sign Up</Link>
        </>
      )}
    </nav>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com'}>
      <AuthProvider>
        <Router>
        <div className="min-h-screen bg-paper text-ink flex flex-col">
          <header className="bg-deep-green text-paper p-4 flex justify-between items-center shadow-sm">
            <Link to="/" className="text-2xl font-bold hover:text-sand transition-colors">
              CivicFix AI
            </Link>
            <Navigation />
          </header>
          <main className="flex-grow p-4">
            <Routes>
              <Route path="/" element={
                <div className="max-w-4xl mx-auto text-center mt-12">
                  <h2 className="text-4xl font-extrabold text-deep-green mb-4">YOUR CITY. IN REAL TIME.</h2>
                  <p className="text-xl text-ink/80 mb-8">Civic Intelligence & Issue Resolution Platform</p>
                  <Link to="/register" className="bg-orange text-paper px-6 py-3 rounded text-lg font-bold hover:bg-orange/90 transition-colors shadow-md">
                    Report an Issue
                  </Link>
                </div>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <div className="max-w-4xl mx-auto mt-8">
                    <h2 className="text-3xl font-bold text-deep-green mb-4">Dashboard</h2>
                    <p>Welcome to your civic control center. This is a protected route.</p>
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
