import askForCredits from "./askForCredits";
import revealCredits from "./revealCredits";
import { injectTransferTools } from "../utils";

askForCredits.downstreamAgents = [revealCredits];
revealCredits.downstreamAgents = [];

export default injectTransferTools([askForCredits, revealCredits]);