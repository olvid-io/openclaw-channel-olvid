import {
    ChannelMessageActionAdapter,
    ChannelMessageActionContext,
    ChannelMessageActionName,
    ChannelToolSend,
    OpenClawConfig, readReactionParams, readStringParam,
} from "openclaw/plugin-sdk";
import {ResolvedOlvidAccount, resolveOlvidAccount} from "./accounts";
import {CoreConfig} from "./types";
import {datatypes} from "@olvid/bot-node";
import {getOlvidClient, messageIdFromString, stringifyDatatypesEntity} from "./tools";
import {sendMessageOlvid} from "./send";
import {getContactIdFromTarget, getDiscussionIdFromTarget, getGroupIdFromTarget} from "./normalize";

// const ALL_OLVID_ACTIONS: Set<ChannelMessageActionName> = new Set<ChannelMessageActionName>([
//     "send", "broadcast", "sendAttachment", "delete",
//     "read", "edit", "reply",
//     "react", "reactions",
//     "renameGroup", "setGroupIcon", "addParticipant", "removeParticipant", "leaveGroup",
//     "permissions",
//     "member-info", "kick"]);
const ALL_OLVID_ACTIONS: Set<ChannelMessageActionName> = new Set<ChannelMessageActionName>([
    "read", "send", "sendAttachment", "react", "reactions",
    "renameGroup", "addParticipant", "removeParticipant", "leaveGroup"
]);


export let OlvidActionsAdapter: ChannelMessageActionAdapter = {
    listActions: (params: { cfg: OpenClawConfig;}): ChannelMessageActionName[] => {
        const account = resolveOlvidAccount({ cfg: params.cfg as CoreConfig });
        if (!account.enabled || !account.daemonUrl || !account.clientKey ) {
            return [];
        }
        if (account.config.disableActions) {
            return [];
        }
        return Array.from(ALL_OLVID_ACTIONS);
    },
    supportsAction: (params: { action: ChannelMessageActionName; }): boolean => {
        return ALL_OLVID_ACTIONS.has(params.action);
    },
    // TODO not sure what this method is for
    extractToolSend: ({ args }): ChannelToolSend | null => {
        const action = typeof args.action === "string" ? args.action.trim() : "";
        if (action !== "sendMessage") {
            return null;
        }
        const to = typeof args.to === "string" ? args.to : undefined;
        if (!to) {
            return null;
        }
        return { to };
    },
    handleAction: async (ctx: Pick<ChannelMessageActionContext, "action" | "params" | "cfg" | "accountId">) => {
        const { action, params, cfg } = ctx;
        const accountId = ctx.accountId ?? readStringParam(params, "accountId");
        const account: ResolvedOlvidAccount = resolveOlvidAccount({cfg: cfg as CoreConfig, accountId});

        if (account.config.disableActions) {
            return {details: "actions disabled for this Olvid account", content: []}
        }
        const client = getOlvidClient(accountId);

        try {
            switch (action) {
                case "read": {
                    const target: string = readStringParam(params, "target", { required: true }) ;
                    const discussionId: bigint = await getDiscussionIdFromTarget(client, target) ?? 0n;
                    const ret: { content: any, details: string; } = {
                        content: [],
                        details: `Messages for discussion: olvid:discussion:${discussionId}`
                    };
                    for await (let message of client.messageList({filter: new datatypes.MessageFilter({discussionId})})) {
                        ret.content.push({type: "text", text: stringifyDatatypesEntity(message)});
                    }
                    return ret;
                }
                case "react": {
                    const messageIdString: string = readStringParam(params, "messageId", {
                        required: true,
                    });
                    const messageId = messageIdFromString(messageIdString)
                    const { emoji, remove, isEmpty } = readReactionParams(params, {
                        removeErrorMessage: "Emoji is required to remove a Olvid reaction.",
                    });
                    if (remove || isEmpty) {
                        await client.messageReact({messageId: messageId, reaction: emoji})
                    } else {
                        await client.messageReact({messageId: messageId, reaction: emoji})
                    }
                    return {details: "reaction sent", content: []};
                }
                case "reactions": {
                    const messageId = readStringParam(params, "messageId", { required: true });
                    let message = await client.messageGet({messageId: messageIdFromString(messageId)});
                    return {details: `${messageId}: message reactions`, content:[{type:"text",text: stringifyDatatypesEntity(message.reactions)}]};
                }
                case "send": {
                    const to = readStringParam(params, "to", { required: true });
                    const text = readStringParam(params, "text", {
                        required: true,
                        allowEmpty: true,
                    });
                    const mediaUrl = readStringParam(params, "media", { trim: false });
                    const replyTo = readStringParam(params, "replyTo");
                    const sentMessage = await sendMessageOlvid(to, text, {accountId, mediaUrls: mediaUrl ? [mediaUrl] : [], replyTo});
                    return {details: "sent message", content: [{type: "text", text: stringifyDatatypesEntity(sentMessage)}]};
                }
                case "sendAttachment": {
                    const to = readStringParam(params, "to", { required: true });
                    const filePath = readStringParam(params, "path") ?? readStringParam(params, "filePath");
                    if (!filePath) {
                        // Read file from path (will be handled by caller providing buffer)
                        throw new Error("Olvid sendAttachment: filePath is necessary.");
                    }
                    const sentMessage = await sendMessageOlvid(to, "", {accountId: accountId, mediaUrls: [filePath]});
                    return {details: "sent message", content: [{type: "text", text: stringifyDatatypesEntity(sentMessage)}]};
                }
                case "renameGroup": {
                    const groupIdString: string = readStringParam(params, "groupId", {required:true});
                    const name: string = readStringParam(params, "name", {required:true});
                    const groupId: bigint = getGroupIdFromTarget(groupIdString) ?? 0n;
                    let group = await client.groupGet({groupId: groupId})
                    group.name = name;
                    group = await client.groupUpdate({group});
                    return {details: "updated group", content: [{type: "text", text: stringifyDatatypesEntity(group)}]};
                }
                case "addParticipant": {
                    const groupIdString: string = readStringParam(params, "groupId", {required:true});
                    const contactIdString: string = readStringParam(params, "contactId", {required:true});
                    const groupId: bigint = getGroupIdFromTarget(groupIdString) ?? 0n;
                    const contactId: bigint = getContactIdFromTarget(contactIdString) ?? 0n;
                    let group = await client.groupGet({groupId: groupId});
                    group.members.push(new datatypes.GroupMember({contactId: contactId}));
                    group = await client.groupUpdate({group});
                    return {details: "updated group", content: [{type: "text", text: stringifyDatatypesEntity(group)}]};
                }
                case "removeParticipant": {
                    const groupIdString: string = readStringParam(params, "groupId", {required:true});
                    const contactIdString: string = readStringParam(params, "contactId", {required:true});
                    const groupId: bigint = getGroupIdFromTarget(groupIdString) ?? 0n;
                    const contactId: bigint = getContactIdFromTarget(contactIdString) ?? 0n;
                    let group = await client.groupGet({groupId: groupId});
                    group.members = group.members.filter(m => m.contactId !== contactId);
                    group = await client.groupUpdate({group});
                    return {details: "updated group", content: [{type: "text", text: stringifyDatatypesEntity(group)}]};
                }
                case "leaveGroup": {
                    const groupIdString: string = readStringParam(params, "groupId", {required:true});
                    const groupId: bigint = getGroupIdFromTarget(groupIdString) ?? 0n;
                    let group = await client.groupLeave({groupId});
                    return {details: "left group", content: [{type: "text", text: stringifyDatatypesEntity(group)}]};
                }
            }
            return {
                details: `Unsupported action: ${action}`,
                content: [{type: "text", text: ""}]
            };
        }
        finally {
            client.stop();
        }
    }
}