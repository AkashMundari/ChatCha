// import React, { useState } from "react";
// import InitialResponseAgent from "../components/test";
// import AnalysisAgent from "./sec";

// const MultiAgentSystem = () => {
//   // Shared state for CIDs between components
//   const [cids, setCids] = useState([]);

//   return (
//     <div className="flex flex-col gap-4 p-4 bg-black min-h-screen">
//       <h1 className="text-2xl font-bold text-white mb-4">
//         Multi-Agent AI System
//       </h1>

//       {/* First agent processes user input but doesn't display results */}
//       <div className="mb-6">
//         <InitialResponseAgent setCids={setCids} />
//       </div>

//       {/* Second agent analyzes and displays the enhanced results */}
//       <div>
//         <AnalysisAgent cids={cids} />
//       </div>
//     </div>
//   );
// };

// export default MultiAgentSystem;

import React, { useState, useEffect } from "react";
import InitialResponseAgent from "../components/test";
import AnalysisAgent from "./sec";
import {
  ArrowRight,
  Braces,
  Database,
  Layout,
  Lightbulb,
  MessageSquare,
} from "lucide-react";

const MultiAgentSystem = () => {
  // Shared state for CIDs between components
  const [cids, setCids] = useState([]);
  // Track which layout mode is active
  const [layoutMode, setLayoutMode] = useState("split"); // "split", "chat", "analysis"
  // Track active space for visualization
  const [activeSpace, setActiveSpace] = useState("main");
  // Animation state for space transition
  const [isSpaceTransitioning, setIsSpaceTransitioning] = useState(false);
  // Track previous conversations for display
  // const [conversations, setConversations] = useState([]);

  // Simulate space transitions based on new CIDs being added
  useEffect(() => {
    if (cids.length > 0) {
      const lastCid = cids[cids.length - 1];

      // Show transition animation
      setIsSpaceTransitioning(true);

      // Determine which space based on CID pattern (in real app, this would come from the agent)
      const newSpace = lastCid.includes("web")
        ? "web"
        : lastCid.includes("scholar")
        ? "scholar"
        : "main";

      // Add artificial delay to show the transition animation
      setTimeout(() => {
        setActiveSpace(newSpace);
        setIsSpaceTransitioning(false);
      }, 800);
    }
  }, [cids]);

  // Toggle between layout modes
  const toggleLayout = (mode) => {
    setLayoutMode(mode);
  };

  return (
    <div className="flex flex-col bg-gray-950 min-h-screen overflow-hidden text-white">
      {/* Header with space visualization */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-950 border-b border-gray-800 py-4 px-6 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            ChatCha AI
          </h1>

          {/* Layout toggle buttons */}
          <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => toggleLayout("split")}
              className={`p-2 rounded-md transition-colors ${
                layoutMode === "split"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Split view"
            >
              <Layout size={18} />
            </button>
            <button
              onClick={() => toggleLayout("chat")}
              className={`p-2 rounded-md transition-colors ${
                layoutMode === "chat"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Chat only"
            >
              <MessageSquare size={18} />
            </button>
            <button
              onClick={() => toggleLayout("analysis")}
              className={`p-2 rounded-md transition-colors ${
                layoutMode === "analysis"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Analysis only"
            >
              <Lightbulb size={18} />
            </button>
          </div>
        </div>

        {/* Space indicator */}
        <div className="mt-4 flex items-center">
          <div className="text-sm text-gray-400 mr-3">
            Active Storage Space:
          </div>
          <div className="flex items-center space-x-4">
            {/* Main space */}
            <div
              className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-all duration-300 ${
                activeSpace === "main"
                  ? "bg-blue-600/20 border border-blue-500/30 text-blue-400"
                  : "bg-gray-800/50 text-gray-500"
              }`}
            >
              <Database size={16} />
              <span>Main Space</span>
              {activeSpace === "main" && (
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse ml-1"></span>
              )}
            </div>

            {/* Web space */}
            <div
              className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-all duration-300 ${
                activeSpace === "web"
                  ? "bg-green-600/20 border border-green-500/30 text-green-400"
                  : "bg-gray-800/50 text-gray-500"
              }`}
            >
              <Database size={16} />
              <span>Web Space</span>
              {activeSpace === "web" && (
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-1"></span>
              )}
            </div>

            {/* Scholar space */}
            <div
              className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-all duration-300 ${
                activeSpace === "scholar"
                  ? "bg-purple-600/20 border border-purple-500/30 text-purple-400"
                  : "bg-gray-800/50 text-gray-500"
              }`}
            >
              <Database size={16} />
              <span>Scholar Space</span>
              {activeSpace === "scholar" && (
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse ml-1"></span>
              )}
            </div>
          </div>

          {/* Space transition indicator */}
          {isSpaceTransitioning && (
            <div className="ml-4 flex items-center text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-md">
              <div className="animate-spin mr-2">
                <ArrowRight size={16} />
              </div>
              <span>Transitioning storage spaces...</span>
            </div>
          )}
        </div>
      </header>

      {/* Main content area with responsive layout */}
      <div className="flex-grow flex overflow-hidden">
        {/* Chat agent */}
        {(layoutMode === "split" || layoutMode === "chat") && (
          <div
            className={`${
              layoutMode === "split" ? "w-1/2" : "w-full"
            } overflow-hidden transition-all duration-300 ease-in-out`}
          >
            <div className="h-full overflow-hidden">
              <InitialResponseAgent
                setCids={setCids}
                setActiveSpace={setActiveSpace}
              />
            </div>
          </div>
        )}

        {/* Analysis agent */}
        {(layoutMode === "split" || layoutMode === "analysis") && (
          <div
            className={`${
              layoutMode === "split" ? "w-1/2" : "w-full"
            } border-l border-gray-800 overflow-hidden transition-all duration-300 ease-in-out ${
              layoutMode === "split" && activeSpace !== "main"
                ? "bg-gradient-to-r from-gray-900 to-gray-950"
                : ""
            }`}
          >
            <div className="h-full overflow-hidden">
              <AnalysisAgent cids={cids} activeSpace={activeSpace} />
            </div>
          </div>
        )}
      </div>

      {/* Footer with CID information */}
      <footer className="bg-gray-900 border-t border-gray-800 p-3 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <div>
            <span>Storage Status: </span>
            <span className="text-green-400">Connected</span>
            {cids.length > 0 && (
              <span className="ml-2">
                • {cids.length} document{cids.length !== 1 ? "s" : ""} stored
              </span>
            )}
          </div>
          {cids.length > 0 && (
            <div className="flex items-center">
              <span className="mr-2">Latest CID:</span>
              <code className="bg-gray-800 px-2 py-0.5 rounded font-mono truncate max-w-[200px]">
                {cids[cids.length - 1]}
              </code>
              <button
                className="ml-2 text-blue-400 hover:text-blue-300 p-1"
                title="View JSON"
              >
                <Braces size={14} />
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default MultiAgentSystem;
