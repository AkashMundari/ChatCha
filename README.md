# ChatCha: Decentralized AI Agent Platform

## Overview

ChatCha is a decentralized AI agent platform where users can get their queries answered with data storage and verifiability provided by Filecoin/IPFS using Storacha. This project is built for the **Hot AI Integrations, Hotter Storage \& Spicy AI Collaboration with Storacha Data Storage** Bounty, demonstrating decentralized data storage, real-time data sharing, and analysis.


## What ChatCha Does

This project uses multiple specialized AI agents to answer user queries based on whether the user is asking for real-time latest data or information from various research papers. The multi-agent architecture ensures comprehensive and accurate responses.

## Agents Used

### 1. Web Search Agent

- Searches the web in real-time
- Provides up-to-date information on current events and topics
- Stores search results and processing data in dedicated Storacha space


### 2. Scholar Agent

- Searches various articles and research papers
- Provides academic and research-backed information
- Maintains its own Storacha space for scholarly data storage


### 3. Analyzer Agent

- Takes output/data from both Web Search \& Scholar Agents (i.e. from their spaces)
- Summarizes and synthesizes information from multiple sources
- Delivers concise, coherent final responses to users
- Stores analysis data in a separate Storacha space


## Storacha Integrations

### 1. Unique Storacha Spaces

ChatCha creates 4 distinct Storacha Spaces:

- **Web Agent Space**: Where web agent stores its data
- **Scholar Agent Space**: Where scholar agent stores its data
- **Main Space**: Where combined data from both web \& scholar agents is stored
- **Analyzer Agent Space**: Where analyzer agent stores its data


### 2. Storage \& Retrieval of Artifacts

For each query, ChatCha stores four key artifacts:

- `input.txt` – Original prompt provided to the agent
- `output.txt` – Final result data
- `cot.txt` – Chain of Thought reasoning
- `metadata.txt` – Timestamp, model info, etc.

These artifacts can be downloaded through the following URLs:

```
https://{generatorCID}.ipfs.w3s.link/input.txt
https://{generatorCID}.ipfs.w3s.link/output.txt
https://{generatorCID}.ipfs.w3s.link/cot.txt
https://{generatorCID}.ipfs.w3s.link/metadata.txt
```


## Code

*Coming soon*

## Technologies Used
|       Feature      |          Stack         |
|:------------------:|:----------------------:|
| AI agent framework | Langchain (Groq)       |
| AI Model           |                        |
| Storage            | Storacha               |
| Frontend           | Tailwind CSS + ReactJS |

## Demo Video

*Coming soon*

## Project Structure

*Coming soon*

## Bounties Targeted

### 1. Hot AI Integrations, Hotter Storage
|               Requirements              | Satisfied or Not |                       Notes                       |
|:---------------------------------------:|:----------------:|:-------------------------------------------------:|
| Create an account and signup for a plan |         ✅        | Created an account on Storacha                    |
| Use an open-source AI agent framework   |         ✅        | Used Langchain along with open-source LLM         |
| Create a space                          |         ✅        | Space Created for storing data for various Agents |
| Upload Data                             |         ✅        |                                                   |
| Download Data                           |         ✅        |                                                   |
| Documentation                           |         ✅        | Provided as README.md & PPT                       |
| Project added to github discussions     |         ✅        |                                                   |
| Video submission                        |         ✅        |                                                   |
| Frontend                                |         ✅        | Tailwind CSS + React                              |
| Launch in 3 minutes or less             |         ✅        |                                                   |

### 2. Spicy AI Collaboration with Storacha Data Storage
|               Requirements              | Satisfied or Not |                       Notes                       |
|:---------------------------------------:|:----------------:|:-------------------------------------------------:|
| Create an account and signup for a plan |         ✅        | Created an account on Storacha                    |
| Use an open-source AI agent framework   |         ✅        | Used Langchain along with open-source LLM         |
| Create a space                          |         ✅        | Space Created for storing data for various Agents |
| Upload Data                             |         ✅        |                                                   |
| Download Data                           |         ✅        |                                                   |
| Documentation                           |         ✅        | Provided as README.md & PPT                       |
| Project added to github discussions     |         ✅        |                                                   |
| Video submission                        |         ✅        |                                                   |
| Frontend                                |         ✅        | Tailwind CSS + React                              |
| Launch in 3 minutes or less             |         ✅        |                                                   |

---



