import React from 'react';

const DevWarningBanner: React.FC = () => {
  return (
    <div role="alert" className="bg-yellow-900/50 border-b border-yellow-700 text-yellow-300 p-3 text-center text-sm">
      <p>
        <span className="font-bold">Warning:</span> This application is a hobby project and is still under development. Please do not use it for real-life financial decisions.
      </p>
    </div>
  );
};

export default DevWarningBanner;
