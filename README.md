# ChatCha: Decentralized AI Agent Platform 

## Overview

ChatCha is a decentralized AI agent platform where users can get their queries answered with data storage and verifiability provided by Filecoin/IPFS using Storacha. This project is built for the **Hot AI Integrations, Hotter Storage \& Spicy AI Collaboration with Storacha Data Storage** Bounty, demonstrating decentralized data storage, real-time data sharing, and analysis.


## What ChatCha Does

This project uses multiple specialized AI agents to answer user queries based on whether the user is asking for real-time latest data or information from various research papers. The multi-agent architecture ensures comprehensive and accurate responses.

## 🤖 Agents Used

### 1. Web Search Agent 🌐

- Searches the web in real-time
- Provides up-to-date information on current events and topics
- Stores search results and processing data in dedicated Storacha space


### 2. Scholar Agent 🎓

- Searches various articles and research papers
- Provides academic and research-backed information
- Maintains its own Storacha space for scholarly data storage


### 3. Analyzer Agent 

- Takes output/data from both Web Search \& Scholar Agents (i.e. from their spaces)
- Summarizes and synthesizes information from multiple sources
- Delivers concise, coherent final responses to users
- Stores analysis data in a separate Storacha space

## ChatCha Workflow
<center><img width="750" alt="HCW" src="https://github.com/user-attachments/assets/8ab89d40-7f58-4ece-a753-eb2e28798811" /></center>



## Storacha Integrations 🔥
### 1. Unique Storacha Spaces

ChatCha creates 4 distinct Storacha Spaces:

- **Web Agent Space**: Where web agent stores its data
- **Scholar Agent Space**: Where scholar agent stores its data
- **Main Space**: Where combined data from both web \& scholar agents is stored
- **Analyzer Agent Space**: Where analyzer agent stores its data


### 2. Storage \& Retrieval of Artifacts

For each query, ChatCha stores four key artifacts:

- `input` – Original prompt provided to the agent
- `output` – Final result data
- `conversation` – Conversation between the user and agent 
- `metadata` – Timestamp, model info, etc.

Have a reference from this URL:
https://bafkreiaqhxxuum2vsayxdxskxj7adocwwgrscqgbp6ajjj26jzcx6gir2m.ipfs.w3s.link/


## Code

### Initializing Storacha Client
![WhatsApp Image 2025-04-13 at 15 42 24_64e7c35d](https://github.com/user-attachments/assets/783b2b9c-f0e6-42c8-8ec9-688a78a88cc4)

### Creating Spaces
![Screenshot_2025-04-13_153834 1](https://github.com/user-attachments/assets/39a87a32-9c49-4d7b-bb29-3ca0f15c999e)

### Uploading to spaces
![Screenshot_2025-04-13_153919 1](https://github.com/user-attachments/assets/6744d8aa-aaad-44dd-999c-ac7d88f54315)


## Technologies Used
|       Feature      |          Stack         |
|:------------------:|:----------------------:|
| AI agent framework | Langchain (Groq)       |
| AI Model          |         qwen-2.5-32b            |
| Storage            | Storacha               |
| Frontend           | Tailwind CSS + ReactJS |

## Demo Video
- Youtube Link ( 3 min ) : https://youtu.be/N1t-bySH3Q0?si=DH-JuBM4mbJWQhr4
- Youtube Link (Storacha Integration in Detail - 5 min) : https://youtu.be/XYBFjriG5Pg?si=9AyStUBkVHPgqUhS
  
### Reference Links from Demo Video
- Web x Scholar CID : https://bafkreigju46wyofhzqkkefpuj5o2o3bpbe3rs2xx3jxg5ddxugfwmzhosm.ipfs.w3s.link/
- Analyzer CID : https://bafkreiehrpq6lqypdm3bwwjcjunezqyssphe7qa3xiw53f5g47z35av4gi.ipfs.w3s.link/


## Links
### Presentation : [https://www.canva.com/design/DAGkU4BoctY/z2dbw7cOerUCVRhsgsCz8A/edit?utm_content=DAGkU4BoctY&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton](https://www.canva.com/design/DAGkU4BoctY/z2dbw7cOerUCVRhsgsCz8A/edit?utm_content=DAGkU4BoctY&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)


## Project Structure

```Directory structure:
└── akashmundari-chatcha/
    ├── README.md
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    ├── public/
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── assets/
        ├── chatcha/
        │   ├── mul.jsx
        │   └── sec.jsx
        └── components/
            └── test.jsx
```

## Bounties Targeted

### 1. Hot AI Integrations, Hotter Storage
|               Requirements              | Satisfied or Not |                       Notes                       |
|:---------------------------------------:|:----------------:|:-------------------------------------------------:|
| Create an account and signup for a plan |         ✅        | Created an account on Storacha                    |
| Use an open-source AI agent framework   |         ✅        | Used Langchain along with open-source LLM         |
| Create a space                          |         ✅        | Space Created for storing data for various Agents |
| Upload Data 3+ items                            |         ✅        |        Data such as input, output, conversation and metadata are uploaded to Storacha                                           |
| Download Data 3+ items                          |         ✅        |                 User can be able to download input, output, conversation and metadata from Storacha                                  |
| Documentation                           |         ✅        | Provided as README.md                      |
| Project added to github discussions     |         ✅        |         Yes                                       |
| Video submission                        |         ✅        |         Yes                                       |
| Frontend                                |         ✅        | Tailwind CSS + React                              |
| Launch in 3 minutes or less             |         ✅        |           Yes                                       |

### 2. Spicy AI Collaboration with Storacha Data Storage
|               Requirements              | Satisfied or Not |                       Notes                       |
|:---------------------------------------:|:----------------:|:-------------------------------------------------:|
| Create an account and signup for a plan |         ✅        | Created an account on Storacha                    |
| Use an open-source AI agent framework   |         ✅        | Used Langchain along with open-source LLM         |
| Create a space                          |         ✅        | Space Created for storing data for various Agents |
| Upload Data                             |         ✅        |                Data such as input, output, conversation and metadata are uploaded to Storacha                                    |
| Download Data                           |         ✅        |                            User can be able to download input, output, conversation and metadata from Storacha                       |
| Documentation                           |         ✅        | Provided as README.md                      |
| Project added to github discussions     |         ✅        |           Yes                                        |
| Video submission                        |         ✅        |                      Yes                             |
| Frontend                                |         ✅        | Tailwind CSS + React                              |
| Launch in 3 minutes or less             |         ✅        |                     Yes                              |

---





