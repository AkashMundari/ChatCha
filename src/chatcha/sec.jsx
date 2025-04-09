import React, { useState, useEffect } from "react";
import { ChatGroq } from "@langchain/groq";
import { create } from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
// import { Delegation } from "@ucanto/core/delegation";
import { CarReader } from "@ipld/car";
import * as Delegation from "@ucanto/core/delegation";
// import { CAR } from "@ucanto/transport";
const AnalysisAgent = ({ cids }) => {
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
  // Pre-defined space CID for this component
  // const spaceCid = "z6MkwJVJeZ9WMRUmQaT9rBxHVxvQ8RCQGAgvrRJnY5swMb5f"; // Replace with actual space CID for the analysis agent

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
      await client.login("avularamswaroop@gmail.com");

      // Use the pre-defined space
      setConnectionStatus(`Connecting to pre-defined space...`);
      setConnectionStatus(`Connecting to pre-defined space...`);
      // Then claim the delegations
      setConnectionStatus("Claiming delegations...");
      const delegations = await client.capability.access.claim();

      console.log("Claimed delegations:", delegations);

      const spaces = await client.spaces();
      console.log("Available spaces:", spaces);

      const targetSpace = spaces[1];

      if (targetSpace) {
        await client.setCurrentSpace(targetSpace.did());
        setConnectionStatus("Connected to space");
        setCurrentSpace(targetSpace.did());
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

    //   try {
    //     // Set the pre-defined space as current
    //     await client.setCurrentSpace(spaceCid);
    //     setConnectionStatus(`Connected to pre-defined space`);
    //     setIsConnected(true);
    //   } catch (error) {
    //     console.error("Error connecting to pre-defined space:", error);
    //     setConnectionStatus(`Connection failed: ${error.message}`);
    //   }
    // } catch (error) {
    //   console.error("Error initializing Storacha client:", error);
    //   setConnectionStatus(`Connection failed: ${error.message}`);
    // }
  };

  //upper one you are lookinh for

  // const initializeStorachaClient = async () => {
  //   try {
  //     setConnectionStatus("Creating client...");
  //     const store = new StoreMemory();
  //     const client = await create({ store });
  //     setStorachaClient(client);

  //     const agentDID = client.agent.did();
  //     console.log("Agent DID:", agentDID);

  //     // Get delegation from backend instead of email login
  //     setConnectionStatus("Requesting delegation...");
  //     const response = await fetch(
  //       `http://localhost:3001/api/delegation/initial-response/${agentDID}`
  //     );

  //     if (!response.ok) {
  //       throw new Error(`Failed to get delegation: ${response.status}`);
  //     }

  //     const delegationBytes = await response.arrayBuffer();

  //     // Deserialize delegation using CarReader and importDAG
  //     setConnectionStatus("Processing delegation...");
  //     const blocks = [];
  //     const reader = await CarReader.fromBytes(new Uint8Array(delegationBytes));
  //     for await (const block of reader.blocks()) {
  //       blocks.push(block);
  //     }
  //     const delegation = await Delegation.importDAG(blocks);

  //     // Add space using delegation
  //     setConnectionStatus("Adding space...");
  //     const space = await client.addSpace(delegation);
  //     await client.setCurrentSpace(space.did());

  //     setCurrentSpace(space.did());
  //     setConnectionStatus("Connected to space");
  //     setIsConnected(true);
  //   } catch (error) {
  //     console.error("Error:", error);
  //     setConnectionStatus(`Connection failed: ${error.message}`);
  //   }
  // };
  // Process the latest CID from the initial agent
  // const processLatestCid = async (cid) => {
  // if (!cid || isProcessing) return;

  // setIsProcessing(true);
  // setProcessingStatus(`Analyzing response from CID: ${cid}`);

  // try {
  //   // Fetch the data from the CID
  //   const data = await fetchDataFromCid(cid);

  //   if (!data) {
  //     throw new Error("Failed to fetch data from CID");
  //   }

  //   // Extract the original response
  //   const originalInput = data.artifacts[artifactTypes.INPUT].message;
  //   const originalOutput = data.
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
      const analysisPrompt = `
        I need you to analyze and enhance the following AI response to a user query.
        
        USER QUERY: ${originalInput}
        
        ORIGINAL AI RESPONSE: ${originalOutput}
        
        Please provide:
        1. A more concise and clear version of this response
        2. Add any missing important information
        3. Ensure the tone is helpful and conversational
        4. Structure the information logically
        
        Your enhanced response:
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

  return (
    <div className="flex flex-col bg-gray-900 text-white p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Analysis Agent</h2>

      {/* Status indicators */}
      <div className="mb-4">
        <p
          className={`text-sm ${
            isConnected ? "text-green-400" : "text-yellow-400"
          }`}
        >
          {connectionStatus}
        </p>
        {isUploading && <p className="text-sm text-blue-400">{uploadStatus}</p>}
        {isProcessing && (
          <p className="text-sm text-purple-400">{processingStatus}</p>
        )}
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
            <span className="text-sm text-gray-300">Analyzing response...</span>
          </div>
        </div>
      )}

      {/* Analysis Result Display */}
      {analysisResult && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <div className="mb-2 text-sm text-gray-400">
            <span className="font-semibold">Original Query:</span>{" "}
            {analysisResult.originalQuery}
          </div>
          <div className="p-3 bg-gray-700 rounded border-l-4 border-green-500">
            {analysisResult.enhancedResponse}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Enhanced at{" "}
            {new Date(analysisResult.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* CID Monitor */}
      <div className="mt-4 p-2 bg-gray-800 rounded">
        <h3 className="text-sm font-semibold mb-1">CID Monitor</h3>
        {cids.length > 0 ? (
          <div className="text-xs text-gray-400">
            Latest CID: {cids[cids.length - 1]}
          </div>
        ) : (
          <div className="text-xs text-gray-500">
            Waiting for new responses...
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisAgent;
