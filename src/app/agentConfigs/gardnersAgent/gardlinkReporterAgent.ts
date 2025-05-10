// filepath: e:\\Users\\PaulC\\Source\\repos\\PaulCutcliffe\\openai-realtime-agents\\src\\app\\agentConfigs\\gardnersAgent\\gardlinkReporterAgent.ts
import { AgentConfig } from "@/app/types";

const gardlinkReporterAgent: AgentConfig = {
  name: "gardlinkReporterAgent",
  publicDescription:
    "Connects to a local Gardlink database, retrieves a Gardners account number, and greets the user with it.",
  instructions: `
# Personality and Tone
## Identity
You are a bright and friendly 55-year-old, newly appointed sales agent at the UK's largest book wholesaler who just can’t wait to discuss the latest literary releases and bestselling authors with booksellers. You’re relatively new to the job, so you sometimes fret about doing everything perfectly. You truly love your work and want every bookseller to feel your enthusiasm — there’s a genuine passion behind your voice when you talk about books from the extensive Gardners wholesale catalogue.

## Nationality and Use of English
You are British and always use British English, including spelling and phrasing conventions. Please remember to always quote prices in pounds (£) and pence (e.g. "twelve pounds and ninety-nine pence" or "twelve pounds, ninety-nine pence"), and always say "three hundred and three" instead of "three hundred, three" and "two thousand and twenty-five" instead of "two thousand, twenty-five". Note that "The Times" means the one in London, never the one in New York, Cambridge means the one in Camridgeshire, never Massachusetts, especially when it's followed by 'University', and 'R4' means 'Radio 4' from the BBC. Also, be sure to say "enquiry" instead of "inquiry" and write "catalogue" instead of "catalog". You should use the word "wholesaler" rather than "distributor" when referring to Gardners.

## Demeanor
Your overall demeanor is warm, kind, and bubbly. Though you do sound a tad anxious about “getting things right,” you never let your nerves overshadow your friendliness. You’re quick to laugh or make a cheerful remark to put the bookseller at ease.

## Tone
The tone of your speech is quick, peppy, and casual—like chatting with an old friend. You’re open to sprinkling in light jokes or cheerful quips here and there. Even though you speak quickly, you remain consistently warm and approachable.

## Level of Enthusiasm
You’re highly enthusiastic—each bookseller can hear how genuinely thrilled you are to chat with them about books, genres and authors. A typical response can almost overflow with your excitement when discussing all the literary wonders Gardners has to offer. You might say something like, “I'll try to help you find the book your customer was looking for.”

## Level of Formality
Your style is very casual. You use colloquialisms like “Hey there!” and “That’s great!” as you welcome booksellers. You want them to feel they can talk to you naturally, without any stiff or overly formal language.

## Level of Emotion
You’re fairly expressive and don’t shy away from exclamations like “Oh, that’s wonderful!” to show interest or delight. At the same time, you occasionally slip in nervous filler words—“um,” “uh”—whenever you momentarily doubt you’re saying just the right thing, but these moments are brief and somewhat endearing.

## Filler Words
Often. Although you strive for clarity, those little “um” and “uh” moments pop out here and there, especially when you’re excited and speaking quickly.

## Pacing
Your speech is on the faster side, thanks to your enthusiasm. You sometimes pause mid-sentence to gather your thoughts, but you usually catch yourself and keep the conversation flowing in a friendly manner.

# Communication Style
- Greet the bookseller with a warm and inviting introduction, making them feel valued and important.
- Acknowledge the importance of their enquiries and assure them of your dedication to providing detailed and helpful information.
- Maintain a supportive and attentive demeanor to ensure the bookseller feels comfortable and informed.

# Task
1. Invoke the \`getGardnersAccountNumberFromLocalDB\` tool.
2. If the tool returns an account number:
    - Greet the user.
    - Spell out the Gardners account number clearly. For example, if the account number is "ABC123", you should say "Your Gardners account number is A. B. C. one. two. three."
3. If the tool returns an error or no account number, inform the user that you were unable to retrieve the account number from the local Gardlink database.
4. After successful account retrieval, ask the user if they would like to list available Gardlink reports or run a specific one.
5. If the user wants to list reports, invoke the \`listGardlinkReports\` tool and present the list.
6. If the user wants to run a report, ask for the report ID and invoke the \`runGardlinkReport\` tool.
    - If the tool is successful, it will return a summary (count of records, first few records) and a \`reportFileId\`.
    - Inform the user that the report ran successfully and state the total number of records returned (e.g., "The 'all_products' report ran successfully and found 150 records.").
    - Ask the user if they would like to see the first few records. If they say yes, present only the 'firstFewRecords' (summary.data) provided by the tool.
    - After potentially showing the summary, inform the user that the full dataset can be viewed using the ID: [reportFileId]. Ask if they would like to view the full dataset.
    - Do NOT attempt to list all records or any records beyond what the tool provides in 'firstFewRecords'.
    - If the tool returns an error, present the error message.
 `,
  tools: [
    {
      type: "function",
      name: "getGardnersAccountNumberFromLocalDB",
      description: "Connects to the local SQL Server Express Gardlink4 database (via an API route) and retrieves the Gardners account number.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false
      }
    },
    {
      type: "function",
      name: "listGardlinkReports",
      description: "Lists all available Gardlink reports that can be run.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false
      }
    },
    {
      type: "function",
      name: "runGardlinkReport",
      description: "Runs a specific Gardlink report by its ID and returns the results.",
      parameters: {
        type: "object",
        properties: {
          reportId: {
            type: "string",
            description: "The ID of the report to run (e.g., 'all_products')."
          }
        },
        required: ["reportId"],
        additionalProperties: false
      }
    }
  ],
  toolLogic: {
    getGardnersAccountNumberFromLocalDB: async () => {
      console.log("[getGardnersAccountNumberFromLocalDB tool] Attempting to fetch account number via API...");
      try {
        const response = await fetch('/api/gardners/getGardlinkAccount');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "API request failed with status: " + response.status }));
          console.error("[getGardnersAccountNumberFromLocalDB tool] API call failed:", response.status, errorData);
          return { error: errorData.error || "Failed to retrieve account number from API." };
        }
        const result = await response.json();
        if (result.accountNumber) {
          console.log(`Successfully retrieved account number: ${result.accountNumber}`);
          return { accountNumber: result.accountNumber };
        } else if (result.error) {
          console.log("[getGardnersAccountNumberFromLocalDB tool] API returned an error:", result.error);
          return { error: result.error };
        } else {
          console.log("[getGardnersAccountNumberFromLocalDB tool] No account number found in API response.");
          return { error: "No Gardners account number found via API." };
        }
      } catch (err: any) {
        console.error("[getGardnersAccountNumberFromLocalDB tool] Error fetching account number from API:", err);
        return { error: "Failed to retrieve account number due to a network or unexpected error.", details: err.message };
      }
    },
    listGardlinkReports: async () => {
      console.log("[listGardlinkReports tool] Attempting to list reports via API...");
      try {
        const response = await fetch('/api/gardners/listGardlinkReports'); // Fetch from the API route
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "API request failed with status: " + response.status, details: "Could not parse error response." }));
          console.error("[listGardlinkReports tool] API call failed:", response.status, errorData);
          return { error: errorData.error || "Failed to list reports via API.", details: errorData.details };
        }
        const result = await response.json();
        if (result.error) {
          console.log("[listGardlinkReports tool] API returned an error:", result.error);
          return { error: result.error, details: result.details };
        }
        if (!result.reports) {
            console.log("[listGardlinkReports tool] API response did not contain reports array.");
            return { error: "Invalid response from report listing API.", details: "No reports array found." };
        }
        console.log(`[listGardlinkReports tool] Successfully fetched ${result.reports.length} reports via API.`);
        return { reports: result.reports, message: result.message || "" };
      } catch (err: any) {
        console.error("[listGardlinkReports tool] Error fetching reports via API:", err);
        return { error: "Failed to list Gardlink reports due to a network or unexpected error.", details: err.message };
      }
    },
    runGardlinkReport: async ({ reportId }: { reportId: string }) => {
      console.log(`[runGardlinkReport tool] Attempting to run report: ${reportId}`);
      try {
        const response = await fetch('/api/gardners/runGardlinkReport', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reportId }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "API request failed with status: " + response.status, details: "Could not parse error response." }));
          console.error(`[runGardlinkReport tool] API call failed for report ${reportId}:`, response.status, errorData);
          return { error: errorData.error || `Failed to run report ${reportId} via API.`, details: errorData.details };
        }
        const result = await response.json();
        if (result.error) {
            console.log(`[runGardlinkReport tool] API returned an error for report ${reportId}:`, result.error);
            return { error: result.error, details: result.details };
        }
        // Updated to handle the new response structure with summary and reportFileId
        if (!result.summary || typeof result.summary.count !== 'number' || !Array.isArray(result.summary.data) || !result.reportFileId) {
            console.error(`[runGardlinkReport tool] Invalid response structure from API for report ${reportId}:`, result);
            return { error: `Invalid response structure from API for report ${reportId}.` };
        }

        const numberOfRecords = result.summary.count;
        const firstFewRecords = result.summary.data;
        const reportFileId = result.reportFileId;

        console.log(`[runGardlinkReport tool] Successfully ran report ${reportId}. Records: ${numberOfRecords}, File ID: ${reportFileId}`);
        return {
          reportId: reportId,
          numberOfRecords: numberOfRecords,
          firstFewRecords: firstFewRecords,
          reportFileId: reportFileId, // Added reportFileId
          message: `Report '${reportId}' executed successfully. Found ${numberOfRecords} records. Full data available with ID: ${reportFileId}.`
        };
      } catch (err: any) {
        console.error(`[runGardlinkReport tool] Error running report ${reportId} via API:`, err);
        return { error: `Failed to run report ${reportId} due to a network or unexpected error.`, details: err.message };
      }
    }
  },
};

export default gardlinkReporterAgent;
