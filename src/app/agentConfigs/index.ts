import { AllAgentConfigsType } from "@/app/types";
import comedyBot from "./comedyBot";
import gardnersAgent from "./gardnersAgent";
import spoofCaller from "./spoofCaller";
import skynetCredits from "./skynetCredits";
import frontDeskAuthentication from "./frontDeskAuthentication";
import customerServiceRetail from "./customerServiceRetail";
import simpleExample from "./simpleExample";
import educationalTool from "./educationalTool";

export const allAgentSets: AllAgentConfigsType = {
  comedyBot, 
  gardnersAgent,
  spoofCaller, 
  skynetCredits,
  frontDeskAuthentication,
  customerServiceRetail,
  simpleExample,
  educationalTool,
};

export const defaultAgentSetKey = "gardnersAgent";
