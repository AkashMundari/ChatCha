// Import necessary modules from LangChain.js
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
// import { ConversationBufferMemory } from "@langchain/memory";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Initialize the Groq LLM with your API key
const llm = new ChatGroq({
  apiKey: "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", // Replace with your Groq API key
  model: "llama-3.3-70b-versatile",
  temperature: 0.2,
  maxTokens: 500,
});

const promptTemplate = ChatPromptTemplate.fromMessages([
  {
    role: "system",
    content: `You are a prompt optimization assistant. Your only job is to reformat and improve user queries to make them more effective for LLMs.
    
    Guidelines for reformatting:
    - Make the prompt clear, specific, and well-structured
    - Break complex questions into logical parts
    - Add relevant context if needed
    - Remove ambiguity
    - DO NOT answer the query itself
    - ONLY return the improved prompt text
    - Preserve the original intent of the query`,
  },
  { role: "user", content: "{input}" },
]);

const outputParser = new StringOutputParser();

const chain = promptTemplate.pipe(llm).pipe(outputParser);

async function improvePrompt(userInput) {
  try {
    const improvedPrompt = await chain.invoke({ input: userInput });
    return improvedPrompt;
  } catch (error) {
    console.error("Error processing prompt:", error);
    return "An error occurred while processing your request.";
  }
}

export { improvePrompt };

(async () => {
  const userPrompt =
    "I am unable to have my digestion going properly in bathroom.what is my problem?";
  const improvedPrompt = await improvePrompt(userPrompt);
  console.log("Improved Prompt:");
  console.log(improvedPrompt);
})();

//2 pm
/* 
 
first we create  
we create  a multi agent using langchain x groq
// frontend
 2 hrs 
 2 hrs strira

 8 pm for completion tackling both bounties

april 4 - 6 
we
*/
