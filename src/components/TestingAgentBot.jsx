"use client";
import { useEffect, useState, useRef } from "react";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { SERPGoogleScholarAPITool } from "@langchain/community/tools/google_scholar";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda } from "@langchain/core/runnables";
// Add Storacha imports
import { create } from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import { Search, Send } from "lucide-react"; // Using Send instead of bulb icon

export default function MultiAgentChatbot() {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "Welcome! I can search the web and academic papers to answer your questions. What would you like to know?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Add Storacha-related state
  const [storachaClient, setStorachaClient] = useState(null);
  const [currentSpace, setCurrentSpace] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(
    "Initializing storage..."
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [spaceCid, setSpaceCid] = useState("");

  // Types of AI artifacts that can be stored
  const artifactTypes = {
    CHAIN_OF_THOUGHT: "chain_of_thought",
    CODE_ARTIFACT: "code_artifact",
    METADATA: "metadata",
    MESSAGES: "messages",
    SOURCE_TYPE: "source_type",
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Storacha client
  useEffect(() => {
    initializeStorachaClient();

    // Load messages from LocalStorage
    const storedMessages = JSON.parse(
      localStorage.getItem("chatMessages") || "[]"
    );
    if (storedMessages.length > 0) {
      setMessages((prev) => [...prev, ...storedMessages]);
    }
  }, []);

  // Save messages to LocalStorage
  useEffect(() => {
    const messagesToStore = messages
      .filter((msg) => msg.role !== "system")
      .slice(-50);
    localStorage.setItem("chatMessages", JSON.stringify(messagesToStore));
  }, [messages]);

  const initializeStorachaClient = async () => {
    try {
      setConnectionStatus("Creating storage client...");

      // Create client with memory store
      const store = new StoreMemory();
      const client = await create({ store });
      setStorachaClient(client);

      // Get the agent DID
      const agentDID = client.agent.did();
      console.log("Agent DID:", agentDID);

      // Check for existing spaces
      try {
        const spaces = await client.spaces();
        console.log("Available spaces:", spaces);

        if (spaces.length > 0) {
          const spaceToUse = spaces[0];
          await client.setCurrentSpace(spaceToUse.did());
          setCurrentSpace(spaceToUse);
          setConnectionStatus(
            "Connected to space: " + spaceToUse.did().substring(0, 10) + "..."
          );
          setIsConnected(true);
          return;
        }
      } catch (error) {
        console.log("Error accessing spaces, proceeding to login...", error);
      }

      // Login with email if needed
      setConnectionStatus("Logging in...");
      await client.login("avularamswaroop@gmail.com"); // Replace with your email

      // Check spaces after login
      const spacesAfterLogin = await client.spaces();

      if (spacesAfterLogin.length === 0) {
        setConnectionStatus("Creating new space...");
        const newSpace = await client.createSpace("multi-agent-chat-space");
        await client.setCurrentSpace(newSpace.did());
        setCurrentSpace(newSpace);
        setConnectionStatus("Connected to new space");
        setIsConnected(true);
      } else {
        const space = spacesAfterLogin[0];
        await client.setCurrentSpace(space.did());
        setCurrentSpace(space);
        setConnectionStatus(
          "Connected to space: " + space.did().substring(0, 10) + "..."
        );
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Error initializing storage client:", error);
      setConnectionStatus(`Connection failed: ${error.message}`);
    }
  };

  // Verify space connection
  const verifySpaceConnection = async () => {
    if (!storachaClient) return false;

    try {
      // Check if current space is set
      // try {
      //   const currentSpace= await storachaClient.currentSpace()
      //   return true;
      // } catch (error) {
      // Try to recover by setting space again
      if (currentSpace) {
        await storachaClient.setCurrentSpace(currentSpace.did());
        return true;
      }

      // Last resort - get available spaces
      const spaces = await storachaClient.spaces();
      if (spaces.length > 0) {
        await storachaClient.setCurrentSpace(spaces[0].did());
        setCurrentSpace(spaces[0]);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error verifying connection:", error);
      return false;
    }
  };

  // Extract AI artifacts from response
  const extractAIArtifacts = (aiResponse, sourceType) => {
    const artifacts = {
      [artifactTypes.MESSAGES]: aiResponse,
      [artifactTypes.SOURCE_TYPE]: sourceType,
    };

    // Extract code blocks
    const codeRegex = /``````/g;
    const codeMatches = [...aiResponse.matchAll(codeRegex)];

    if (codeMatches.length > 0) {
      artifacts[artifactTypes.CODE_ARTIFACT] = codeMatches.map((match) => ({
        language: match[1] || "text",
        code: match[2],
      }));
    }

    // Check for chain of thought patterns
    if (
      aiResponse.includes("step by step") ||
      aiResponse.includes("Let me think") ||
      (aiResponse.includes("First, ") && aiResponse.includes("Second, ")) ||
      (aiResponse.includes("1.") && aiResponse.includes("2."))
    ) {
      artifacts[artifactTypes.CHAIN_OF_THOUGHT] = aiResponse;
    }

    // Add metadata
    artifacts[artifactTypes.METADATA] = {
      timestamp: new Date().toISOString(),
      modelUsed: "qwen-2.5-32b",
      responseLength: aiResponse.length,
      sourceType: sourceType,
    };

    return artifacts;
  };

  // Upload artifacts to Storacha
  const uploadArtifactsToStoracha = async (artifacts, conversationId) => {
    if (!storachaClient || !isConnected) return null;

    setIsUploading(true);
    setUploadStatus("Preparing to upload artifacts...");

    try {
      // Verify connection
      const isSpaceVerified = await verifySpaceConnection();
      if (!isSpaceVerified) {
        throw new Error("Could not verify space connection");
      }

      // Create structured object
      const artifactData = {
        id: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        artifacts: artifacts,
      };

      // Create file for upload
      const filename = `ai_artifacts_${Date.now()}.json`;
      const artifactBlob = new Blob([JSON.stringify(artifactData, null, 2)], {
        type: "application/json",
      });
      const file = new File([artifactBlob], filename, {
        type: "application/json",
      });

      setUploadStatus("Uploading artifacts...");
      const uploadResult = await storachaClient.uploadFile(file);

      console.log("Uploaded with CID:", uploadResult.toString());
      setSpaceCid(uploadResult.toString());
      setUploadStatus("Upload complete!");

      return uploadResult.toString();
    } catch (error) {
      console.error("Error uploading artifacts:", error);
      setUploadStatus(`Upload failed: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  async function handleSendMessage(e) {
    e.preventDefault();

    if (!inputText.trim() || isLoading) return;

    // Add user message
    const conversationId = Date.now().toString();
    const userMessage = {
      role: "user",
      content: inputText,
      id: conversationId,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input and show loading
    setInputText("");
    setIsLoading(true);

    // Add temporary "thinking" message
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Thinking...", isLoading: true },
    ]);

    try {
      // Process query with multi-agent system
      const response = await runMultiAgentSystem(inputText);

      // Replace "thinking" with actual response
      const responseMessage = {
        role: "assistant",
        content: response.content,
        source: response.source || null,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => prev.slice(0, -1).concat(responseMessage));

      // Upload artifacts to Storacha if connected
      if (isConnected && storachaClient) {
        const aiArtifacts = extractAIArtifacts(
          response.content,
          response.source
        );

        // Include conversation history
        const conversationHistory = [
          ...messages.slice(0, -1),
          userMessage,
          responseMessage,
        ];
        aiArtifacts[artifactTypes.MESSAGES] = conversationHistory;

        await uploadArtifactsToStoracha(aiArtifacts, conversationId);
      }
    } catch (error) {
      console.error("Error processing message:", error);

      // Replace with error message
      setMessages((prev) =>
        prev.slice(0, -1).concat({
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your request. Please try again.",
          isError: true,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        })
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function runMultiAgentSystem(query) {
    try {
      // Initialize tools
      const webSearchTool = new TavilySearchResults({
        maxResults: 2,
        apiKey: "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",
      });

      const scholarTool = new SERPGoogleScholarAPITool({
        apiKey:
          "d033f92170d893fb5f23a0a9753c6d3e2134647cba08c93360828ef375aac527",
      });

      // Initialize LLM
      const llm = new ChatGroq({
        apiKey: "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",
        model: "qwen-2.5-32b",
        temperature: 0,
      });

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
      const routerChain = routerPrompt.pipe(llm);

      // Web search agent prompt
      const webSearchPrompt = ChatPromptTemplate.fromMessages([
        [
          "system",
          "You are a helpful web search assistant. Use the search tool to find accurate and up-to-date information. After finding information, provide a comprehensive and conversational response that includes the sources you used at the end.",
        ],
        ["placeholder", "{messages}"],
      ]);

      // Scholar agent prompt
      const scholarPrompt = ChatPromptTemplate.fromMessages([
        [
          "system",
          "You are a helpful Research scholar assistant. Use the Scholar tool to find reliable research paper information. After finding information, provide a comprehensive and conversational response that includes the academic sources you cited at the end.",
        ],
        ["placeholder", "{messages}"],
      ]);

      // Equip LLM with respective tools
      const webLLM = llm.bindTools([webSearchTool]);
      const webSearchChain = webSearchPrompt.pipe(webLLM);

      const scholarLLM = llm.bindTools([scholarTool]);
      const scholarChain = scholarPrompt.pipe(scholarLLM);

      // Function to create agent chain
      const createAgentChain = (chain) => {
        return RunnableLambda.from(async (userInput, config) => {
          const humanMessage = new HumanMessage(userInput);
          const aiMsg = await chain.invoke(
            { messages: [humanMessage] },
            config
          );

          if (aiMsg.tool_calls?.length > 0) {
            const tool = aiMsg.tool_calls[0].name.includes("tavily")
              ? webSearchTool
              : scholarTool;

            const toolMsgs = await tool.batch(aiMsg.tool_calls, config);

            // Send tool calls and results back to LLM for synthesis
            const synthPrompt = ChatPromptTemplate.fromMessages([
              [
                "system",
                "You are a helpful assistant that provides clear, conversational answers. Synthesize the search results into a coherent response.",
              ],
              ["human", `Query: ${userInput}`],
              [
                "human",
                `Search results: ${toolMsgs
                  .map((msg) => msg.content)
                  .join("\n\n")}`,
              ],
            ]);

            const synthResult = await synthPrompt.pipe(llm).invoke({});

            return {
              tool_calls: aiMsg.tool_calls,
              content: synthResult.content,
              source: "search results",
            };
          }

          return aiMsg;
        });
      };

      // Create both agent chains
      const webAgentChain = createAgentChain(webSearchChain);
      const scholarAgentChain = createAgentChain(scholarChain);

      // Dispatch query to appropriate agent based on router decision
      console.log("Determining best agent for query:", query);
      const routerDecision = await routerChain.invoke({ query });
      console.log("Router decision:", routerDecision.content.toLowerCase());

      let agentResult;
      let sourceType;

      if (routerDecision.content.toLowerCase().includes("web")) {
        console.log("Using web search agent");
        sourceType = "Web Search";
        agentResult = await webAgentChain.invoke(query);
      } else {
        console.log("Using Scholar agent");
        sourceType = "Academic Search";
        agentResult = await scholarAgentChain.invoke(query);
      }

      // Process result
      let displayResult;
      if (
        typeof agentResult.content === "string" &&
        agentResult.content.startsWith("{")
      ) {
        try {
          const data = JSON.parse(agentResult.content);
          displayResult = Array.isArray(data) ? data[1].content : data.content;
        } catch (e) {
          displayResult = agentResult.content;
          console.log(e);
        }
      } else {
        displayResult = agentResult.content;
      }

      return {
        content: displayResult,
        source: sourceType,
      };
    } catch (error) {
      console.error("Error in multi-agent system:", error);
      throw new Error("Failed to process your request");
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-50 border rounded-lg shadow-md overflow-hidden">
      {/* Header with storage status */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">
              Multi-Agent Research Assistant
            </h1>
            <p className="text-sm opacity-90">
              Ask me anything - I'll search the web or academic papers for you
            </p>
          </div>
          <div>
            <button className="hover:bg-blue-700 p-2 rounded">
              <Search size={20} />
            </button>
          </div>
        </div>
        <p
          className={`text-xs mt-1 ${
            isConnected
              ? "text-green-200"
              : connectionStatus.includes("failed")
              ? "text-red-200"
              : "text-yellow-200"
          }`}
        >
          {connectionStatus}
        </p>
        {isUploading && <p className="text-xs text-gray-200">{uploadStatus}</p>}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-white">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : message.role === "system"
                    ? "bg-gray-200 text-gray-800"
                    : "bg-gray-100 text-gray-800 rounded-bl-none border-l-4 border-blue-500"
                } ${message.isLoading ? "animate-pulse" : ""}`}
              >
                <div>{message.content}</div>
                {message.source && (
                  <div className="mt-2 text-xs opacity-75">
                    Source: {message.source}
                  </div>
                )}
                {message.timestamp &&
                  !message.isLoading &&
                  message.role !== "system" && (
                    <div className="text-xs opacity-50 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white border-t">
        {spaceCid && (
          <div className="mb-2 text-xs text-gray-500">
            Last storage CID: {spaceCid.substring(0, 16)}...
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              !isConnected
                ? "Connecting to storage..."
                : isLoading
                ? "Please wait..."
                : "Ask me anything..."
            }
            className={`flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLoading || !isConnected ? "opacity-50" : ""
            }`}
            disabled={isLoading || !isConnected}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim() || !isConnected}
            className={`p-3 rounded-r-lg ${
              isLoading || !inputText.trim() || !isConnected
                ? "bg-gray-300 text-gray-500"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } transition-colors`}
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
