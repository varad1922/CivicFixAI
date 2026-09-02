import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-paper text-ink">
        <header className="bg-deep-green text-paper p-4">
          <h1 className="text-2xl font-bold">CivicFix AI</h1>
        </header>
        <main className="p-4">
          <Routes>
            <Route path="/" element={
              <div>
                <h2 className="text-xl font-bold mb-4">YOUR CITY. IN REAL TIME.</h2>
                <p>Welcome to CivicFix AI.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
