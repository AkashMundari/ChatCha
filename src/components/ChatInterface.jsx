import React, { useState, useEffect, useRef } from "react";
import { Search, Mic, Send, PlusCircle, Globe, Lightbulb } from "lucide-react";
import { ChatGroq } from "@langchain/groq";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
// import dotenv from "dotenv";
// dotenv.config();

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messageEndRef = useRef(null);
  const [chatModel, setChatModel] = useState(null);
  // const apiKey = ;

  // Initialize the chat model on component mount
  useEffect(() => {
    // IMPORTANT: Ensure you have set the GROQ_API_KEY environment variable
    const chatModel = new ChatGroq({
      apiKey: "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",
      model: "llama-3.3-70b-versatile", // Corrected model name
      temperature: 0,
    });

    setChatModel(chatModel);

    // Load messages from LocalStorage
    const storedMessages = JSON.parse(
      localStorage.getItem("chatMessages") || "[]"
    );
    setMessages(storedMessages);
  }, []);

  // Save messages to LocalStorage whenever messages change
  useEffect(() => {
    const messagesToStore = messages.slice(-10);
    localStorage.setItem("chatMessages", JSON.stringify(messagesToStore));
  }, [messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatModel) return;

    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
    };

    // Update messages state
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputMessage("");

    try {
      // Convert previous messages to LangChain message format
      const conversationHistory = messages.map((msg) =>
        msg.sender === "user"
          ? new HumanMessage(msg.text)
          : new AIMessage(msg.text)
      );

      // Prepare the current message
      const currentMessage = new HumanMessage(inputMessage);

      // Send message with conversation context
      const response = await chatModel.invoke([
        ...conversationHistory,
        currentMessage,
      ]);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: response.content,
          sender: "bot",
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Sorry, there was an error processing your request.",
          sender: "bot",
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Hey! How's it going?</h1>
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
            </div>
          </div>
        ))}
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
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask anything"
            className="w-full bg-gray-800 text-white p-2 pl-4 pr-10 rounded-full focus:outline-none"
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
          className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
