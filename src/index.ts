import { GoogleGenerativeAI, Part } from "@google/generative-ai";
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
  token: core.getInput("token", { required: true }),
  model: core.getInput("model"),
  prompt: core.getInput("prompt", { required: true }),
  systemPrompt: core.getInput("system-prompt") || undefined,
  temperature: core.getInput("temperature") || undefined,
  topP: core.getInput("topP") || undefined,
  topK: core.getInput("topK") || undefined,
  maxOutputTokens: core.getInput("maxOutputTokens") || undefined,
  responseMime: core.getInput("responseMime") || undefined,
  filePath: core.getInput("file-path") || undefined,
  fileMime: core.getInput("file-mime") || undefined,
  displayName: core.getInput("file-display-name") || undefined,
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
  let prompts = [{ text: input.prompt }] as Part[];
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
  return prompts;
};

const contents = [{ role: "user", parts: await buildPrompt() }];

// if (input.systemPrompt) {
//   // contents.push({ role: "system", parts: [{ text: input.systemPrompt }] });
// }

core.debug(`prompts: ${JSON.stringify(contents)}`);

const result = await model.generateContent({
  generationConfig,
  contents,
  systemInstruction: `${systemInstruction} ${input?.systemPrompt ?? ""}`,
});

core.setOutput("output", result.response.text());
