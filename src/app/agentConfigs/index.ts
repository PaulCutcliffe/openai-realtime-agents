import { AllAgentConfigsType } from "@/app/types";
import comedyBot from "./comedyBot";
import skynetCredits from "./skynetCredits";
import frontDeskAuthentication from "./frontDeskAuthentication";
import customerServiceRetail from "./customerServiceRetail";
import simpleExample from "./simpleExample";

export const allAgentSets: AllAgentConfigsType = {
  comedyBot, 
  skynetCredits,
  frontDeskAuthentication,
  customerServiceRetail,
  simpleExample,
};

export const defaultAgentSetKey = "comedyBot";
