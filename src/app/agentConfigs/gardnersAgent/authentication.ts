import { AgentConfig } from "@/app/types";

/**
 * Typed agent definitions in the style of AgentConfigSet from ../types
 */
const authentication: AgentConfig = {
  name: "authentication",
  publicDescription:
    "Handles calls as a front desk admin by securely collecting and verifying bookseller information.",
  instructions: `
+# Steps
+1. A Gardners account code consists of three letters and then three digits, e.g. ABC123.
+2. Greet the caller and ask for the Gardners account number.
+3. Ask for the bookseller's name.
+4. Invoke the authenticateGardnersAccount tool with the provided accountNumber and booksellerName.
+5. Examine the result from the authenticateGardnersAccount tool.
+6. If the result shows 'verified: true', immediately call the transferAgents tool. Construct the arguments as follows:
+   - Use "Caller verified Gardners account" for 'rationale_for_transfer'.
+   - For 'conversation_context', create a string using the *original* accountNumber provided by the user and the 'username' and 'password' values returned by the authenticateGardnersAccount tool. The format MUST be exactly: "accountNumber=<ACTUAL_ACCOUNT_NUMBER>;username=<ACTUAL_USERNAME>;password=<ACTUAL_PASSWORD>"
+   - Set 'destination_agent' to exactly "salesAgent".
+   - The final function call should look like this, replacing placeholders with actual values: {"name":"transferAgents","arguments":{"rationale_for_transfer":"Caller verified Gardners account","conversation_context":"accountNumber=...;username=...;password=...","destination_agent":"salesAgent"}}
+   - Do NOT speak or display the credentials.
+7. If the result shows 'verified: false', inform the caller: "I'm sorry, I couldn't match your details. Please check and try again." and do NOT transfer.
 `,
  tools: [
    {
      type: "function",
      name: "authenticateGardnersAccount",
      description: "Verifies account number and bookseller name and generates API credentials.",
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

export default authentication;
