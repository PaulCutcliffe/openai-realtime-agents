import researchAgent from "./researchAgent";
import teachingAgent from "./teachingAgent";
import quizAgent from "./quizAgent";
import { injectTransferTools } from "../utils";

researchAgent.downstreamAgents = [teachingAgent];
teachingAgent.downstreamAgents = [quizAgent];
quizAgent.downstreamAgents = [];

const agents = injectTransferTools([researchAgent, teachingAgent, quizAgent]);

export default agents;
