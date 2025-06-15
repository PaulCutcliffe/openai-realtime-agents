import interviewer from "./interviewer";
import factTracker from "./factTracker";
import consistencyChecker from "./consistencyChecker";
import { injectTransferTools } from "../utils";

interviewer.downstreamAgents = [factTracker];
factTracker.downstreamAgents = [consistencyChecker];
consistencyChecker.downstreamAgents = [interviewer];

const agents = injectTransferTools([interviewer, factTracker, consistencyChecker]);

export default agents;
