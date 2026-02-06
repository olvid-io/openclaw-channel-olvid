import {datatypes, OlvidClient} from "@olvid/bot-node";
import { ResolvedOlvidAccount, resolveOlvidAccount } from "./accounts.js";
import { extractDiscussionIdFromTarget } from "./normalize.js";
import { getOlvidRuntime } from "./runtime.js";
import { CoreConfig } from "./types.js";
import {messageIdFromString, messageIdToString} from "./tools";

type OlvidSendOpts = {
  daemonUrl?: string;
  clientKey?: string;
  accountId?: string;
  replyTo?: string;
  mediaUrls?: string[];
};

export type OlvidSendResult = {
  messageId: string;
  discussionId: number;
  timestamp?: number;
};

export async function sendMessageOlvid(
  to: string,
  text: string,
  opts: OlvidSendOpts = {},
): Promise<OlvidSendResult> {
  const runtime = getOlvidRuntime();
  const logger = runtime.logging.getChildLogger({channel: "olvid", accountId: opts.accountId});
  const cfg = runtime.config.loadConfig() as CoreConfig;
  let account: ResolvedOlvidAccount = resolveOlvidAccount({ cfg, accountId: opts.accountId });

  if (!text?.trim() && !opts.mediaUrls) {
    throw new Error("Message must be non-empty for Olvid");
  }

  let olvidClient = new OlvidClient({ clientKey: account.clientKey, serverUrl: account.daemonUrl });

  let discussionId: bigint = extractDiscussionIdFromTarget(to)!;
  if (!discussionId) {
    throw new Error(`Cannot parse discussion id: ${to}`);
  }

  // TODO TODEL
  logger.info(`sendMessageOlvid: ${opts.mediaUrls}`);
  console.log(opts.mediaUrls);

  let message: datatypes.Message;
  if (opts.mediaUrls) {
    let ret = await olvidClient.messageSendWithAttachmentsFiles({ discussionId, body: text, replyId: opts.replyTo ? messageIdFromString(opts.replyTo) : undefined, filesPath: opts.mediaUrls });
    message = ret.message;
  } else {
    message = await olvidClient.messageSend({ discussionId, body: text, replyId: opts.replyTo ? messageIdFromString(opts.replyTo) : undefined });
  }
  let result: OlvidSendResult = {
    messageId: message?.id?.toString() ?? "",
    discussionId: Number(message?.discussionId) ?? 0,
    timestamp: Number(message.timestamp),
  };

  console.log(`message sent: ${messageIdToString(message.id)}`);

  getOlvidRuntime().channel.activity.record({
    channel: "olvid",
    accountId: account.accountId,
    direction: "outbound",
  });

  return result;
}
