import React, { useState, useEffect } from "react";
import { ChatGroq } from "@langchain/groq";
import { create } from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import { Link } from "lucide-react";

const AnalysisAgent = ({ cids, activeSpace }) => {
  const [llm, setLlm] = useState(null);
  const [storachaClient, setStorachaClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [currentSpace, setCurrentSpace] = useState(null);

  // Artifact types for structured storage
  const artifactTypes = {
    INPUT: "input",
    OUTPUT: "output",
    METADATA: "metadata",
    CONVERSATION: "conversation",
    ANALYSIS: "analysis", // Additional type for the analysis component
  };

  // Initialize the LLM and Storacha client
  useEffect(() => {
    initializeLLM();
    initializeStorachaClient();
  }, []);

  // Process new CIDs when they arrive
  useEffect(() => {
    if (cids.length > 0 && isConnected && llm) {
      const latestCid = cids[cids.length - 1];
      processLatestCid(latestCid);
    }
  }, [cids, isConnected, llm]);

  // Initialize the LLM
  const initializeLLM = async () => {
    try {
      const llmInstance = new ChatGroq({
        apiKey: "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",
        model: "qwen-2.5-32b",
        temperature: 0,
      });
      setLlm(llmInstance);
      console.log("LLM initialized successfully");
    } catch (error) {
      console.error("Error initializing LLM:", error);
    }
  };

  // Initialize Storacha client
  const initializeStorachaClient = async () => {
    try {
      setConnectionStatus("Creating Storacha client...");

      // Create client with memory store to persist delegations
      const store = new StoreMemory();
      const client = await create({ store });
      setStorachaClient(client);

      // Get the agent DID
      const agentDID = client.agent.did();
      console.log("Agent DID:", agentDID);

      // Login with email
      setConnectionStatus("Logging in with email...");
      const account = await client.login("avularamswaroop@gmail.com");

      // Use the pre-defined space
      setConnectionStatus(`Connecting to pre-defined space...`);
      // setConnectionStatus(`Connecting to pre-defined space...`);
      // Then claim the delegations

      // const spaces = await client.spaces();
      // console.log("Available spaces:", spaces);

      const targetSpace = await client.createSpace(
        `Analyse-Space-${new Date().toISOString()}`,
        {
          account,
          skipGatewayAuthorization: true,
        }
      );

      // const targetSpace = spaces[1];
      // setConnectionStatus("Claiming delegations...");
      // const delegations = await client.capability.access.claim();

      // console.log("Claimed delegations:", delegations);

      if (targetSpace) {
        setConnectionStatus("Claiming delegations...");
        const delegations = await client.capability.access.claim();
        console.log("Claimed delegations:", delegations);
        await client.setCurrentSpace(targetSpace.did());
        setConnectionStatus("Connected to space");
        setCurrentSpace(targetSpace.did());

        setConnectionStatus(`Connected to ${targetSpace.did()}`);
        console.log(`analyser space created : ${targetSpace.did()}`);
        const delegation = await client.capability.access.claim();
        setConnectionStatus("Claiming delegations...");
        console.log("Claimed delegations:", delegation);
        setIsConnected(true);
      } else {
        throw new Error(
          "Space not found after claiming delegations. You may need to register this space with your email first."
        );
      }
    } catch (error) {
      console.error("Error initializing Storacha client:", error);
      setConnectionStatus(`Connection failed: ${error.message}`);
    }
  };

  // Process the latest CID from the initial agent
  const processLatestCid = async (cid) => {
    if (!cid || isProcessing) return;

    setIsProcessing(true);
    setProcessingStatus(`Analyzing response from CID: ${cid}`);

    try {
      // Fetch the data from the CID
      const data = await fetchDataFromCid(cid);

      if (!data) {
        throw new Error("Failed to fetch data from CID");
      }

      // Extract the original response
      const originalInput = data.artifacts[artifactTypes.INPUT].message;
      const originalOutput = data.artifacts[artifactTypes.OUTPUT].message;
      const originalMetadata = data.artifacts[artifactTypes.METADATA];

      // Create a prompt for the analysis
      //       const analysisPrompt = `
      // You are an expert AI Response Analyzer. Examine the following conversation and provide a structured, enhanced response.

      // USER QUERY: ${originalInput}

      // ORIGINAL AI RESPONSE: ${originalOutput}

      // Analyze this exchange and create an improved response that:
      // 1. Begins with a concise summary of the key points (2-3 sentences maximum)
      // 2. Organizes information using clear headings (## for main sections, ### for subsections)
      // 3. Prioritizes the most relevant information first
      // 4. Includes any critical missing information or context
      // 5. Uses bullet points for lists and easy scanning
      // 6. Maintains a helpful, conversational tone
      // 7. Ends with a clear next step or actionable conclusion

      // Your analysis should be comprehensive yet efficient, eliminating redundancy while preserving all valuable insights.

      // FORMAT YOUR RESPONSE USING THIS STRUCTURE:
      // ## Summary
      // [Concise overview]

      // ## Key Points
      // [Main insights organized by importance]

      // ## Additional Context
      // [Any missing information]

      // ## Actionable Takeaways
      // [What the user should do with this information]
      // `;

      // Replace your existing analysisPrompt with this improved version:
      const analysisPrompt = `
You are an expert AI Response Analyzer. Examine the following conversation and provide a structured, enhanced response.

USER QUERY: ${originalInput}

ORIGINAL AI RESPONSE: ${originalOutput}

Analyze this exchange and create an improved response that:
1. Begins with a concise summary of the key points (2-3 sentences maximum)
2. Organizes information using clear headings
3. Prioritizes the most relevant information first
4. Includes any critical missing information or context
5. Uses bullet points for lists and easy scanning
6. Maintains a helpful, conversational tone
7. Ends with a clear next step or actionable conclusion
8. Uses proper line breaks between sections and points for readability
IMPORTANT GUIDELINES:
- If the original query or response is incomplete or unclear, focus on extracting whatever value is possible
- Even with limited context, provide the most helpful structured response you can
- Always maintain all four required sections, even if some are brief
- Be specific and actionable rather than generic
- Use proper markdown formatting for all sections and lists

Your analysis should be comprehensive yet efficient, eliminating redundancy while preserving all valuable insights.

FORMAT YOUR RESPONSE USING THIS STRUCTURE (DO NOT MODIFY THESE SECTION HEADERS):
1. Summary
[Concise overview in 2-3 sentences maximum]

2. Key Points
[Main insights organized by importance, using bullet points]

3. Additional Context
[Any missing information or relevant context the original response lacked]

4. Actionable Takeaways
[Specific, clear actions the user should take with this information]
`;

      // Generate the analysis using the LLM
      setProcessingStatus("Generating enhanced response...");
      const analysisResponse = await llm.invoke(analysisPrompt);
      const enhancedResponse = analysisResponse.content;

      // Create structured data with the analysis
      const analysisData = createAnalysisData(
        originalInput,
        originalOutput,
        enhancedResponse,
        originalMetadata,
        cid
      );

      // Upload the analysis to Storacha
      setProcessingStatus("Storing enhanced response...");
      await uploadAnalysisToStoracha(analysisData);

      // Set the analysis result for display
      setAnalysisResult({
        originalQuery: originalInput,
        enhancedResponse: enhancedResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error processing CID:", error);
      setProcessingStatus(`Analysis failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch data from a CID
  const fetchDataFromCid = async (cid) => {
    try {
      const gatewayUrl = `https://${cid}.ipfs.w3s.link`;
      console.log("Fetching from:", gatewayUrl);

      const response = await fetch(gatewayUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch data: ${response.status} ${response.statusText}`
        );
      }

      const retrievedData = await response.json();
      console.log("Retrieved Data:", retrievedData);

      return retrievedData;
    } catch (error) {
      console.error("Error fetching data from CID:", error);
      return null;
    }
  };

  // Create structured data for the analysis
  const createAnalysisData = (
    originalInput,
    originalOutput,
    enhancedOutput,
    originalMetadata,
    originalCid
  ) => {
    const timestamp = new Date().toISOString();
    const analysisId = `analysis-${Date.now()}`;

    return {
      id: analysisId,
      timestamp: timestamp,
      artifacts: {
        [artifactTypes.INPUT]: {
          message: originalInput,
          timestamp: originalMetadata.request_time,
          user_id: "anonymous",
        },
        [artifactTypes.OUTPUT]: {
          message: enhancedOutput,
          timestamp: timestamp,
          model: "qwen-2.5-32b",
          tool_used: "analysis",
        },
        [artifactTypes.METADATA]: {
          analysis_id: analysisId,
          original_cid: originalCid,
          platform: "web",
          session_id: originalMetadata.session_id,
          request_time: originalMetadata.request_time,
          response_time: timestamp,
          completion_tokens: enhancedOutput.length / 4, // Rough estimate
          prompt_tokens: originalInput.length / 4, // Rough estimate
          total_tokens: (enhancedOutput.length + originalInput.length) / 4,
        },
        [artifactTypes.ANALYSIS]: {
          original_output: originalOutput,
          enhanced_output: enhancedOutput,
          analysis_timestamp: timestamp,
        },
        [artifactTypes.CONVERSATION]: [
          { role: "user", content: originalInput },
          { role: "assistant", content: enhancedOutput },
        ],
      },
    };
  };

  // Upload analysis data to Storacha
  const uploadAnalysisToStoracha = async (analysisData) => {
    if (!storachaClient || !isConnected) {
      console.error("Storacha client not initialized or not connected");
      return null;
    }

    setIsUploading(true);
    setUploadStatus("Preparing to upload analysis...");

    try {
      // Create a unique filename with timestamp
      const timestamp = new Date().toISOString();
      const filename = `analysis_data_${timestamp}.json`;

      // Create a file object with the structured data
      const dataBlob = new Blob([JSON.stringify(analysisData, null, 2)], {
        type: "application/json",
      });
      const file = new File([dataBlob], filename, {
        type: "application/json",
      });

      setUploadStatus("Uploading analysis to Storacha...");

      // Upload the file to Storacha
      const uploadResult = await storachaClient.uploadFile(file);

      const resultCid = uploadResult.toString();
      console.log("Analysis uploaded successfully with CID:", resultCid);
      setUploadStatus("Analysis upload complete!");

      return resultCid;
    } catch (error) {
      console.error("Error uploading analysis to Storacha:", error);
      setUploadStatus(`Analysis upload failed: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  //   return (
  //     <div className="flex flex-col bg-gray-900 text-white p-4 rounded-lg">
  //       <h2 className="text-xl font-bold mb-4">Analysis Agent</h2>

  //       {/* Status indicators */}
  //       <div className="mb-4">
  //         <p
  //           className={`text-sm ${
  //             isConnected ? "text-green-400" : "text-yellow-400"
  //           }`}
  //         >
  //           {connectionStatus}
  //         </p>
  //         {isUploading && <p className="text-sm text-blue-400">{uploadStatus}</p>}
  //         {isProcessing && (
  //           <p className="text-sm text-purple-400">{processingStatus}</p>
  //         )}
  //       </div>

  //       {/* Processing indicator */}
  //       {isProcessing && (
  //         <div className="mb-4 p-3 bg-gray-800 rounded-lg">
  //           <div className="flex items-center space-x-2">
  //             <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
  //             <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
  //             <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
  //             <span className="text-sm text-gray-300">Analyzing response...</span>
  //           </div>
  //         </div>
  //       )}

  //       {/* Analysis Result Display */}
  //       {analysisResult && (
  //         <div className="mt-4 p-4 bg-gray-800 rounded-lg">
  //           <div className="mb-2 text-sm text-gray-400">
  //             <span className="font-semibold">Original Query:</span>{" "}
  //             {analysisResult.originalQuery}
  //           </div>
  //           <div className="p-3 bg-gray-700 rounded border-l-4 border-green-500">
  //             {analysisResult.enhancedResponse}
  //           </div>
  //           <div className="mt-2 text-xs text-gray-500">
  //             Enhanced at{" "}
  //             {new Date(analysisResult.timestamp).toLocaleTimeString()}
  //           </div>
  //         </div>
  //       )}

  //       {/* CID Monitor */}
  //       <div className="mt-4 p-2 bg-gray-800 rounded">
  //         <h3 className="text-sm font-semibold mb-1">CID Monitor</h3>
  //         {cids.length > 0 ? (
  //           <div className="text-xs text-gray-400">
  //             Latest CID: {cids[cids.length - 1]}
  //           </div>
  //         ) : (
  //           <div className="text-xs text-gray-500">
  //             Waiting for new responses...
  //           </div>
  //         )}
  //       </div>
  //     </div>
  //   );
  // };

  // export default AnalysisAgent;

  return (
    <div
      className={`flex flex-col h-full text-white overflow-hidden ${
        activeSpace === "web"
          ? "bg-gradient-to-br from-gray-900 to-gray-950/95 border-l-green-800/20"
          : activeSpace === "scholar"
          ? "bg-gradient-to-br from-gray-900 to-gray-950/95 border-l-purple-800/20"
          : "bg-gray-950"
      }`}
    >
      <div
        className={`p-4 border-b border-gray-800 ${
          activeSpace === "web"
            ? "bg-gradient-to-r from-green-900/30 to-gray-900"
            : activeSpace === "scholar"
            ? "bg-gradient-to-r from-purple-900/30 to-gray-900"
            : "bg-gradient-to-r from-gray-900 to-gray-950"
        }`}
      >
        <h2
          className={`text-xl font-bold bg-clip-text text-transparent ${
            activeSpace === "web"
              ? "bg-gradient-to-r from-green-400 to-emerald-500"
              : activeSpace === "scholar"
              ? "bg-gradient-to-r from-purple-400 to-pink-500"
              : "bg-gradient-to-r from-purple-400 to-pink-400"
          } flex items-center`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
            <line x1="2" y1="20" x2="2" y2="20"></line>
          </svg>
          Analysis Agent
          {activeSpace !== "main" && (
            <span
              className={`ml-2 text-sm px-2 py-0.5 rounded ${
                activeSpace === "web"
                  ? "bg-green-900/50 text-green-400"
                  : "bg-purple-900/50 text-purple-400"
              }`}
            >
              {activeSpace === "web" ? "Web Mode" : "Scholar Mode"}
            </span>
          )}
        </h2>

        {/* Status indicators with improved styling */}
        <div className="mt-2">
          <p
            className={`text-xs flex items-center ${
              isConnected ? "text-green-400" : "text-yellow-400"
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full mr-1 ${
                isConnected ? "bg-green-400" : "bg-yellow-400"
              }`}
            ></span>
            {connectionStatus}
          </p>
          {isUploading && (
            <p className="text-xs text-blue-400 flex items-center mt-1">
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-1"></span>
              {uploadStatus}
            </p>
          )}
          {isProcessing && (
            <p className="text-xs text-purple-400 flex items-center mt-1">
              <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-pulse mr-1"></span>
              {processingStatus}
            </p>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent p-4">
        {/* Processing indicator with improved animation */}
        {isProcessing && (
          <div className="mb-4 p-4 bg-gray-800/50 backdrop-blur rounded-lg border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="relative w-8 h-8">
                <div
                  className={`absolute inset-0 rounded-full border-t-2 ${
                    activeSpace === "web"
                      ? "border-green-500"
                      : activeSpace === "scholar"
                      ? "border-purple-500"
                      : "border-purple-500"
                  } animate-spin`}
                ></div>
                <div className="absolute inset-2 rounded-full bg-gray-800"></div>
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    activeSpace === "web"
                      ? "text-green-400"
                      : activeSpace === "scholar"
                      ? "text-purple-400"
                      : "text-purple-400"
                  }`}
                >
                  Analyzing{" "}
                  {activeSpace === "web"
                    ? "web search data"
                    : activeSpace === "scholar"
                    ? "scholarly content"
                    : "conversation"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {processingStatus}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Result Display with better visual hierarchy */}
        {analysisResult && (
          <div className="mb-4 overflow-hidden bg-gradient-to-b from-gray-800 to-gray-850 rounded-lg border border-gray-700 shadow-lg animate-fade-in">
            <div
              className={`px-4 py-3 flex justify-between items-center ${
                activeSpace === "web"
                  ? "bg-gray-800 border-b border-green-800/30"
                  : activeSpace === "scholar"
                  ? "bg-gray-800 border-b border-purple-800/30"
                  : "bg-gray-800 border-b border-gray-700"
              }`}
            >
              <div className="text-sm font-medium flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1.5"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Analysis Results
              </div>
              <div className="text-xs text-gray-400">
                {new Date(analysisResult.timestamp).toLocaleTimeString()}
              </div>
            </div>

            <div className="p-4">
              {/* Original query */}
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">Original Query</div>
                <div className="px-3 py-2 bg-gray-900 rounded-md text-gray-300 text-sm">
                  {analysisResult.originalQuery}
                </div>
              </div>

              {/* Enhanced response */}
              <div>
                <div className="text-xs text-gray-400 mb-1">
                  Enhanced Analysis
                </div>
                <div
                  className={`p-3 bg-gray-900 rounded-md border-l-4 text-white ${
                    activeSpace === "web"
                      ? "border-green-500"
                      : activeSpace === "scholar"
                      ? "border-purple-500"
                      : "border-blue-500"
                  }`}
                >
                  {analysisResult.enhancedResponse}
                </div>
              </div>

              {/* Key insights section */}
              {analysisResult.keyInsights && (
                <div className="mt-3">
                  <div className="text-xs text-gray-400 mb-1">Key Insights</div>
                  <div className="grid grid-cols-1 gap-2">
                    {analysisResult.keyInsights.map((insight, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 bg-gray-900 rounded-md text-sm flex items-start"
                      >
                        <span
                          className={` w-4 h-4 rounded-full text-white text-xs flex items-center justify-center mt-0.5 mr-2 ${
                            activeSpace === "web"
                              ? "bg-green-600"
                              : activeSpace === "scholar"
                              ? "bg-purple-600"
                              : "bg-blue-600"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CID Monitor with improved styling */}
        <div className="bg-gray-800/50 backdrop-blur rounded-lg border border-gray-700 overflow-hidden">
          <div
            className={`px-4 py-3 border-b border-gray-700 ${
              activeSpace === "web"
                ? "bg-green-900/20"
                : activeSpace === "scholar"
                ? "bg-purple-900/20"
                : "bg-gray-800"
            }`}
          >
            <h3 className="text-sm font-medium flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1.5"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 2v5"></path>
                <path d="M8 2v5"></path>
                <path d="M12 18v.01"></path>
              </svg>
              CID Monitor •{" "}
              {activeSpace.charAt(0).toUpperCase() + activeSpace.slice(1)} Space
            </h3>
          </div>

          <div className="p-4">
            {cids.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 mb-1">
                  Content ID (CID's)
                </div>
                <div className="px-3 py-2 bg-gray-900 rounded-md overflow-hidden">
                  <div
                    className={`font-mono text-xs truncate ${
                      activeSpace === "web"
                        ? "text-green-400"
                        : activeSpace === "scholar"
                        ? "text-purple-400"
                        : "text-blue-400"
                    }`}
                  >
                    <a
                      href={`https://${cids[cids.length - 1]}.ipfs.w3s.link/`}
                      target="_blank"
                    >
                      {cids[cids.length - 1]}
                    </a>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Total CIDs tracked: {cids.length}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500 mb-2"
                >
                  <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21"></path>
                  <path d="M16 16v-3a2 2 0 0 0-4 0v3"></path>
                </svg>
                <p className="text-sm text-gray-500">
                  Waiting for new content...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisAgent;
