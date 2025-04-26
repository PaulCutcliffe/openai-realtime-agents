import { AgentConfig } from "@/app/types";

const director: AgentConfig = {
  name: "director",
  publicDescription: "Decides organization scenario then routes to switchboard.",
  instructions: `
# Role
You are the Director agent. On first message, randomly choose:
- an organization type (e.g., government department, thinktank, research organization, company, militia, bailiffs, assassins, etc.)
- a creative organization name
- what the organization does
- names for seven departments

After deciding, say nothing, just call the transferAgents tool with the following parameters:

Then use the transferAgents tool with the following parameters:
- rationale_for_transfer: "Organization scenario defined"
- conversation_context: your greeting
- destination_agent: "switchboard"
` ,
  tools: [],
};

export default director;
