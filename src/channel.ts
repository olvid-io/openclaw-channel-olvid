import {
  buildChannelConfigSchema,
  type ChannelPlugin,
  setAccountEnabledInConfigSection, deleteAccountFromConfigSection, DEFAULT_ACCOUNT_ID, ChannelAccountSnapshot,
} from "openclaw/plugin-sdk";
import {
  listOlvidAccountIds,
  resolveDefaultOlvidAccountId,
  ResolvedOlvidAccount,
  resolveOlvidAccount
} from "./accounts";
import {OlvidConfigSchema} from "./config-schema";
import {CoreConfig} from "./types";
import {getOlvidRuntime} from "./runtime";
import {sendMessageOlvid} from "./send";
import {monitorOlvidProvider} from "./monitor";
import {olvidOnboardingAdapter} from "./onboarding";
import {looksLikeOlvidTargetId, normalizeOlvidMessagingTarget} from "./normalize";
import { Type } from "@sinclair/typebox";
import {OlvidClient} from "@olvid/bot-node";

export let olvidPlugin: ChannelPlugin<ResolvedOlvidAccount> = {
  id: "olvid",
  meta: {
    id: "olvid",
    label: "Olvid",
    selectionLabel: "Olvid (Daemon)",
    docsPath: "/channels/olvid",
    docsLabel: "olvid",
    blurb: "Securely exchange with your bot with authenticated e2e encryption",
    order: 65,
    quickstartAllowFrom: true,
  },
  capabilities: {
    chatTypes: ["direct", "group"],
    media: true,
    reactions: true,
    threads: false,
    reply: true,
    nativeCommands: true,
    blockStreaming: true
  },
  reload: { configPrefixes: ["channels.olvid"] },
  configSchema: buildChannelConfigSchema(OlvidConfigSchema),
  onboarding: olvidOnboardingAdapter,
  config: {
    listAccountIds: (cfg) => listOlvidAccountIds(cfg as CoreConfig),
    resolveAccount: (cfg, accountId) => resolveOlvidAccount({ cfg: cfg as CoreConfig, accountId }),
    defaultAccountId: (cfg) => resolveDefaultOlvidAccountId(cfg as CoreConfig),
    setAccountEnabled: ({ cfg, accountId, enabled }) =>
        setAccountEnabledInConfigSection({
          cfg,
          sectionKey: "olvid",
          accountId,
          enabled,
          allowTopLevel: true,
        }),
    deleteAccount: ({ cfg, accountId }) =>
        deleteAccountFromConfigSection({
          cfg,
          sectionKey: "olvid",
          accountId,
          clearBaseFields: ["clientKey", "daemonUrl", "name"],
        }),
    isConfigured: (account) => Boolean(account.clientKey && account.daemonUrl),
    describeAccount: (account) => ({
      accountId: account.accountId,
      name: account.name,
      enabled: account.enabled,
      configured: Boolean(account.clientKey && account.daemonUrl),
      clientKeySource: account.clientKeySource,
      daemonUrl: account.daemonUrl,
    }),
  },
  messaging: {
    normalizeTarget: normalizeOlvidMessagingTarget,
    targetResolver: {
      looksLikeId: looksLikeOlvidTargetId,
      hint: "olvid:discussionId"
    }
  },
  directory: {}, // todo implements
  actions: {}, // todo implements
  // setup: {}, // todo implements
  outbound: {
    deliveryMode: "direct",
    chunker: (text: string, limit: number): string[] => {
        return getOlvidRuntime().channel.text.chunkMarkdownText(text, limit);
    },
    chunkerMode: "markdown",
    textChunkLimit: 4000,
    sendText: async ({ to, text, accountId, replyToId }) => {
      const result = await sendMessageOlvid(to, text, {
        accountId: accountId ?? undefined,
        replyTo: replyToId ?? undefined,
      });
      return { channel: "olvid", ...result };
    },
    sendMedia: async ({ to, text, mediaUrl, accountId, replyToId }) => {
      const result = await sendMessageOlvid(to, text, {
        accountId: accountId ?? undefined,
        replyTo: replyToId ?? undefined,
        mediaUrls: mediaUrl ? [mediaUrl] : undefined,
      });
      return { channel: "olvid", ...result };
    },
  },
  status: {
    defaultRuntime: {
      accountId: DEFAULT_ACCOUNT_ID,
      running: false,
      connected: false,
      lastConnectedAt: null,
      lastDisconnect: null,
      lastStartAt: null,
      lastStopAt: null,
      lastError: null,
    },
    buildChannelSummary: ({ snapshot }) => ({
      configured: snapshot.configured ?? false,
      running: snapshot.running ?? false,
      connected: snapshot.connected ?? false,
      lastStartAt: snapshot.lastStartAt ?? null,
      lastStopAt: snapshot.lastStopAt ?? null,
      lastError: snapshot.lastError ?? null,
      baseUrl: snapshot.baseUrl ?? null,
      probe: snapshot.probe,
      lastProbeAt: snapshot.lastProbeAt ?? null,
    }),
    buildAccountSnapshot: ({ account, runtime }) => {
      return {
        accountId: account.accountId,
        name: account.name,
        enabled: account.enabled,
        configured: Boolean(account.clientKey && account.daemonUrl),
        clientKeySource: account.clientKeySource,
        baseUrl: account.daemonUrl,
        connected: runtime?.connected ?? false,
        lastConnectedAt: runtime?.lastConnectedAt ?? null,
        lastDisconnect: runtime?.lastDisconnect ?? null,
        lastStartAt: runtime?.lastStartAt ?? null,
        lastStopAt: runtime?.lastStopAt ?? null,
        lastError: runtime?.lastError ?? null,
        lastInboundAt: runtime?.lastInboundAt ?? null,
        lastOutboundAt: runtime?.lastOutboundAt ?? null,
      };
    },
  },
  gateway: {
    startAccount: async (ctx) => {
      const account = ctx.account;
      if (!account.daemonUrl || !account.clientKey) {
        throw new Error(`Olvid not configuration is invalid`);
      }
      ctx.setStatus({
        accountId: account.accountId,
        baseUrl: account.daemonUrl,
        botTokenSource: account.clientKeySource,
        lastStartAt: Date.now(),
      });
      ctx.log?.info(`[${account.accountId}] starting channel`);
      return monitorOlvidProvider({
        accountId: account.accountId,
        config: ctx.cfg as CoreConfig,
        runtime: ctx.runtime,
        abortSignal: ctx.abortSignal,
        statusSink: (patch: Partial<ChannelAccountSnapshot>) =>
            ctx.setStatus({ accountId: ctx.accountId, ...patch }),
      });
    },
    stopAccount: async (ctx) => {
      ctx.setStatus({ accountId: ctx.accountId, lastStopAt: Date.now() });
    },
  },
  agentTools: [{
      name: "list_olvid_discussions",
      label: "List Olvid Discussions",
      description: "List Olvid available Olvid discussions. Returns a list of discussion with Id and Title.",
      parameters: Type.Object({
        accountId: Type.String()
      }),
      async execute(_id: string, params: unknown) {
        const runtime = getOlvidRuntime();
        let accountId = (params as {accountId: string}).accountId;

        // Retrieve the configuration/credentials for the specific accountId
        let olvidAccount: ResolvedOlvidAccount = resolveOlvidAccount({cfg: runtime.config as CoreConfig, accountId});

        if (!olvidAccount) {
          throw new Error(`No configuration found for account ID: ${accountId}`);
        }

        const client = new OlvidClient({clientKey: olvidAccount.clientKey, serverUrl: olvidAccount.daemonUrl});
        const result: { content: any, details: string; } = {
          content: [],
          details: "List of discussion with Id and Title."
        };
        for await (const discussion of client.discussionList()) {
          result.content.push({type: "text", "text": `id:${discussion.id},title:${discussion.title}`});
        }
        return result;
      }
  }]
}
