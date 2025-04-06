import React, { useState, useEffect } from "react";
import { Search, Send } from "lucide-react";
import { ChatGroq } from "@langchain/groq";
import { create } from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { SERPGoogleScholarAPITool } from "@langchain/community/tools/google_scholar";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const InitialResponseAgent = ({ setCids }) => {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [llm, setLlm] = useState(null);
  const [webSearchTool, setWebSearchTool] = useState(null);
  const [scholarTool, setScholarTool] = useState(null);
  const [routerChain, setRouterChain] = useState(null);
  const [storachaClient, setStorachaClient] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");
  const [isConnected, setIsConnected] = useState(false);
  const [currentSpace, setCurrentSpace] = useState(null);

  // Pre-defined space CID for this component
  // const spaceCid = "z6Mkvurg68JS7oUHqNAekMun5P6gFEugAM1PhjMjSjKLrFWp"; // Replace with actual space CID

  // Artifact types for structured storage
  const artifactTypes = {
    INPUT: "input",
    OUTPUT: "output",
    METADATA: "metadata",
    CONVERSATION: "conversation",
  };

  // Initialize the chat model, tools, and Storacha client on component mount
  useEffect(() => {
    // Initialize AI components
    initializeAIComponents();

    // Initialize Storacha client
    initializeStorachaClient();
  }, []);

  // Initialize AI components (LLM and tools)
  const initializeAIComponents = async () => {
    try {
      // Initialize ChatGroq model
      const llmInstance = new ChatGroq({
        apiKey: "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",
        model: "qwen-2.5-32b",
        temperature: 0,
      });
      setLlm(llmInstance);

      // Initialize search tools
      const webSearchToolInstance = new TavilySearchResults({
        maxResults: 2,
        apiKey: "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",
      });
      setWebSearchTool(webSearchToolInstance);

      const scholarToolInstance = new SERPGoogleScholarAPITool({
        apiKey:
          "d033f92170d893fb5f23a0a9753c6d3e2134647cba08c93360828ef375aac527",
      });
      setScholarTool(scholarToolInstance);

      // Router prompt that decides which tool to use
      const routerPrompt = ChatPromptTemplate.fromMessages([
        [
          "system",
          `You are a helpful router assistant that determines which search tool to use for a given query.
          - For current events, real-time information, weather, news, specific websites, or general web searches, respond with "web".
          - For encyclopedic knowledge, historical information, definitions, or concepts, respond with "scholar".
          Respond with just one word: "web" or "scholar".`,
        ],
        ["human", "{query}"],
      ]);

      // Create router chain
      const routerChainInstance = routerPrompt.pipe(llmInstance);
      setRouterChain(routerChainInstance);

      console.log("AI components initialized successfully");
    } catch (error) {
      console.error("Error initializing AI components:", error);
    }
  };

  // const initializeStorachaClient = async () => {
  //   try {
  //     setConnectionStatus("Creating Storacha client...");

  //     // Create client with memory store to persist delegations
  //     const store = new StoreMemory();
  //     const client = await create({ store });
  //     setStorachaClient(client);

  //     // Get the agent DID
  //     const agentDID = client.agent.did();
  //     console.log("Agent DID:", agentDID);

  //     // Login with email
  //     setConnectionStatus("Logging in with email...");
  //     await client.login("avularamswaroop@gmail.com");

  //     setConnectionStatus("Claiming delegations...");
  //     const delegations = await client.capability.access.claim();

  //     console.log("Claimed delegations:", delegations);

  //     const spaces = await client.spaces();
  //     console.log("Available spaces:", spaces);

  //     const targetSpace = spaces[0];

  //     if (targetSpace) {
  //       await client.setCurrentSpace(targetSpace.did());
  //       // storachaClient.setCurrentSpace(targetSpace.did());
  //       setConnectionStatus("Connected to space");
  //       setCurrentSpace(targetSpace.did());
  //       setIsConnected(true);
  //     } else {
  //       throw new Error(
  //         "Space not found after claiming delegations. You may need to register this space with your email first."
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error initializing Storacha client:", error);
  //     setConnectionStatus(`Connection failed: ${error.message}`);
  //   }

  //   // try {
  //   //     // Set the pre-defined space as current
  //   //     await client.setCurrentSpace(spaceCid);
  //   //     setCurrentSpace({ did: () => spaceCid });
  //   //     setConnectionStatus(`Connected to pre-defined space`);
  //   //     setIsConnected(true);
  //   //   } catch (error) {
  //   //     console.error("Error connecting to pre-defined space:", error);
  //   //     setConnectionStatus(`Connection failed: ${error.message}`);
  //   //   }
  //   // } catch (error) {
  //   //   console.error("Error initializing Storacha client:", error);
  //   //   setConnectionStatus(`Connection failed: ${error.message}`);
  //   // }
  // };

  const initializeStorachaClient = async () => {
    try {
      setConnectionStatus("Creating Storacha client...");

      // Create client with memory store to persist delegations
      const store = new StoreMemory();
      const client = await create({ store });

      // Immediately set the client to state to avoid null references
      setStorachaClient(client);

      if (!client) {
        throw new Error("Failed to create Storacha client");
      }

      // Get the agent DID
      const agentDID = client.agent.did();
      console.log("Agent DID:", agentDID);

      // Login with email
      setConnectionStatus("Logging in with email...");
      const account = await client.login("avularamswaroop@gmail.com");

      setConnectionStatus("Claiming delegations...");
      const delegations = await client.capability.access.claim();
      console.log("Claimed delegations:", delegations);

      // Check for available spaces
      const spaces = await client.spaces();
      console.log("Available spaces:", spaces);

      if (spaces && spaces.length > 0) {
        const targetSpace = spaces[0];

        setConnectionStatus(`Connecting to space: ${targetSpace.did()}`);

        try {
          await client.setCurrentSpace(targetSpace.did());
          setCurrentSpace(targetSpace.did());
          setConnectionStatus("Connected to space");
          setIsConnected(true);
        } catch (spaceError) {
          console.error("Error setting current space:", spaceError);
          setConnectionStatus(`Space connection failed: ${spaceError.message}`);
        }
      } else {
        setConnectionStatus("No spaces available. Creating new space...");

        try {
          // Create a new space if none exists
          const space = await client.createSpace(`space-${Date.now()}`, {
            account,
            skipGatewayAuthorization: true,
          });
          await client.setCurrentSpace(space.did());
          setCurrentSpace(space.did());
          setConnectionStatus("Connected to newly created space");
          setIsConnected(true);
        } catch (createError) {
          throw new Error(`Failed to create new space: ${createError.message}`);
        }
      }
    } catch (error) {
      console.error("Error initializing Storacha client:", error);
      setConnectionStatus(`Connection failed: ${error.message}`);
    }
  };

  // Create structured data for storage
  const createStructuredData = (
    userMessage,
    aiResponse,
    toolUsed,
    searchResults
  ) => {
    const timestamp = new Date().toISOString();
    const conversationId = `conv-${Date.now()}`;

    return {
      id: conversationId,
      timestamp: timestamp,
      artifacts: {
        [artifactTypes.INPUT]: {
          message: userMessage,
          timestamp: timestamp,
          user_id: "anonymous",
        },
        [artifactTypes.OUTPUT]: {
          message: aiResponse,
          timestamp: new Date().toISOString(),
          model: "qwen-2.5-32b",
          tool_used: toolUsed || "none",
        },
        [artifactTypes.METADATA]: {
          conversation_id: conversationId,
          platform: "web",
          session_id: `session-${Date.now()}`,
          request_time: timestamp,
          response_time: new Date().toISOString(),
          completion_tokens: aiResponse.length / 4, // Rough estimate
          prompt_tokens: userMessage.length / 4, // Rough estimate
          total_tokens: (aiResponse.length + userMessage.length) / 4,
          search_results: searchResults || null,
        },
        [artifactTypes.CONVERSATION]: [
          { role: "user", content: userMessage },
          { role: "assistant", content: aiResponse },
        ],
      },
    };
  };

  // Upload data to Storacha
  const uploadToStoracha = async (structuredData) => {
    if (!storachaClient || !isConnected) {
      console.error("Storacha client not initialized or not connected");
      return null;
    }

    setIsUploading(true);
    setUploadStatus("Preparing to upload data...");

    try {
      // Create a unique filename with timestamp
      const timestamp = new Date().toISOString();
      const filename = `chat_data_${timestamp}.json`;

      // Create a file object with the structured data
      const dataBlob = new Blob([JSON.stringify(structuredData, null, 2)], {
        type: "application/json",
      });
      const file = new File([dataBlob], filename, {
        type: "application/json",
      });

      setUploadStatus("Uploading data to Storacha...");

      // Upload the file to Storacha
      const uploadResult = await storachaClient.uploadFile(file);

      const resultCid = uploadResult.toString();
      console.log("Data uploaded successfully with CID:", resultCid);
      setUploadStatus("Upload complete!");

      // Update the shared CIDs state to trigger the anaysis component
      setCids((prevCids) => [...prevCids, resultCid]);

      return resultCid;
    } catch (error) {
      console.error("Error uploading data to Storacha:", error);
      setUploadStatus(`Upload failed: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Execute a search using the specified tool
  const executeSearch = async (query, tool) => {
    console.log(
      `Executing search with ${
        tool === webSearchTool ? "web search" : "scholar"
      } tool`
    );

    try {
      // Direct execution of the tool
      const searchResult = await tool.invoke(query);
      console.log("Search result:", searchResult);
      return searchResult;
    } catch (error) {
      console.error(
        `Error executing ${
          tool === webSearchTool ? "web search" : "scholar"
        } tool:`,
        error
      );
      return `Error retrieving information: ${error.message}`;
    }
  };

  // Handle sending a message with multi-agent routing
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isConnected) {
      if (!isConnected) {
        alert("Please wait until connection to Storacha is established");
      }
      return;
    }

    if (!llm || !webSearchTool || !scholarTool || !routerChain) {
      alert(
        "AI components are still initializing. Please try again in a moment."
      );
      return;
    }

    setIsLoading(true);

    try {
      // First, determine if we should use a search tool or just the LLM
      console.log("Determining best agent for query:", inputMessage);

      // Route the message to determine which tool to use
      const routerDecision = await routerChain.invoke({ query: inputMessage });
      console.log("Router decision:", routerDecision.content.toLowerCase());

      let response;
      let toolUsed = "none";
      let searchResults = null;
      const toolDecision = routerDecision.content.toLowerCase();

      // Execute the appropriate tool based on the router decision
      if (toolDecision.includes("web")) {
        console.log("Using web search tool");
        toolUsed = "web_search";
        searchResults = await executeSearch(inputMessage, webSearchTool);

        // Now combine the search results with the question for the LLM
        const prompt = `Question: ${inputMessage}\n\nSearch Results: ${JSON.stringify(
          searchResults
        )}\n\nPlease answer the question based on the search results above.`;
        const aiResponse = await llm.invoke(prompt);
        response = aiResponse.content;
      } else if (toolDecision.includes("scholar")) {
        console.log("Using scholar tool");
        toolUsed = "scholar_search";
        searchResults = await executeSearch(inputMessage, scholarTool);

        // Combine the scholar results with the question
        const prompt = `Question: ${inputMessage}\n\nScholar Results: ${JSON.stringify(
          searchResults
        )}\n\nPlease answer the question based on the scholarly information above.`;
        const aiResponse = await llm.invoke(prompt);
        response = aiResponse.content;
      } else {
        // Fallback to just using the LLM directly
        console.log("Using LLM directly");
        toolUsed = "llm_only";
        const aiResponse = await llm.invoke(inputMessage);
        response = aiResponse.content;
      }

      console.log("AI response:", response);

      // Create structured data for storage
      const structuredData = createStructuredData(
        inputMessage,
        response,
        toolUsed,
        searchResults
      );

      // Upload the structured data
      if (isConnected) {
        await uploadToStoracha(structuredData);
      } else {
        console.warn("Not connected to Storacha, skipping upload");
      }

      // Clear the input field
      setInputMessage("");
    } catch (error) {
      console.error("Error in chat interaction:", error);
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-black text-white p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Initial Response Agent</h2>

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
      </div>

      {/* Processing indicator */}
      {isLoading && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
            <span className="text-sm text-gray-300">
              Processing your query...
            </span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center space-x-2">
        <div className="flex-grow relative">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" &&
              !isLoading &&
              isConnected &&
              handleSendMessage()
            }
            placeholder={
              !isConnected
                ? "Connecting..."
                : isLoading
                ? "Processing..."
                : "Ask anything"
            }
            disabled={isLoading || !isConnected}
            className={`w-full bg-gray-800 text-white p-2 pl-4 pr-10 rounded-full focus:outline-none ${
              isLoading || !isConnected ? "opacity-50" : ""
            }`}
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading || !isConnected}
          className={`${
            !inputMessage.trim() || isLoading || !isConnected
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } p-2 rounded-full`}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default InitialResponseAgent;
