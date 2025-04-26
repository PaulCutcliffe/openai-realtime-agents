import director from "./director";
import switchboard from "./switchboard";
import dept1 from "./dept1";
import dept2 from "./dept2";
import dept3 from "./dept3";
import dept4 from "./dept4";
import dept5 from "./dept5";
import dept6 from "./dept6";
import dept7 from "./dept7";
import { injectTransferTools } from "../utils";

// Configure downstream agents
director.downstreamAgents = [switchboard];
switchboard.downstreamAgents = [dept1, dept2, dept3, dept4, dept5, dept6, dept7];

const departments = [dept1, dept2, dept3, dept4, dept5, dept6, dept7];
departments.forEach((d) => {
  d.downstreamAgents = [switchboard, ...departments.filter((x) => x.name !== d.name)];
});

const agents = injectTransferTools([
  director,
  switchboard,
  dept1,
  dept2,
  dept3,
  dept4,
  dept5,
  dept6,
  dept7,
]);

export default agents;