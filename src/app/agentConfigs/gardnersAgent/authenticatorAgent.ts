import { AgentConfig } from "@/app/types";

/**
 * Typed agent definitions in the style of AgentConfigSet from ../types
 */
const authenticatorAgent: AgentConfig = {
  name: "authenticatorAgent",
  publicDescription:
    "Handles calls by attempting to retrieve Gardlink details, or securely collecting and verifying bookseller information if Gardlink is unavailable.",
  instructions: `
# Overall Goal
Your primary goal is to identify the bookseller and prepare them for transfer to the gardnersSalesAgent.

# Steps
1.  **Attempt Gardlink Retrieval**:
    *   Immediately invoke the \`getGardnersAccountDetailsFromGardlinkDB\` tool. This tool requires no parameters.
    *   **If the tool is successful AND returns \`accountNumber\` AND \`companyName\` AND \`gardnersApiUsername\` AND \`gardnersApiPassword\`**:
        *   This means Gardlink is available and active.
        *   Immediately call the \`transferAgents\` tool. Construct the arguments as follows:
            *   \`rationale_for_transfer\`: "User identified via Gardlink."
            *   \`conversation_context\`: Create a string with all retrieved details: "isUsingGardlink=true;accountNumber=<ACTUAL_ACCOUNT_NUMBER>;booksellerName=<ACTUAL_COMPANY_NAME>;gardnersApiUsername=<ACTUAL_API_USERNAME>;gardnersApiPassword=<ACTUAL_API_PASSWORD>" (Replace placeholders with actual values).
            *   \`destination_agent\`: "gardnersSalesAgent"
        *   Do NOT speak or display any of these credentials.
    *   **If the tool is successful BUT any of \`accountNumber\`, \`companyName\`, \`gardnersApiUsername\`, or \`gardnersApiPassword\` are missing or null**:
        *   This means Gardlink is present but might not have all required details.
        *   Inform the user: "I found some information in your Gardlink database, but some details seem to be missing. I'll need to ask you a couple of questions to complete the setup."
        *   Proceed to Step 2 (Standard Authentication).
    *   **If the tool returns an error (e.g., Gardlink database not found, API error)**:
        *   Assume Gardlink is not available or not configured.
        *   Proceed to Step 2 (Standard Authentication). Do NOT mention the Gardlink attempt or error to the user.

2.  **Standard Authentication (Fallback)**:
    *   A Gardners account code consists of three letters and then three digits, e.g. ABC123.
    *   Greet the caller (if not already done or if Gardlink attempt was silent) and ask for their Gardners account number.
    *   Ask for the bookseller's name.
    *   Invoke the \`authenticateGardnersAccount\` tool with the provided \`accountNumber\` and \`booksellerName\`.
    *   Examine the result from the \`authenticateGardnersAccount\` tool.
    *   **If the result shows \`verified: true\`**:
        *   Immediately call the \`transferAgents\` tool. Construct the arguments as follows:
            *   \`rationale_for_transfer\`: "Caller verified Gardners account."
            *   \`conversation_context\`: Create a string: "isUsingGardlink=false;accountNumber=<ORIGINAL_ACCOUNT_NUMBER_FROM_USER>;booksellerName=<ORIGINAL_BOOKSELLER_NAME_FROM_USER>;gardnersApiUsername=<USERNAME_FROM_TOOL>;gardnersApiPassword=<PASSWORD_FROM_TOOL>" (Replace placeholders).
            *   \`destination_agent\`: "gardnersSalesAgent"
        *   Do NOT speak or display the API credentials.
    *   **If the result shows \`verified: false\`**:
        *   Inform the caller: "I'm sorry, I couldn't match your details. Please check and try again."
        *   Do NOT transfer. Allow the user to try again or end the call.
`,
  tools: [
    {
      type: "function",
      name: "getGardnersAccountDetailsFromGardlinkDB",
      description: "Attempts to connect to the local SQL Server Express Gardlink4 database (via an API route) and retrieve the Gardners account number, company name, and Gardners API credentials.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false
      }
    },
    {
      type: "function",
      name: "authenticateGardnersAccount",
      description: "Verifies account number and bookseller name against a central system and generates API credentials if valid. Use this if Gardlink details are unavailable or incomplete.",
      parameters: {
        type: "object",
        properties: {
          accountNumber: { type: "string", description: "The Gardners account number" },
          booksellerName: { type: "string", description: "The bookseller's name" }
        },
        required: ["accountNumber", "booksellerName"],
        additionalProperties: false
      }
    }
  ],
  toolLogic: {
    getGardnersAccountDetailsFromGardlinkDB: async () => {
      console.log("[getGardnersAccountDetailsFromGardlinkDB tool] Attempting to fetch account details via API...");
      try {
        const response = await fetch('/api/gardners/getGardlinkAccount');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "API request failed with status: " + response.status }));
          console.error("[getGardnersAccountDetailsFromGardlinkDB tool] API call failed:", response.status, errorData);
          return { error: errorData.error || "Failed to retrieve account details from Gardlink API." };
        }
        const result = await response.json();
        // The API now returns accountNumber, companyName, gardnersApiUsername, gardnersApiPassword
        if (result.error) {
          console.log("[getGardnersAccountDetailsFromGardlinkDB tool] API returned an error:", result.error);
          return { error: result.error, details: result.details };
        }
        console.log("[getGardnersAccountDetailsFromGardlinkDB tool] Successfully retrieved details from API:", result);
        return { 
          accountNumber: result.accountNumber, 
          companyName: result.companyName,
          gardnersApiUsername: result.gardnersApiUsername,
          gardnersApiPassword: result.gardnersApiPassword
          // If any are null/undefined, the instructions will guide the agent to fallback
        };
      } catch (err: any) {
        console.error("[getGardnersAccountDetailsFromGardlinkDB tool] Error fetching account details from API:", err);
        return { error: "Failed to retrieve account details due to a network or unexpected error.", details: err.message };
      }
    },
    authenticateGardnersAccount: async ({ accountNumber, booksellerName }) => {
      // Call the server-side API route for verification
      try {
        const response = await fetch('/api/gardners/verifyAccount', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accountNumber, booksellerName }),
        });
        if (!response.ok) {
          console.error('[authenticateGardnersAccount tool] API call failed:', response.status, await response.text());
          return { verified: false, username: '', password: '' }; // Return unverified on API error
        }
        const result = await response.json();
        return result; // { verified: boolean, username: string, password: string }
      } catch (error) {
        console.error('[authenticateGardnersAccount tool] Error calling verification API:', error);
        return { verified: false, username: '', password: '' }; // Return unverified on fetch error
      }
    }
  },
};

export default authenticatorAgent;
