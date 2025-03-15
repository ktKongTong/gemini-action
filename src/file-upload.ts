import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";
import * as core from "@actions/core";
export type File = {
  token: string;
  filepath: string;
  mimeType: string;
  name?: string;
  displayName?: string;
};
export const uploadFile = async (f: File) => {
  core.debug(`prepare upload file: ${JSON.stringify(f)}`);
  const fileManager = new GoogleAIFileManager(f.token);

  const uploadResult = await fileManager.uploadFile(f.filepath, {
    name: f.name,
    mimeType: f.mimeType,
    displayName: f.displayName,
  });
  let file = await fileManager.getFile(uploadResult.file.name);
  while (file.state === FileState.PROCESSING) {
    process.stdout.write(".");
    // Sleep for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    // Fetch the file from the API again
    file = await fileManager.getFile(uploadResult.file.name);
    if (file.state === FileState.FAILED) {
      throw new Error("Audio processing failed.");
    }
  }
  core.debug(`uploaded file: ${JSON.stringify(file.uri)}`);
  return file;
};
