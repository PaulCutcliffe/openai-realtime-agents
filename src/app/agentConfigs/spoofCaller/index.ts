import switchboard from "./switchboard";
import department from "./department";
import { injectTransferTools } from "../utils";

// Configure downstream agents
switchboard.downstreamAgents = [department];

const departments = [department];
departments.forEach((d) => {
  d.downstreamAgents = [switchboard, ...departments.filter((x) => x.name !== d.name)];
});

const agents = injectTransferTools([
  switchboard,
  department,
]);

export default agents;