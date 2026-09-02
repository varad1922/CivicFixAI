import IssueMap from '../components/IssueMap';

const MapPage = () => {
  return (
    <div className="max-w-6xl mx-auto mt-6 px-4">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-deep-green">Interactive Issue Map</h1>
          <p className="text-ink/70 mt-1">Explore reported civic issues in your area.</p>
        </div>
      </div>
      
      <div className="bg-sand p-2 rounded-lg">
        <IssueMap />
      </div>
    </div>
  );
};

export default MapPage;
