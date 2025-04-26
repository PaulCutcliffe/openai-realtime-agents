import { AllAgentConfigsType } from "@/app/types";
import spoofCaller from "./spoofCaller";
import comedyBot from "./comedyBot";
import skynetCredits from "./skynetCredits";
import frontDeskAuthentication from "./frontDeskAuthentication";
import customerServiceRetail from "./customerServiceRetail";
import simpleExample from "./simpleExample";

export const allAgentSets: AllAgentConfigsType = {
  spoofCaller, 
  comedyBot, 
  skynetCredits,
  frontDeskAuthentication,
  customerServiceRetail,
  simpleExample,
};

export const defaultAgentSetKey = "spoofCaller";
