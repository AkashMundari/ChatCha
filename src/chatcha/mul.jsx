import React, { useState } from "react";
import InitialResponseAgent from "./init";
import AnalysisAgent from "./sec";

const MultiAgentSystem = () => {
  // Shared state for CIDs between components
  const [cids, setCids] = useState([]);

  return (
    <div className="flex flex-col gap-4 p-4 bg-black min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-4">
        Multi-Agent AI System
      </h1>

      {/* First agent processes user input but doesn't display results */}
      <div className="mb-6">
        <InitialResponseAgent setCids={setCids} />
      </div>

      {/* Second agent analyzes and displays the enhanced results */}
      <div>
        <AnalysisAgent cids={cids} />
      </div>
    </div>
  );
};

export default MultiAgentSystem;
