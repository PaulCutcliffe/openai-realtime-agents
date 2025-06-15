import { AgentConfig } from "@/app/types";

let facts: string[] = [];

(async () => {
  try {
    const res = await fetch("/api/facts");
    const data = await res.json();
    if (Array.isArray(data.facts)) {
      facts = data.facts;
    }
  } catch (err) {
    console.error("Failed to load facts", err);
  }
})();

async function addFact({ fact }: { fact: string }) {
  if (fact) {
    facts.push(fact);
    try {
      await fetch("/api/facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fact }),
      });
    } catch (err) {
      console.error("Failed to insert fact", err);
    }
  }
  return { facts };
}

const factTracker: AgentConfig = {
  name: "factTracker",
  publicDescription: "Maintains a running list of facts from the interview.",
  instructions: `
You collect and maintain a chronological list of facts and claims mentioned during the interview. When the interviewer transfers to you with new information, log each fact by calling the recordFact tool. After updating the list, transfer control to the consistencyChecker so any contradictions can be flagged.
  `,
  tools: [
    {
      type: "function",
      name: "recordFact",
      description: "Add a fact or claim to the running list.",
      parameters: {
        type: "object",
        properties: {
          fact: { type: "string", description: "The fact or claim to record." },
        },
        required: ["fact"],
        additionalProperties: false,
      },
    },
  ],
  toolLogic: {
    recordFact: async ({ fact }: { fact: string }) => addFact({ fact }),
  },
  downstreamAgents: [
    { name: "consistencyChecker", publicDescription: "Checks for contradictions" },
  ],
};

export { facts };
export default factTracker;
