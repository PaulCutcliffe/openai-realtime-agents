import switchboard from "./switchboard";
import department from "./department";
import { injectTransferTools } from "../utils";

// Configure downstream agents
switchboard.downstreamAgents = [department];

// Only one department agent now: it can route to itself repeatedly
department.downstreamAgents = [department];

const agents = injectTransferTools([
  switchboard,
  department,
]);

export default agents;