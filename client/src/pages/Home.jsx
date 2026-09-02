import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-deep-green text-paper py-16 md:py-24 px-4 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 max-w-4xl leading-tight">
          See a civic issue. <br className="hidden md:block"/> Report it. Track the progress.
        </h1>
        <p className="text-lg md:text-xl text-paper/80 mb-8 max-w-2xl">
          CivicFix AI empowers you to report local infrastructure problems directly to authorities. Using AI, we automatically categorize and prioritize issues for faster resolution.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/report" className="bg-orange text-paper px-8 py-4 rounded-lg text-lg font-bold hover:bg-orange/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Report an Issue
          </Link>
          <Link to="/map" className="bg-transparent border-2 border-paper text-paper px-8 py-4 rounded-lg text-lg font-bold hover:bg-paper hover:text-deep-green transition-all">
            Explore Nearby Issues
          </Link>
        </div>
      </section>

      {/* Platform Snapshot */}
      <section className="w-full max-w-6xl mx-auto py-16 px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-sand p-6 rounded-xl border border-deep-green/10">
            <h3 className="text-4xl font-bold text-deep-green mb-2">1,245+</h3>
            <p className="text-ink/70 font-semibold uppercase text-sm">Issues Reported</p>
          </div>
          <div className="bg-sand p-6 rounded-xl border border-deep-green/10">
            <h3 className="text-4xl font-bold text-orange mb-2">890</h3>
            <p className="text-ink/70 font-semibold uppercase text-sm">Resolved</p>
          </div>
          <div className="bg-sand p-6 rounded-xl border border-deep-green/10">
            <h3 className="text-4xl font-bold text-info-blue mb-2">24h</h3>
            <p className="text-ink/70 font-semibold uppercase text-sm">Avg. Response</p>
          </div>
          <div className="bg-sand p-6 rounded-xl border border-deep-green/10">
            <h3 className="text-4xl font-bold text-deep-green mb-2">15+</h3>
            <p className="text-ink/70 font-semibold uppercase text-sm">Cities Active</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full bg-sand/50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-deep-green mb-12">How CivicFix Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-deep-green text-paper rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-md">1</div>
              <h3 className="text-xl font-bold mb-2">Report</h3>
              <p className="text-ink/80">Snap a photo of the issue. Our AI instantly suggests the category and severity.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-orange text-paper rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-md">2</div>
              <h3 className="text-xl font-bold mb-2">Authority Review</h3>
              <p className="text-ink/80">Local authorities receive the prioritized report and assign teams to fix it.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-info-blue text-paper rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-md">3</div>
              <h3 className="text-xl font-bold mb-2">Resolution</h3>
              <p className="text-ink/80">Track the progress in real-time until the issue is officially resolved.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="w-full py-20 px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-deep-green mb-6">Ready to improve your city?</h2>
        <Link to="/report" className="inline-block bg-deep-green text-paper px-10 py-4 rounded-lg text-xl font-bold hover:bg-civic-green transition-all shadow-lg">
          Start Reporting Now
        </Link>
      </section>
    </div>
  );
};

export default Home;
