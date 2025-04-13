import React, { useState, useEffect } from "react";
import { Search, Send } from "lucide-react";
import { ChatGroq } from "@langchain/groq";
import { create } from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { SERPGoogleScholarAPITool } from "@langchain/community/tools/google_scholar";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Mic, PlusCircle, Globe, Lightbulb } from "lucide-react";
const InitialResponseAgent = ({ setCids, setActiveSpace }) => {
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
  const [webSpace, setWebSpace] = useState(null);
  const [scholarSpace, setScholarSpace] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  // Artifact types for structured storage
  const artifactTypes = {
    INPUT: "input",
    OUTPUT: "output",
    METADATA: "metadata",
    CONVERSATION: "conversation",
  };

  // Initialize the chat model, tools, and Storacha client
  useEffect(() => {
    initializeAIComponents();
    initializeStorachaClient();
  }, []);
  useEffect(() => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatMessages]);

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
          "349e84de0f1ca9b3ec49be83b9c4fe7b6420ec3fe40e2f6394a585cc0d896669",
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

  const initializeStorachaClient = async () => {
    try {
      setConnectionStatus("Creating Storacha client...");
      // Create client with memory store to persist delegations
      const store = new StoreMemory();
      const client = await create({ store });
      setStorachaClient(client);
      if (!client) {
        throw new Error("Failed to create Storacha client");
      }
      const agentDID = client.agent.did();
      console.log("Agent DID:", agentDID);

      // Login with email
      setConnectionStatus("Logging in with email...");
      const account = await client.login("avularamswaroop@gmail.com");

      // Create space names with unique timestamps
      const timestamp = Date.now();
      const uniqueSpaceName = `chat-space-${timestamp}`;
      const uniqueWebSpaceName = `chat-web-space-${timestamp}`;
      const uniqueScholarSpaceName = `chat-scholar-space-${timestamp}`;

      setConnectionStatus("Creating new spaces...");

      try {
        // Create all three spaces
        const mainSpace = await client.createSpace(uniqueSpaceName, {
          account,
          skipGatewayAuthorization: true,
        });
        console.log("Main space created:", mainSpace.did());

        const newWebSpace = await client.createSpace(uniqueWebSpaceName, {
          account,
          skipGatewayAuthorization: true,
        });
        console.log("Web space created:", newWebSpace.did());

        const newScholarSpace = await client.createSpace(
          uniqueScholarSpaceName,
          {
            account,
            skipGatewayAuthorization: true,
          }
        );
        console.log("Scholar space created:", newScholarSpace.did());

        // Store all spaces in state
        setCurrentSpace(mainSpace);
        setWebSpace(newWebSpace);
        setScholarSpace(newScholarSpace);
        const delegations = await client.capability.access.claim();
        setConnectionStatus("Claiming delegations...");
        console.log("Claimed delegations:", delegations);

        await client.setCurrentSpace(mainSpace.did());
        console.log("current space is main");
        const delegation = await client.capability.access.claim();
        setConnectionStatus("Claiming delegations...");
        console.log("Claimed delegations:", delegation);
        setConnectionStatus("Connected to new spaces");
        setIsConnected(true);
      } catch (createError) {
        console.error("Error creating spaces:", createError);
      }
    } catch (error) {
      console.error("Error initializing Storacha client:", error);
      setConnectionStatus(`Connection failed: ${error.message}`);
    }
  };

  // Switch to a specific space and return success status
  const switchToSpace = async (space) => {
    if (!storachaClient || !space) return false;

    try {
      await storachaClient.capability.access.claim();
      await storachaClient.setCurrentSpace(space.did());
      console.log(`Switched to space: ${space.did()}`);
      return true;
    } catch (error) {
      console.error("Error switching space:", error);
      return false;
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

  // Upload data to Storacha using specific spaces based on the tool used
  const uploadToStoracha = async (structuredData, toolUsed) => {
    if (!storachaClient || !isConnected) {
      console.error("Storacha client not initialized or not connected");
      return null;
    }

    setIsUploading(true);
    setUploadStatus("Preparing to upload data...");

    try {
      const timestamp = new Date().toISOString();
      const filename = `chat_data_${timestamp}.json`;

      // Create a file object with the structured data
      const dataBlob = new Blob([JSON.stringify(structuredData, null, 2)], {
        type: "application/json",
      });
      const file = new File([dataBlob], filename, {
        type: "application/json",
      });

      // Array to track all CIDs from uploads
      const allCids = [];

      //upload to main space
      if (currentSpace) {
        setUploadStatus("Uploading to main space...");
        await switchToSpace(currentSpace);
        const mainResult = await storachaClient.uploadFile(file);
        console.log(
          "Data uploaded to main space with CID:",
          mainResult.toString()
        );
        allCids.push(mainResult.toString());

        setCids((prevCids) => [...prevCids, mainResult.toString()]);
      }

      // Upload to additional space based on tool used
      if (toolUsed === "web_search" && webSpace) {
        setUploadStatus("Uploading to web space...");
        await switchToSpace(webSpace);
        const webResult = await storachaClient.uploadFile(file);
        console.log(
          "Data uploaded to web space with CID:",
          webResult.toString()
        );
        allCids.push(webResult.toString());
      } else if (toolUsed === "scholar_search" && scholarSpace) {
        setUploadStatus("Uploading to scholar space...");
        await switchToSpace(scholarSpace);
        const scholarResult = await storachaClient.uploadFile(file);
        console.log(
          "Data uploaded to scholar space with CID:",
          scholarResult.toString()
        );
        allCids.push(scholarResult.toString());
      }

      // Switch back to main space
      if (currentSpace) {
        await switchToSpace(currentSpace);
      }

      setUploadStatus("Upload complete to all relevant spaces!");

      return allCids;
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

    const userMessage = inputMessage;
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setInputMessage("");
    setIsLoading(true);
    try {
      // determine if we should use a search tool or just the LLM
      console.log("Determining best agent for query:", userMessage);
      setChatMessages((prev) => [
        ...prev,
        { role: "thinking", content: "Thinking..." },
      ]);

      // Route the message to determine which tool to use
      const routerDecision = await routerChain.invoke({ query: userMessage });
      console.log("Router decision:", routerDecision.content.toLowerCase());

      let response;
      let toolUsed = "none";
      let searchResults = null;
      const toolDecision = routerDecision.content.toLowerCase();

      // Update thinking message to show tool selection
      setChatMessages((prev) => {
        const newMessages = [...prev];
        const thinkingIndex = newMessages.findIndex(
          (msg) => msg.role === "thinking"
        );
        if (thinkingIndex !== -1) {
          newMessages[thinkingIndex] = {
            role: "thinking",
            content: `Using ${
              toolDecision.includes("web")
                ? "web search"
                : toolDecision.includes("scholar")
                ? "scholar search"
                : "just AI"
            } tool...`,
          };
        }
        return newMessages;
      });

      // Execute the appropriate tool based on the router decision
      if (toolDecision.includes("web")) {
        console.log("Using web search tool");
        toolUsed = "web_search";
        setActiveSpace && setActiveSpace("web");
        searchResults = await executeSearch(userMessage, webSearchTool);

        // Now combine the search results with the question for the LLM
        const prompt = `Question: ${userMessage}\n\nSearch Results: ${JSON.stringify(
          searchResults
        )}\n\nPlease answer the question based on the search results above.`;

        // Update thinking message
        setChatMessages((prev) => {
          const newMessages = [...prev];
          const thinkingIndex = newMessages.findIndex(
            (msg) => msg.role === "thinking"
          );
          if (thinkingIndex !== -1) {
            newMessages[thinkingIndex] = {
              role: "thinking",
              content: "Generating response based on web search results...",
            };
          }
          return newMessages;
        });

        const aiResponse = await llm.invoke(prompt);
        response = aiResponse.content;
      } else if (toolDecision.includes("scholar")) {
        console.log("Using scholar tool");
        toolUsed = "scholar_search";
        setActiveSpace && setActiveSpace("scholar");
        searchResults = await executeSearch(userMessage, scholarTool);

        // Combine the scholar results with the question
        const prompt = `Question: ${userMessage}\n\nScholar Results: ${JSON.stringify(
          searchResults
        )}\n\nPlease answer the question based on the scholarly information above.`;

        // Update thinking message
        setChatMessages((prev) => {
          const newMessages = [...prev];
          const thinkingIndex = newMessages.findIndex(
            (msg) => msg.role === "thinking"
          );
          if (thinkingIndex !== -1) {
            newMessages[thinkingIndex] = {
              role: "thinking",
              content: "Generating response based on scholarly research...",
            };
          }
          return newMessages;
        });

        const aiResponse = await llm.invoke(prompt);
        response = aiResponse.content;
      } else {
        // Fallback to just using the LLM directly
        console.log("Using LLM directly");
        toolUsed = "llm_only";

        // Update thinking message
        setChatMessages((prev) => {
          const newMessages = [...prev];
          const thinkingIndex = newMessages.findIndex(
            (msg) => msg.role === "thinking"
          );
          if (thinkingIndex !== -1) {
            newMessages[thinkingIndex] = {
              role: "thinking",
              content: "Generating response...",
            };
          }
          return newMessages;
        });

        const aiResponse = await llm.invoke(userMessage);
        response = aiResponse.content;
      }

      console.log("AI response:", response);

      // Remove thinking message and add AI response
      setChatMessages((prev) => {
        const newMessages = [...prev];
        const thinkingIndex = newMessages.findIndex(
          (msg) => msg.role === "thinking"
        );
        if (thinkingIndex !== -1) {
          newMessages.splice(thinkingIndex, 1);
        }
        return [...newMessages, { role: "assistant", content: response }];
      });

      // Create structured data for storage
      const structuredData = createStructuredData(
        userMessage,
        response,
        toolUsed,
        searchResults
      );

      // Upload the structured data
      if (isConnected) {
        await uploadToStoracha(structuredData, toolUsed);
      } else {
        console.warn("Not connected to Storacha, skipping upload");
      }
    } catch (error) {
      console.error("Error in chat interaction:", error);
      setUploadStatus(`Error: ${error.message}`);

      // Remove thinking message and add error message
      setChatMessages((prev) => {
        const newMessages = [...prev];
        const thinkingIndex = newMessages.findIndex(
          (msg) => msg.role === "thinking"
        );
        if (thinkingIndex !== -1) {
          newMessages.splice(thinkingIndex, 1);
        }
        return [
          ...newMessages,
          {
            role: "system",
            content: `Error: ${error.message}. Please try again.`,
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content) => {
    return content;
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-950 border-b border-gray-800 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
              AI Web Scholar
            </h1>
            <p
              className={`text-xs mt-1 flex items-center ${
                isConnected
                  ? "text-green-400"
                  : connectionStatus.includes("failed")
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full mr-1 ${
                  isConnected
                    ? "bg-green-400"
                    : connectionStatus.includes("failed")
                    ? "bg-red-400"
                    : "bg-yellow-400"
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
          </div>
          <div className="flex space-x-2">
            <button className="transition-colors duration-200 hover:bg-gray-800 p-2 rounded-full">
              <Search size={18} className="text-gray-400 hover:text-white" />
            </button>
            <button className="transition-colors duration-200 hover:bg-gray-800 p-2 rounded-full">
              <Mic size={18} className="text-gray-400 hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages container */}
      <div
        id="chat-container"
        className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 px-4 py-3"
      >
        <div className="max-w-3xl mx-auto space-y-4 pb-2">
          {chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
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
                  className="text-white"
                >
                  <path d="M12 8V4m0 4 3 3m-3-3-3 3M4 13c0 4.4 3.6 8 8 8s8-3.6 8-8a7.9 7.9 0 0 0-8-8"></path>
                </svg>
              </div>
              <p className="text-gray-400 text-lg font-medium mb-2">
                Ready for a conversation
              </p>
              <p className="text-gray-500 max-w-md">
                Ask me anything - from general knowledge to specific research
                questions, I'm here to help.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`animate-fade-in max-w-[85%] ${
                    msg.role === "user"
                      ? "self-end"
                      : msg.role === "assistant"
                      ? "self-start"
                      : msg.role === "thinking"
                      ? "self-start opacity-75"
                      : "self-center"
                  } mb-4`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-md ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                        : msg.role === "assistant"
                        ? "bg-gray-800 border border-gray-700 text-white"
                        : msg.role === "thinking"
                        ? "bg-gray-800 border border-gray-700 text-gray-300"
                        : "bg-red-900 text-white"
                    }`}
                  >
                    {msg.role === "thinking" && (
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce mr-1"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150 mr-1"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></div>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">
                      {formatMessage(msg.content)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 px-2">
                    {msg.role === "user"
                      ? "You"
                      : msg.role === "assistant"
                      ? "AI Assistant"
                      : msg.role === "thinking"
                      ? "Processing..."
                      : "System"}
                    {" • "}
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}

              {/* Better loading indicator */}
              {isLoading &&
                !chatMessages.some((msg) => msg.role === "thinking") && (
                  <div className="self-start max-w-[85%] mb-4">
                    <div className="bg-gray-800 border border-gray-700 text-gray-300 rounded-2xl px-4 py-3 shadow-md">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce mr-1"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150 mr-1"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 px-2">
                      AI Assistant is thinking...
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 bg-gray-900 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center space-x-2">
            <button className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-full transition-colors">
              <PlusCircle size={20} />
            </button>
            <div className="flex-grow relative flex items-center">
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
                    ? "Connecting to Storacha..."
                    : isLoading
                    ? "Please wait..."
                    : "Ask anything..."
                }
                disabled={isLoading || !isConnected}
                className={`w-full bg-gray-800 text-white px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 border border-gray-700 ${
                  isLoading || !isConnected ? "opacity-50" : ""
                }`}
              />
              <div className="absolute right-3 flex space-x-1">
                <button className="text-gray-400 hover:text-white p-1.5 rounded-full transition-colors">
                  <Globe size={18} />
                </button>
                <button className="text-gray-400 hover:text-white p-1.5 rounded-full transition-colors">
                  <Lightbulb size={18} />
                </button>
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !isConnected}
              className={`p-3 rounded-full transition-all ${
                !inputMessage.trim() || isLoading || !isConnected
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-blue-500/20"
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialResponseAgent;
