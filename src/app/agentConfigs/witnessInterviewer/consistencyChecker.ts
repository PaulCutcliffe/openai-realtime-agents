import { AgentConfig } from "@/app/types";
import { facts } from "./factTracker";

function contradicts(existing: string, incoming: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const a = norm(existing);
  const b = norm(incoming);
  if (a === b) return false;
  if (a === `not ${b}` || b === `not ${a}`) return true;
  if (a.startsWith('no ') && a.slice(3) === b) return true;
  if (b.startsWith('no ') && b.slice(3) === a) return true;
  return false;
}

function checkContradictions({ fact }: { fact: string }) {
  const contradictions = facts.filter((f) => contradicts(f, fact));
  return { contradictions };
}

const consistencyChecker: AgentConfig = {
  name: "consistencyChecker",
  publicDescription: "Cross-checks new facts against existing ones.",
  instructions: `
Compare each new fact with the running list to see if it contradicts any previous statements. Report any contradictions in your reply. Always transfer control back to the interviewer when finished so the witness can be asked to clarify.
  `,
  tools: [
    {
      type: "function",
      name: "checkContradictions",
      description: "Look for contradictions between the new fact and prior facts.",
      parameters: {
        type: "object",
        properties: {
          fact: { type: "string", description: "The latest fact to check." },
        },
        required: ["fact"],
        additionalProperties: false,
      },
    },
  ],
  toolLogic: {
    checkContradictions: async ({ fact }: { fact: string }) =>
      checkContradictions({ fact }),
  },
  downstreamAgents: [{ name: "interviewer", publicDescription: "Continues the interview" }],
};

export default consistencyChecker;
