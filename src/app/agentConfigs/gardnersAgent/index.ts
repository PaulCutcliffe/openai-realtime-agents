import authenticationAgent from "./authenticatorAgent";
import gardnersSalesAgent from "./salesAgent";
import { injectTransferTools } from '../utils';

authenticationAgent.downstreamAgents = [gardnersSalesAgent]
gardnersSalesAgent.downstreamAgents = [authenticationAgent]

const agents = injectTransferTools([authenticationAgent, gardnersSalesAgent]);

export default agents;