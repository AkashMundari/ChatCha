import React, { useState, useEffect, useRef } from "react";
import { Search, Mic, Send, PlusCircle, Globe, Lightbulb } from "lucide-react";
import { ChatGroq } from "@langchain/groq";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { create } from "@web3-storage/w3up-client";
// import * as Delegation from "@web3-storage/w3up-client/delegation";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";

const ChatInterface1 = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef(null);
  const [chatModel, setChatModel] = useState(null);
  const [storachaClient, setStorachaClient] = useState(null);
  const [spaceCid, setSpaceCid] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");
  const [isConnected, setIsConnected] = useState(false);

  // Initialize the chat model and Storacha client on component mount
  useEffect(() => {
    // Initialize ChatGroq model
    const chatModel = new ChatGroq({
      apiKey: "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",
      model: "llama-3.3-70b-versatile",
      temperature: 0,
    });
    setChatModel(chatModel);

    // Initialize Storacha client
    initializeStorachaClient();

    // Load messages from LocalStorage (fallback)
    const storedMessages = JSON.parse(
      localStorage.getItem("chatMessages") || "[]"
    );
    setMessages(storedMessages);
  }, []);
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

      // Login with email and get account object
      setConnectionStatus("Logging in with email...");
      const account = await client.login("avularamswaroop@gmail.com");

      // Claim delegations
      setConnectionStatus("Claiming delegations...");
      const delegations = await client.capability.access.claim();
      console.log("Claimed delegations:", delegations);

      // try {
      // Create a unique space name using timestamp
      const uniqueSpaceName = `my-space-${Date.now()}`;
      setConnectionStatus(`Creating new space: ${uniqueSpaceName}...`);

      // Make sure account is properly authenticated before creating space
      if (!account) {
        throw new Error("Account not authenticated. Please login first.");
      }

      // Wait for a payment plan if needed
      await account.plan.wait();

      // Create the space with proper account parameter
      const space = await client.createSpace(uniqueSpaceName, {
        account,
        skipGatewayAuthorization: true,
      });

      // Set as current space
      await client.setCurrentSpace(space.did());

      console.log("New space created:", space);
      setConnectionStatus(`Space "${uniqueSpaceName}" created successfully`);
      setIsConnected(true);
      return space;
    } catch (error) {
      console.error("Error creating space:", error);
      setConnectionStatus(`Failed to create space: ${error.message}`);
      throw error;
    }
  };

  useEffect(() => {
    const messagesToStore = messages.slice(-50);
    localStorage.setItem("chatMessages", JSON.stringify(messagesToStore));
  }, [messages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadMessagesToStoracha = async (updatedMessages) => {
    if (!storachaClient || !isConnected) {
      console.error("Storacha client not initialized or not connected");
      return null;
    }

    setIsUploading(true);
    setUploadStatus("Preparing to upload messages...");

    try {
      const timestamp = new Date().toISOString();

      const filename = `chat_history_${timestamp}.json`;
      const messageBlob = new Blob([JSON.stringify(updatedMessages)], {
        type: "application/json",
      });
      const file = new File([messageBlob], filename, {
        type: "application/json",
      });

      setUploadStatus("Uploading messages to Storacha...");

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatModel || isLoading || !isConnected) {
      if (!isConnected) {
        alert("Please wait until connection to Storacha is established");
      }
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
      // Convert previous messages to LangChain format
      const conversationHistory = messages.map((msg) =>
        msg.sender === "user"
          ? new HumanMessage(msg.text)
          : new AIMessage(msg.text)
      );

      // Prepare the current message
      const currentMessage = new HumanMessage(inputMessage);

      // Send message with context
      const response = await chatModel.invoke([
        ...conversationHistory,
        currentMessage,
      ]);

      // Create AI response message
      const aiMessage = {
        id: Date.now() + 1,
        text: response.content,
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

export default ChatInterface1;
