import { GoogleGenerativeAI } from "@google/generative-ai";
import * as core from "@actions/core";
import { z } from "zod";
import { uploadFile } from "./file-upload.js";

const inputSchema = z.object({
  token: z.string(),
  model: z.string(),
  prompt: z.string(),
  filePath: z.string().optional(),
  fileMime: z.string().optional(),
  displayName: z.string().optional(),
});
const ghInput = {
  token: core.getInput("token"),
  model: core.getInput("model"),
  prompt: core.getInput("prompt"),
  filePath: core.getInput("file-path"),
  fileMime: core.getInput("file-mime"),
  displayName: core.getInput("file-display-name"),
};

const input = inputSchema.parse(ghInput);
core.debug(`input file: ${JSON.stringify(input)}`);
const genAI = new GoogleGenerativeAI(input.token);

const model = genAI.getGenerativeModel({ model: input.model });

const buildPrompt = async () => {
  let prompts = [input.prompt] as any[];
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

const result = await model.generateContent(await buildPrompt());

core.setOutput("output", result.response.text());
