import React, { useState, useEffect, useRef } from "react";
import { Search, Mic, Send, PlusCircle, Globe, Lightbulb } from "lucide-react";
import { ChatGroq } from "@langchain/groq";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { create } from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { SERPGoogleScholarAPITool } from "@langchain/community/tools/google_scholar";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda } from "@langchain/core/runnables";

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef(null);
  const [llm, setLlm] = useState(null);
  const [webSearchTool, setWebSearchTool] = useState(null);
  const [scholarTool, setScholarTool] = useState(null);
  const [routerChain, setRouterChain] = useState(null);
  const [storachaClient, setStorachaClient] = useState(null);
  const [spaceCid, setSpaceCid] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");
  const [isConnected, setIsConnected] = useState(false);
  const spaceDID = "z6MkjbUgeTkH47g3mmLJz36Ny61MLLkD5KXFNmFWz3vbfws2";

  // Initialize the chat model, tools, and Storacha client on component mount
  useEffect(() => {
    // Initialize AI components
    initializeAIComponents();

    // Initialize Storacha client
    initializeStorachaClient();

    // Load messages from LocalStorage (fallback)
    const storedMessages = JSON.parse(
      localStorage.getItem("chatMessages") || "[]"
    );
    setMessages(storedMessages);
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

      // First try to see if we already have access to the space
      try {
        const spaces = await client.spaces();
        const existingSpace = spaces.find((space) => space.did() === spaceDID);

        if (existingSpace) {
          await client.setCurrentSpace(existingSpace.did());
          setConnectionStatus("Connected to existing space");
          setIsConnected(true);
          return;
        }
      } catch (error) {
        console.log(
          "No existing space access, proceeding to authorization...",
          error
        );
      }
      // Instead of using authorize
      setConnectionStatus("Logging in with email...");
      await client.login("avularamswaroop@gmail.com");

      // Then claim the delegations
      setConnectionStatus("Claiming delegations...");
      const delegations = await client.capability.access.claim();

      console.log("Claimed delegations:", delegations);

      // Check if we now have access to the space
      const spaces = await client.spaces();
      console.log("Available spaces:", spaces);

      const targetSpace = spaces[0];

      if (targetSpace) {
        await client.setCurrentSpace(targetSpace.did());
        setConnectionStatus("Connected to space");
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

  // Save messages to LocalStorage whenever messages change
  useEffect(() => {
    const messagesToStore = messages.slice(-50);
    localStorage.setItem("chatMessages", JSON.stringify(messagesToStore));
  }, [messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Upload messages to Storacha
  const uploadMessagesToStoracha = async (updatedMessages) => {
    if (!storachaClient || !isConnected) {
      console.error("Storacha client not initialized or not connected");
      return null;
    }

    setIsUploading(true);
    setUploadStatus("Preparing to upload messages...");

    try {
      // Create a unique filename with timestamp
      const timestamp = new Date().toISOString();

      const filename = `chat_history_${timestamp}.json`;

      // Create a file object with the messages
      const messageBlob = new Blob([JSON.stringify(updatedMessages)], {
        type: "application/json",
      });
      const file = new File([messageBlob], filename, {
        type: "application/json",
      });

      setUploadStatus("Uploading messages to Storacha...");

      // Upload the file to Storacha
      const uploadResult = await storachaClient.uploadFile(file);

      console.log(
        "Messages uploaded successfully with CID:",
        uploadResult.toString()
      );
      setSpaceCid(uploadResult.toString());
      setUploadStatus("Upload complete!");

      return uploadResult.toString();
    } catch (error) {
      console.error("Error uploading messages to Storacha:", error);
      setUploadStatus(`Upload failed: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Retrieve messages from Storacha
  const retrieveMessagesFromStoracha = async (cid) => {
    if (!cid) {
      console.error("No CID provided for retrieval");
      return;
    }

    setIsLoading(true);

    try {
      const gatewayUrl = `https://${cid}.ipfs.w3s.link`;
      console.log("Fetching from:", gatewayUrl);

      const response = await fetch(gatewayUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch messages: ${response.status} ${response.statusText}`
        );
      }

      const retrievedMessages = await response.json();
      console.log("Retrieved Messages:", retrievedMessages);

      if (Array.isArray(retrievedMessages) && retrievedMessages.length > 0) {
        setMessages(retrievedMessages);
      } else {
        console.warn(
          "Retrieved data is not in expected format:",
          retrievedMessages
        );
      }
    } catch (error) {
      console.error("Error retrieving messages from Storacha:", error);
      alert("Failed to retrieve messages. See console for details.");
    } finally {
      setIsLoading(false);
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
      return Error`retrieving information: ${error.message}`;
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

    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    // Update messages with user input
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputMessage("");

    try {
      // First, determine if we should use a search tool or just the LLM
      console.log("Determining best agent for query:", inputMessage);

      // Route the message to determine which tool to use
      const routerDecision = await routerChain.invoke({ query: inputMessage });
      console.log("Router decision:", routerDecision.content.toLowerCase());

      let response;
      const toolDecision = routerDecision.content.toLowerCase();

      // Execute the appropriate tool based on the router decision
      if (toolDecision.includes("web")) {
        console.log("Using web search tool");
        const searchResults = await executeSearch(inputMessage, webSearchTool);

        // Now combine the search results with the question for the LLM
        const prompt = `Question: ${inputMessage}\n\nSearch Results: ${searchResults}\n\nPlease answer the question based on the search results above.`;
        const aiResponse = await llm.invoke(prompt);
        response = aiResponse.content;
      } else if (toolDecision.includes("scholar")) {
        console.log("Using scholar tool");
        const scholarResults = await executeSearch(inputMessage, scholarTool);

        // Combine the scholar results with the question
        const prompt = `Question: ${inputMessage}\n\nScholar Results: ${scholarResults}\n\nPlease answer the question based on the scholarly information above.`;
        const aiResponse = await llm.invoke(prompt);
        response = aiResponse.content;
      } else {
        // Fallback to just using the LLM directly
        console.log("Using LLM directly");
        const aiResponse = await llm.invoke(inputMessage);
        response = aiResponse.content;
      }

      console.log("AI response:", response);

      // Create AI response message
      const aiMessage = {
        id: Date.now() + 1,
        text: response,
        sender: "bot",
        timestamp: new Date().toISOString(),
      };

      // Update messages with AI response
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Upload the complete conversation including the new AI response
      if (isConnected) {
        await uploadMessagesToStoracha(finalMessages);
      } else {
        console.warn("Not connected to Storacha, skipping upload");
      }
    } catch (error) {
      console.error("Error in chat interaction:", error);

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Sorry, there was an error processing your request.",
          sender: "bot",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Hey! How's it going?</h1>
          <p
            className={`text-xs ${
              isConnected
                ? "text-green-400"
                : connectionStatus.includes("failed")
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            {connectionStatus}
          </p>
          {isUploading && (
            <p className="text-xs text-gray-400">{uploadStatus}</p>
          )}
        </div>
        <div className="flex space-x-4">
          <button className="hover:bg-gray-800 p-2 rounded">
            <Search size={20} />
          </button>
          <button className="hover:bg-gray-800 p-2 rounded">
            <Mic size={20} />
          </button>
        </div>
        {/* Button to retrieve messages */}
        <button
          onClick={() => retrieveMessagesFromStoracha(spaceCid)}
          disabled={!spaceCid || isLoading || !isConnected}
          className={`${
            !spaceCid || isLoading || !isConnected
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          } p-2 rounded flex items-center`}
        >
          {isLoading ? "Loading..." : "Retrieve Messages"}
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-white"
              }`}
            >
              {message.text}
              {message.timestamp && (
                <div className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-white p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 flex items-center space-x-2">
        <button className="hover:bg-gray-800 p-2 rounded">
          <PlusCircle size={24} />
        </button>
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
                ? "Connecting to Storacha..."
                : isLoading
                ? "Please wait..."
                : "Ask anything"
            }
            disabled={isLoading || !isConnected}
            className={`w-full bg-gray-800 text-white p-2 pl-4 pr-10 rounded-full focus:outline-none ${
              isLoading || !isConnected ? "opacity-50" : ""
            }`}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
            <button className="hover:bg-gray-700 p-1 rounded">
              <Globe size={20} />
            </button>
            <button className="hover:bg-gray-700 p-1 rounded">
              <Lightbulb size={20} />
            </button>
          </div>
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

      {/* Display current CID */}
      {spaceCid && (
        <div className="p-2 bg-gray-900 text-xs text-gray-400 text-center">
          Current CID: {spaceCid}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
