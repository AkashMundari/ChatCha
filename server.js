// server.js
import express from "express";
import cors from "cors";
import * as DID from "@ipld/dag-ucan/did";
import { create } from "@web3-storage/w3up-client";
import { Buffer } from "buffer";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import { Delegation } from "@ucanto/core/delegation";
import { CAR } from "@ucanto/transport";

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
// app.use(json());

// Global state
let storachaClient = null;
let spaces = [];

// Initialize Storacha client and spaces
async function initializeStoracha() {
  try {
    console.log("Initializing Storacha client...");

    const store = new StoreMemory();
    storachaClient = await create({ store });

    // Administrator login (happens once on the server)
    const account = await storachaClient.login("avularamswaroop@gmail.com");
    console.log("Login successful");

    // Claim delegations
    const delegations = await storachaClient.capability.access.claim();
    console.log("Claimed delegations", delegations);

    // Get available spaces
    spaces = await storachaClient.spaces();
    console.log(`Found ${spaces.length} spaces`);

    // Create spaces if we don't have at least 2
    if (spaces.length < 2) {
      console.log("Creating additional spaces...");

      if (spaces.length === 0) {
        const space1 = await storachaClient.createSpace(
          "initial-response-space",
          {
            account,
            skipGatewayAuthorization: true,
          }
        );
        spaces.push(space1);
      }

      const space2 = await storachaClient.createSpace("analysis-space");
      spaces.push(space2);

      console.log("Spaces created successfully");
    }

    return true;
  } catch (error) {
    console.error("Storacha initialization error:", error);
    return false;
  }
}

// // Create delegation for a client agent
// async function createDelegation(spaceIndex, agentDid) {
//   try {
//     // Select space and set as current
//     const space = spaces[spaceIndex];
//     await storachaClient.setCurrentSpace(space.did());

//     // Create delegation with specific capabilities
//     const abilities = ["space/blob/add", "upload/add"];
//     const expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours

//     const delegation = await storachaClient.createDelegation(
//       agentDid,
//       abilities,
//       { expiration }
//     );

//     // Archive for transport
//     const archive = await delegation.archive();
//     return archive.ok;
//   } catch (error) {
//     console.error(`Error creating delegation for space ${spaceIndex}:`, error);
//     throw error;
//   }
// }
async function createDelegation(spaceIndex, agentDid) {
  try {
    // Select space and set as current
    const space = spaces[spaceIndex];
    await storachaClient.setCurrentSpace(space.did());

    // Parse the agent DID string into a proper DID object
    const audience = DID.parse(agentDid);

    // Create delegation with specific capabilities
    const abilities = ["space/blob/add", "upload/add"];
    const expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours

    const delegation = await storachaClient.createDelegation(
      audience,
      abilities,
      { expiration }
    );

    // Archive for transport
    const archive = await delegation.archive();
    return archive.ok;
  } catch (error) {
    console.error(`Error creating delegation for space ${spaceIndex}:`, error);
    throw error;
  }
}
// Initialize on startup
(async () => {
  await initializeStoracha();
})();

// API Routes

// Delegation endpoint for Initial Response Agent
app.get("/api/delegation/initial-response/:agentDid", async (req, res) => {
  try {
    const { agentDid } = req.params;
    console.log(`Delegation requested for Initial Response Agent: ${agentDid}`);

    const delegation = await createDelegation(0, agentDid);
    res.set("Content-Type", "application/octet-stream");
    res.send(Buffer.from(delegation));
  } catch (error) {
    console.error("Delegation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delegation endpoint for Analysis Agent
app.get("/api/delegation/analysis/:agentDid", async (req, res) => {
  try {
    const { agentDid } = req.params;
    console.log(`Delegation requested for Analysis Agent: ${agentDid}`);

    const delegation = await createDelegation(1, agentDid);
    res.set("Content-Type", "application/octet-stream");
    res.send(Buffer.from(delegation));
  } catch (error) {
    console.error("Delegation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
