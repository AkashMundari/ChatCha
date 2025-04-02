import React, { useState, useEffect, useRef } from "react";
import { Search, Mic, Send, PlusCircle, Globe, Lightbulb } from "lucide-react";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { create } from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";

const ChatInterfacech = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef(null);
  const [lilypadClient, setLilypadClient] = useState(null);
  const [storachaClient, setStorachaClient] = useState(null);
  const [spaceCid, setSpaceCid] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");
  const [isConnected, setIsConnected] = useState(false);
  const [currentSpace, setCurrentSpace] = useState(null);
  const [currentModel, setCurrentModel] = useState("llama-3.3-70b-versatile");
  const spaceDID = "z6MkjbUgeTkH47g3mmLJz36Ny61MLLkD5KXFNmFWz3vbfws2";

  // Lilypad API endpoint
  const LILYPAD_API_URL = "https://api.lilypad.tech";
  const LILYPAD_API_KEY =
    "anr_93a15e0140dee192814693c8dfffba0b0e95b3f9d00466929de79207e529260b"; // Replace with your actual API key

  // Model mapping for different task types
  const MODEL_MAPPING = {
    TEXT_GENERATION: [
      "llama-3.3-70b-versatile",
      "mixtral-8x7b",
      "phi-3-medium",
    ],
    CODE_GENERATION: ["deepseek-coder", "codellama-70b", "phi-3-medium"],
    REASONING: ["llama-3.3-70b-versatile", "mixtral-8x7b", "claude-3-sonnet"],
    MATH: ["deepseek-math", "claude-3-opus", "llama-3.3-70b"],
    DEFAULT: "llama-3.3-70b-versatile",
  };

  // Types of AI artifacts that can be stored
  const artifactTypes = {
    CHAIN_OF_THOUGHT: "chain_of_thought",
    CODE_ARTIFACT: "code_artifact",
    EXECUTION_ARTIFACT: "execution_artifact",
    MODEL_ARTIFACT: "model_artifact",
    TRAINING_DATA: "training_data",
    METADATA: "metadata",
    ANNOTATIONS: "annotations",
    MESSAGES: "messages",
  };

  // Initialize the Lilypad client and Storacha client on component mount
  useEffect(() => {
    // Initialize Lilypad client
    initializeLilypadClient();

    // Initialize Storacha client
    initializeStorachaClient();

    // Load messages from LocalStorage (fallback)
    const storedMessages = JSON.parse(
      localStorage.getItem("chatMessages") || "[]"
    );
    setMessages(storedMessages);
  }, []);

  const initializeLilypadClient = async () => {
    try {
      // Initialize Lilypad client
      const client = {
        async callModel(modelName, prompt, options = {}) {
          try {
            const response = await fetch(`${LILYPAD_API_URL}/v1/inference`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${LILYPAD_API_KEY}`,
              },
              body: JSON.stringify({
                model: modelName,
                prompt: prompt,
                temperature: options.temperature || 0,
                max_tokens: options.max_tokens || 2048,
              }),
            });

            if (!response.ok) {
              throw new Error(`Lilypad API error: ${response.status}`);
            }

            const result = await response.json();
            return result.text;
          } catch (error) {
            console.error("Error calling Lilypad API:", error);
            throw error;
          }
        },
      };

      setLilypadClient(client);
      console.log("Lilypad client initialized");
    } catch (error) {
      console.error("Error initializing Lilypad client:", error);
    }
  };

  // Detect task type based on user input
  const detectTaskType = (userInput) => {
    const input = userInput.toLowerCase();

    if (
      input.includes("code") ||
      input.includes("function") ||
      input.includes("programming") ||
      input.includes("script") ||
      /write a (python|javascript|java|c\+\+|rust)/i.test(input)
    ) {
      return "CODE_GENERATION";
    }

    if (
      input.includes("math") ||
      input.includes("calculate") ||
      input.includes("equation") ||
      input.includes("solve")
    ) {
      return "MATH";
    }

    if (
      input.includes("reason") ||
      input.includes("explain why") ||
      input.includes("analyze") ||
      input.includes("consider") ||
      input.includes("step by step")
    ) {
      return "REASONING";
    }

    return "TEXT_GENERATION";
  };

  // Select optimal model based on task type
  const selectOptimalModel = (taskType) => {
    const models = MODEL_MAPPING[taskType] || MODEL_MAPPING.DEFAULT;
    // For now, just return the first model in the list for this task type
    // In a more advanced implementation, you could implement load balancing or cost optimization
    return models[0];
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
        console.log("Available spaces:", spaces);

        let spaceToUse = null;

        // Try to find the specific space by DID
        const existingSpace = spaces.find((space) => space.did() === spaceDID);
        if (existingSpace) {
          spaceToUse = existingSpace;
          console.log(
            "Found existing space with matching DID:",
            existingSpace.did()
          );
        }
        // If no specific space found, use the first available space
        else if (spaces.length > 0) {
          spaceToUse = spaces[0];
          console.log("Using first available space:", spaceToUse.did());
        }

        if (spaceToUse) {
          console.log("Setting current space to:", spaceToUse.did());
          await client.setCurrentSpace(spaceToUse.did());
          setCurrentSpace(spaceToUse);
          setConnectionStatus(
            "Connected to space: " + spaceToUse.did().substring(0, 10) + "..."
          );
          setIsConnected(true);
          return;
        }
      } catch (error) {
        console.log(
          "Error accessing spaces, proceeding to authorization...",
          error
        );
      }

      // Login with email if we couldn't access existing spaces
      setConnectionStatus("Logging in with email...");
      await client.login("avularamswaroop@gmail.com");

      // Claim delegations after login
      setConnectionStatus("Claiming delegations...");
      const delegations = await client.capability.access.claim();
      console.log("Claimed delegations:", delegations);

      // Check spaces again after login
      const spacesAfterLogin = await client.spaces();
      console.log("Spaces after login:", spacesAfterLogin);

      // If no spaces exist after login, create a new one
      if (spacesAfterLogin.length === 0) {
        setConnectionStatus("Creating new space...");
        console.log("No spaces available, creating a new one");
        const newSpace = await client.createSpace("ai-chat-space");
        await client.setCurrentSpace(newSpace.did());
        setCurrentSpace(newSpace);
        console.log("Created and set new space:", newSpace.did());
        setConnectionStatus("Created and connected to new space");
        setIsConnected(true);
      } else {
        // Use the first available space after login
        const space = spacesAfterLogin[0];
        console.log("Using space after login:", space.did());
        await client.setCurrentSpace(space.did());
        setCurrentSpace(space);
        setConnectionStatus(
          "Connected to space: " + space.did().substring(0, 10) + "..."
        );
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Error initializing Storacha client:", error);
      setConnectionStatus(`Connection failed: ${error.message}`);
    }
  };

  // Verify space and reconnect if needed
  const verifySpaceConnection = async () => {
    if (!storachaClient) {
      console.error("Storacha client not initialized");
      return false;
    }

    try {
      // Check if current space is set
      let currentSpaceDid = null;
      try {
        currentSpaceDid = await storachaClient.currentSpace().did();
        console.log("Current space verified:", currentSpaceDid);
        return true;
      } catch (error) {
        console.warn("No current space set, trying to reconnect...", error);
      }

      // Try to recover by setting space again
      if (currentSpace) {
        console.log("Attempting to reconnect to space:", currentSpace.did());
        await storachaClient.setCurrentSpace(currentSpace.did());
        return true;
      }

      // Last resort - get available spaces and use first one
      const spaces = await storachaClient.spaces();
      if (spaces.length > 0) {
        const space = spaces[0];
        console.log("Reconnecting to first available space:", space.did());
        await storachaClient.setCurrentSpace(space.did());
        setCurrentSpace(space);
        return true;
      }

      console.error("No spaces available for reconnection");
      return false;
    } catch (error) {
      console.error("Error verifying space connection:", error);
      return false;
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

  // Function to extract and classify AI artifacts from response
  const extractAIArtifacts = (aiResponse) => {
    // Initialize with basic message content
    const artifacts = {
      [artifactTypes.MESSAGES]: aiResponse,
    };

    // Extract code blocks - simple implementation, can be enhanced
    const codeRegex = /```([a-z]*)\n([\s\S]*?)```/g;
    const codeMatches = [...aiResponse.matchAll(codeRegex)];

    if (codeMatches.length > 0) {
      artifacts[artifactTypes.CODE_ARTIFACT] = codeMatches.map((match) => ({
        language: match[1] || "text",
        code: match[2],
      }));
    }

    // Check for chain of thought patterns (e.g., "Let me think step by step")
    if (
      aiResponse.includes("step by step") ||
      aiResponse.includes("Let me think") ||
      (aiResponse.includes("First, ") && aiResponse.includes("Second, ")) ||
      (aiResponse.includes("1.") && aiResponse.includes("2."))
    ) {
      artifacts[artifactTypes.CHAIN_OF_THOUGHT] = aiResponse;
    }

    // Extract potential metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      modelUsed: currentModel,
      responseLength: aiResponse.length,
    };
    artifacts[artifactTypes.METADATA] = metadata;

    return artifacts;
  };

  // Upload AI artifacts to Storacha
  const uploadArtifactsToStoracha = async (artifacts, conversationId) => {
    if (!storachaClient || !isConnected) {
      console.error("Storacha client not initialized or not connected");
      return null;
    }

    setIsUploading(true);
    setUploadStatus("Preparing to upload AI artifacts...");

    try {
      // Verify space connection before upload
      const isSpaceVerified = await verifySpaceConnection();
      if (!isSpaceVerified) {
        throw new Error("Could not verify space connection before upload");
      }

      // Create a structured object with all artifact types
      const artifactData = {
        id: conversationId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        artifacts: artifacts,
      };

      // Create a unique filename with timestamp and artifact type
      const timestamp = new Date().toISOString();
      const filename = `ai_artifacts_${timestamp}.json`;

      // Create a file object with the structured artifacts
      const artifactBlob = new Blob([JSON.stringify(artifactData, null, 2)], {
        type: "application/json",
      });
      const file = new File([artifactBlob], filename, {
        type: "application/json",
      });

      setUploadStatus("Uploading artifacts to Storacha...");

      // Log current space before upload for debugging
      try {
        const currentSpaceDid = await storachaClient.currentSpace().did();
        console.log("Current space before upload:", currentSpaceDid);
      } catch (error) {
        console.error("Error getting current space before upload:", error);
      }

      // Upload the file to Storacha
      const uploadResult = await storachaClient.uploadFile(file);

      console.log(
        "Artifacts uploaded successfully with CID:",
        uploadResult.toString()
      );
      setSpaceCid(uploadResult.toString());
      setUploadStatus("Upload complete!");

      return uploadResult.toString();
    } catch (error) {
      console.error("Error uploading artifacts to Storacha:", error);
      setUploadStatus(`Upload failed: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Convert message history to a prompt format suitable for Lilypad API
  const formatMessageHistoryAsPrompt = (messages, currentMessage) => {
    let prompt = "";

    // Format previous messages
    messages.forEach((msg) => {
      if (msg.sender === "user") {
        prompt += `User: ${msg.text}\n\n`;
      } else {
        prompt += `Assistant: ${msg.text}\n\n`;
      }
    });

    // Add current message
    prompt += `User: ${currentMessage}\n\nAssistant:`;

    return prompt;
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !lilypadClient || isLoading || !isConnected) {
      if (!isConnected) {
        alert("Please wait until connection to Storacha is established");
      }
      return;
    }

    setIsLoading(true);

    const conversationId = Date.now().toString();
    const newMessage = {
      id: conversationId,
      text: inputMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    // Update messages with user input
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputMessage("");

    try {
      // Detect the task type based on user input
      const taskType = detectTaskType(inputMessage);
      console.log(`Detected task type: ${taskType}`);

      // Select the optimal model for this task
      const selectedModel = selectOptimalModel(taskType);
      setCurrentModel(selectedModel);
      console.log(`Selected model: ${selectedModel}`);

      // Format message history as a prompt
      const prompt = formatMessageHistoryAsPrompt(messages, inputMessage);

      // Call the Lilypad API with the selected model
      const response = await lilypadClient.callModel(selectedModel, prompt, {
        temperature: 0,
        max_tokens: 2048,
      });

      // Create AI response message
      const aiMessage = {
        id: Date.now() + 1,
        text: response,
        sender: "bot",
        modelUsed: selectedModel,
        timestamp: new Date().toISOString(),
      };

      // Update messages with AI response
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Extract and classify AI artifacts from the response
      const aiArtifacts = extractAIArtifacts(response);

      // Add messages to artifacts for comprehensive storage
      aiArtifacts[artifactTypes.MESSAGES] = finalMessages;

      // Add model information to metadata
      aiArtifacts[artifactTypes.METADATA].modelUsed = selectedModel;
      aiArtifacts[artifactTypes.METADATA].taskType = taskType;

      // Upload the complete set of AI artifacts
      if (isConnected) {
        await uploadArtifactsToStoracha(aiArtifacts, conversationId);
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
          {currentModel && (
            <p className="text-xs text-blue-400">Using model: {currentModel}</p>
          )}
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
              {message.modelUsed && (
                <div className="text-xs opacity-70 mt-1 text-blue-300">
                  via {message.modelUsed}
                </div>
              )}
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

export default ChatInterfacech;
