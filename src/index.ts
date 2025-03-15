import { GoogleGenerativeAI } from "@google/generative-ai";
import * as core from "@actions/core";
import { z } from "zod";
import { uploadFile } from "./file-upload.js";
import { systemInstruction } from "./constant.js";

const inputSchema = z.object({
  token: z.string(),
  model: z.string(),
  systemPrompt: z.string().optional().catch(undefined),
  prompt: z.string(),
  temperature: z.coerce.number().optional().catch(undefined),
  topP: z.coerce.number().optional().catch(undefined),
  topK: z.coerce.number().optional().catch(undefined),
  maxOutputTokens: z.coerce.number().optional().catch(undefined),
  responseMime: z.coerce.string().optional().catch(undefined),
  filePath: z.string().optional(),
  fileMime: z.string().optional(),
  displayName: z.string().optional(),
});
const ghInput = {
  token: core.getInput("token"),
  model: core.getInput("model"),
  systemPrompt: core.getInput("system-prompt"),
  prompt: core.getInput("prompt"),
  temperature: core.getInput("temperature"),
  topP: core.getInput("topP"),
  topK: core.getInput("topK"),
  maxOutputTokens: core.getInput("maxOutputTokens"),
  responseMime: core.getInput("responseMime"),
  filePath: core.getInput("file-path"),
  fileMime: core.getInput("file-mime"),
  displayName: core.getInput("file-display-name"),
};

const input = inputSchema.parse(ghInput);
core.debug(`input: ${JSON.stringify(input)}`);
const genAI = new GoogleGenerativeAI(input.token);

const model = genAI.getGenerativeModel({ model: input.model });

const generationConfig = {
  temperature: input.temperature,
  topP: input.topP,
  topK: input.topK,
  maxOutputTokens: input.maxOutputTokens,
  responseMimeType: input.responseMime,
};

const buildPrompt = async () => {
  let prompts = [] as any[];
  if (input.filePath && input.fileMime) {
    const f = await uploadFile({
      token: input.token,
      filepath: input.filePath,
      mimeType: input.fileMime,
    });
    prompts.push({
      fileData: {
        fileUri: f.uri,
        mimeType: f.mimeType,
      },
    });
  }
  core.debug(`prompts: ${JSON.stringify(prompts)}`);
  return prompts;
};

const result = await model.generateContent({
  generationConfig,
  contents: [
    { role: "user", parts: await buildPrompt() },
    { role: "system", parts: [input.systemPrompt ?? ""] },
  ],
  systemInstruction,
});

core.setOutput("output", result.response.text());
