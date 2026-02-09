import { datatypes } from "@olvid/bot-node";

export function messageIdToString(messageId?: datatypes.MessageId): string {
  if (!messageId) {
    return "undefined";
  }
  return messageId.type === datatypes.MessageId_Type.INBOUND
    ? `I${messageId.id}`
    : `O${messageId.id}`;
}

export function messageIdFromString(messageId: string): datatypes.MessageId {
  let type: datatypes.MessageId_Type = datatypes.MessageId_Type.UNSPECIFIED;
  if (messageId.startsWith("I")) {
    type = datatypes.MessageId_Type.INBOUND;
  } else if (messageId.startsWith("O")) {
    type = datatypes.MessageId_Type.OUTBOUND;
  }
  let id: bigint = 0n;
  try {
    id = BigInt(messageId.slice(1));
  } catch (e) {}

  return new datatypes.MessageId({ type, id });
}

/*
** File manipulation tools
 */
import path from "node:path";
import fs from "node:fs";

export const SAFE_UPLOAD_DIR = path.resolve(
    process.env.HOME ?? process.env.USERPROFILE ?? ".",
    ".openclaw",
    "olvid-uploads"
);

/*
** this method validates that file must be sent to Olvid API and we are not extracting data.
 */
export function isUploadPathValid(filePath: string): string {
  // Resolve to absolute path.
  const abs = path.resolve(SAFE_UPLOAD_DIR, filePath);

  // Do not accept ".." pattern
  if (abs.indexOf("..") != -1) {
    throw new Error(`File ${filePath} cannot accept ".." in path`);
  }

  // Must live inside the SAFE_UPLOAD_DIR
  if (!abs.startsWith(SAFE_UPLOAD_DIR)) {
    throw new Error(`File ${filePath} tries to escape the safe uploads directory`);
  }

  // Must exist
  if (!fs.existsSync(abs)) {
    throw new Error(`File ${filePath} does not exist`);
  }

  return abs; // canonical path that can be used safely
}

export const ALLOWED_IMAGES_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
function isFileAValidImage(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (!ALLOWED_IMAGES_EXTENSIONS.has(ext)) {
    throw new Error(`File extension is invalid: ${filePath} (allowed: ${ALLOWED_IMAGES_EXTENSIONS})`);
  }
  return false;
}
