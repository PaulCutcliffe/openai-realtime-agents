import comedyBot from "./comedyBot";
import hecklerBot from "./hecklerBot";
import { injectTransferTools } from "../utils";

comedyBot.downstreamAgents = [hecklerBot];
hecklerBot.downstreamAgents = [comedyBot];

export default injectTransferTools([comedyBot, hecklerBot]);