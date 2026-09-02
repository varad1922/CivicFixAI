import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-deep-green text-paper/80 py-8 px-4 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-2xl font-bold text-paper mb-4">CivicFix AI</h2>
          <p className="max-w-sm text-sm">
            Empowering citizens and authorities to collaborate on urban infrastructure improvements through AI-driven insights.
          </p>
        </div>
        <div>
          <h3 className="text-paper font-semibold mb-4 uppercase tracking-wider text-sm">Platform</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-paper transition-colors">Home</Link></li>
            <li><Link to="/map" className="hover:text-paper transition-colors">Issue Map</Link></li>
            <li><Link to="/report" className="hover:text-paper transition-colors">Report Issue</Link></li>
            <li><Link to="/dashboard" className="hover:text-paper transition-colors">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-paper font-semibold mb-4 uppercase tracking-wider text-sm">Company</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-paper transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-paper transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-paper transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-paper transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-paper/20 text-sm text-center">
        &copy; {new Date().getFullYear()} CivicFix AI. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
