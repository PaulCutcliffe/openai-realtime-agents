import authenticationAgent from "./authentication";
import salesAgent from "./salesAgent";
import { injectTransferTools } from '../utils';

authenticationAgent.downstreamAgents = [salesAgent]
salesAgent.downstreamAgents = [authenticationAgent]

const agents = injectTransferTools([authenticationAgent, salesAgent]);

export default agents;