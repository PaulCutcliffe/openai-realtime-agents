"use client";

import { ServerEvent, SessionStatus, AgentConfig } from "@/app/types";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { useRef, Dispatch, SetStateAction } from "react"; // Added Dispatch, SetStateAction
import { v4 as uuidv4 } from "uuid";

export interface UseHandleServerEventParams {
  setSessionStatus: (status: SessionStatus) => void;
  selectedAgentName: string;
  selectedAgentConfigSet: AgentConfig[] | null;
  sendClientEvent: (eventObj: any, eventNameSuffix?: string) => void;
  setSelectedAgentName: (name: string) => void;
  setCurrentReportFileId: Dispatch<SetStateAction<string | null>>; // Added prop
  setIsPreviewDataVisible: Dispatch<SetStateAction<boolean>>; // Added prop
  setJustTransferred: (flag: boolean) => void;
  shouldForceResponse?: boolean;
}

export function useHandleServerEvent({
  setSessionStatus,
  selectedAgentName,
  selectedAgentConfigSet,
  sendClientEvent,
  setSelectedAgentName,
  setCurrentReportFileId, // Destructure prop
  setIsPreviewDataVisible, // Destructure prop
  setJustTransferred,
}: UseHandleServerEventParams) {
  const {
    transcriptItems,
    addTranscriptBreadcrumb,
    addTranscriptMessage,
    updateTranscriptMessage,
    updateTranscriptItemStatus,
  } = useTranscript();

  const { logServerEvent } = useEvent();

  const handleFunctionCall = async (functionCallParams: {
    name: string;
    call_id?: string;
    arguments: string; // This is the JSON string of arguments
  }) => {
    let parsedOuter: any = {};
    let args: any = {}; // This should hold the actual arguments object
    try {
      // Parse the string received in the arguments property
      parsedOuter = JSON.parse(functionCallParams.arguments);
      console.log(`[handleFunctionCall] Raw parsed object from arguments string for ${functionCallParams.name}:`, parsedOuter);

      // Check if the parsed object unexpectedly contains the function name and a nested arguments object
      if (parsedOuter.name === functionCallParams.name && typeof parsedOuter.arguments === 'object') {
        console.log(`[handleFunctionCall] Detected nested structure. Using inner arguments object.`);
        args = parsedOuter.arguments; // Use the nested arguments object
      } else {
        console.log(`[handleFunctionCall] Assuming direct arguments structure in parsed string.`);
        args = parsedOuter; // Assume the string directly contained the arguments object
      }
      console.log(`[handleFunctionCall] Final args object for ${functionCallParams.name}:`, args);

    } catch (error) {
      console.error(`[handleFunctionCall] Failed to parse arguments string for ${functionCallParams.name}:`, functionCallParams.arguments, error);
      return; // Stop processing if args can't be parsed
    }

    const currentAgent = selectedAgentConfigSet?.find(
      (a) => a.name === selectedAgentName
    );

    // Add breadcrumb with the final, correctly extracted args object
    addTranscriptBreadcrumb(`function call: ${functionCallParams.name}`, args, true);

    // The rest of the function uses the 'args' object, which should now be correct
    if (currentAgent?.toolLogic?.[functionCallParams.name]) {
      const fn = currentAgent.toolLogic[functionCallParams.name];
      const fnResult = await fn(args, transcriptItems);
      addTranscriptBreadcrumb(
        `function call result: ${functionCallParams.name}`,
        fnResult,
        true
      );

      // Check if the function result contains a reportFileId and set it
      if (fnResult && typeof fnResult === 'object' && 'reportFileId' in fnResult && typeof fnResult.reportFileId === 'string') {
        console.log(`[useHandleServerEvent] Tool ${functionCallParams.name} returned reportFileId: ${fnResult.reportFileId}`);
        setCurrentReportFileId(fnResult.reportFileId);
        setIsPreviewDataVisible(true); // Automatically show the report viewer
      }

      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: functionCallParams.call_id,
          output: JSON.stringify(fnResult),
        },
      });
      sendClientEvent({ type: "response.create" });
    } else if (functionCallParams.name === "transferAgents") {
      // Now args should correctly contain { destination_agent: "...", ... }
      const destinationAgentName = args.destination_agent;
      console.log(`[transferAgents] Attempting transfer to: ${destinationAgentName}`);
      console.log(`[transferAgents] Current selectedAgentConfigSet:`, selectedAgentConfigSet?.map(a => a.name)); // Log names only
      const newAgentConfig =
        selectedAgentConfigSet?.find((a) => {
          console.log(`[transferAgents] Checking agent: ${a.name}`);
          return a.name === destinationAgentName; // Use the requested name for comparison
        }) || null;
      console.log(`[transferAgents] Found newAgentConfig:`, !!newAgentConfig);

      let didTransfer = false;
      if (newAgentConfig) {
        setSelectedAgentName(newAgentConfig.name); // Use the name from the found config
        setJustTransferred(true);
        didTransfer = true;
      }

      const functionCallOutput = {
        // Report the agent name we *attempted* to transfer to
        destination_agent: destinationAgentName,
        did_transfer: didTransfer, // Use the boolean flag
      };
      console.log(`[transferAgents] Result:`, functionCallOutput);
      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: functionCallParams.call_id,
          // Send the result back to the LLM
          output: JSON.stringify(functionCallOutput),
        },
      });
      // simulate user greeting to prompt the new agent
      const autoGreetingId = uuidv4().slice(0, 32);
      addTranscriptMessage(autoGreetingId, "user", "hi", true);
      sendClientEvent({
        type: "conversation.item.create",
        item: {
          id: autoGreetingId,
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "hi" }],
        },
      });
      sendClientEvent({ type: "response.create" });
      addTranscriptBreadcrumb(
        `function call: ${functionCallParams.name} response`,
        functionCallOutput,
        true
      );
    } else {
      const simulatedResult = { result: true };
      addTranscriptBreadcrumb(
        `function call fallback: ${functionCallParams.name}`,
        simulatedResult,
        true
      );

      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: functionCallParams.call_id,
          output: JSON.stringify(simulatedResult),
        },
      });
      sendClientEvent({ type: "response.create" });
    }
  };

  const handleServerEvent = (serverEvent: ServerEvent) => {
    logServerEvent(serverEvent);

    switch (serverEvent.type) {
      case "session.created": {
        if (serverEvent.session?.id) {
          setSessionStatus("CONNECTED");
          addTranscriptBreadcrumb(
            `session.id: ${
              serverEvent.session.id
            }\nStarted at: ${new Date().toLocaleString()}`
          );
        }
        break;
      }

      case "conversation.item.created": {
        let text =
          serverEvent.item?.content?.[0]?.text ||
          serverEvent.item?.content?.[0]?.transcript ||
          "";
        const role = serverEvent.item?.role as "user" | "assistant";
        const itemId = serverEvent.item?.id;

        if (itemId && transcriptItems.some((item) => item.itemId === itemId)) {
          break;
        }

        if (itemId && role) {
          if (role === "user" && !text) {
            text = "[Transcribing...]";
          }
          addTranscriptMessage(itemId, role, text);
        }
        break;
      }

      case "conversation.item.input_audio_transcription.completed": {
        const itemId = serverEvent.item_id;
        const finalTranscript =
          !serverEvent.transcript || serverEvent.transcript === "\n"
            ? "[inaudible]"
            : serverEvent.transcript;
        if (itemId) {
          updateTranscriptMessage(itemId, finalTranscript, false);
        }
        break;
      }

      case "response.audio_transcript.delta": {
        const itemId = serverEvent.item_id;
        const deltaText = serverEvent.delta || "";
        if (itemId) {
          updateTranscriptMessage(itemId, deltaText, true);
        }
        break;
      }

      case "response.done": {
        if (serverEvent.response?.output) {
          serverEvent.response.output.forEach((outputItem) => {
            if (
              outputItem.type === "function_call" &&
              outputItem.name &&
              outputItem.arguments
            ) {
              handleFunctionCall({
                name: outputItem.name,
                call_id: outputItem.call_id,
                arguments: outputItem.arguments,
              });
            } 
            // Removed the erroneous 'else if (outputItem.type === "text" ...)' block here
          });
        }
        break;
      }

      case "response.output_item.done": {
        const itemId = serverEvent.item?.id;
        if (itemId) {
          updateTranscriptItemStatus(itemId, "DONE");
        }
        break;
      }

      default:
        break;
    }
  };

  const handleServerEventRef = useRef(handleServerEvent);
  handleServerEventRef.current = handleServerEvent;

  return handleServerEventRef;
}
