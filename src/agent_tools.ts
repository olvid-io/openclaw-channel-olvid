import {getOlvidRuntime} from "./runtime";
import {ResolvedOlvidAccount, resolveOlvidAccount} from "./accounts";
import {CoreConfig} from "./types";
import {datatypes, OlvidClient} from "@olvid/bot-node";
import { Type } from "@sinclair/typebox";

function getOlvidClient(olvidChannelAccountId?: string): OlvidClient {
    const runtime = getOlvidRuntime();
    const config = runtime.config.loadConfig();

    // Retrieve the configuration/credentials for the specific olvidChannelAccountId, or fallback to default
    let olvidAccount: ResolvedOlvidAccount = resolveOlvidAccount({cfg: config as CoreConfig, accountId: olvidChannelAccountId ?? "default"});
    if (!olvidAccount || !olvidAccount.daemonUrl || !olvidAccount.clientKey) {
        olvidAccount = resolveOlvidAccount({cfg: config as CoreConfig, accountId: "default"});
    }
    return new OlvidClient({clientKey: olvidAccount.clientKey, serverUrl: olvidAccount.daemonUrl});
}

export const olvidAgentTools = [
    {
        name: "olvid_list_discussions",
        label: "Olvid List Discussions",
        description: "List your Olvid discussions.",
        parameters: Type.Object({
            olvidChannelAccountId: Type.Optional(Type.String())
        }),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const result: { content: any, details: string; } = {
                content: [],
                details: "List of your discussions in Olvid."
            };
            for await (const discussion of client.discussionList()) {
                result.content.push({type: "text", text: JSON.stringify(discussion.toJson())});
            }
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_list_contacts",
        label: "Olvid List Contacts",
        description: "List your Olvid Contacts",
        parameters: Type.Object({
            olvidChannelAccountId: Type.Optional(Type.String())
        }),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const result: { content: any, details: string; } = {
                content: [],
                details: "List of your Olvid contacts"
            };
            for await (const contact of client.contactList()) {
                result.content.push({type: "text", text: JSON.stringify(contact.toJson())});
            }
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_list_groups",
        label: "Olvid List Groups",
        description: "List your Olvid Groups",
        parameters: Type.Object({
            olvidChannelAccountId: Type.Optional(Type.String())
        }),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const result: { content: any, details: string; } = {
                content: [],
                details: "List of your Olvid groups"
            };
            for await (const contact of client.groupList()) {
                result.content.push({type: "text", text: JSON.stringify(contact.toJson())});
            }
            client.stop();
            return result;
        }
    },
    {
        name: "start_olvid_call",
        label: "Start Olvid Call",
        description: "Start an olvid call in a discussion",
        parameters: Type.Object({
            olvidChannelAccountId: Type.Optional(Type.String()),
            discussionId: Type.Number()
        }),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const discussionId: number = (params as {discussionId: number}).discussionId;
            let callId = await client.callStartDiscussionCall({discussionId: BigInt(discussionId)});
            const result: { content: any, details: string; } = {
                content: [{type: "text", text: callId}],
                details: "Call identifier."
            };
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_identity_set_photo",
        label: "Olvid Identity Set Photo",
        description: "rpc service: IdentityCommandService, method: IdentitySetPhoto",
        parameters: Type.Object({olvidChannelAccountId: Type.Optional(Type.String()), filePath: Type.String()}),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const filePath: string = (params as {filePath: string}).filePath;
            const ret = await client.identitySetPhoto({filePath: filePath});
            const result: { content: any, details: string; } = {
                content: [{type: "text", text: JSON.stringify(ret)}],
                details: "Result of IdentityPhotoUpdate method."
            };
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_group_set_photo",
        label: "Olvid Group Set Photo",
        description: "rpc service: GroupCommandService, method: GroupSetPhoto",
        parameters: Type.Object({olvidChannelAccountId: Type.Optional(Type.String()), groupId: Type.Number(), filePath: Type.String()}),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const groupId: number = (params as {groupId: number}).groupId;
            const filePath: string = (params as {filePath: string}).filePath;
            const ret = await client.groupSetPhoto({groupId: BigInt(groupId), filePath: filePath});
            const result: { content: any, details: string; } = {
                content: [{type: "text", text: JSON.stringify(ret)}],
                details: "Result of GroupSetPhoto method."
            };
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_group_add_member",
        label: "Olvid Group Add Member",
        description: "rpc service: GroupCommandService, method: GroupAddMember",
        parameters: Type.Object({olvidChannelAccountId: Type.Optional(Type.String()), groupId: Type.Number(), contactIdToAdd: Type.Number(), filePath: Type.String()}),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const groupId: number = (params as {groupId: number}).groupId;
            const contactIdToAdd: number = (params as {contactIdToAdd: number}).contactIdToAdd;
            const group = await client.groupGet({groupId: BigInt(groupId)});
            group.members.push(new datatypes.GroupMember({contactId: BigInt(contactIdToAdd)}));
            const ret = await client.groupUpdate({group: group});
            const result: { content: any, details: string; } = {
                content: [{type: "text", text: JSON.stringify(ret)}],
                details: "Result of GroupAddMember method."
            };
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_group_kick_member",
        label: "Olvid Group Kick Member",
        description: "rpc service: GroupCommandService, method: GroupKickMember",
        parameters: Type.Object({olvidChannelAccountId: Type.Optional(Type.String()), groupId: Type.Number(), contactIdToKick: Type.Number(), filePath: Type.String()}),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const groupId: number = (params as {groupId: number}).groupId;
            const contactIdToKick: number = (params as {contactIdToKick: number}).contactIdToKick;
            const group = await client.groupGet({groupId: BigInt(groupId)});
            group.members = group.members.filter(m => m.contactId !== BigInt(contactIdToKick));
            const ret = await client.groupUpdate({group: group});
            const result: { content: any, details: string; } = {
                content: [{type: "text", text: JSON.stringify(ret)}],
                details: "Result of GroupKickMember method."
            };
            client.stop();
            return result;
        }
    },
    {
        name: "create_olvid_group",
        label: "Create Olvid Group",
        description: "Create an olvid group discussion",
        parameters: Type.Object({
            olvidChannelAccountId: Type.Optional(Type.String()),
            groupName: Type.String(),
            contactIds: Type.Array(Type.Number())
        }),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const groupName: string = (params as {groupName: string}).groupName;
            const contactIds: number[] = (params as {contactIds: number[]}).contactIds;
            let group = await client.groupNewStandardGroup({name: groupName, adminContactIds: contactIds.map(cid => BigInt(cid))});
            const result: { content: any, details: string; } = {
                content: [{type: "text", text: JSON.stringify(group.toJson())}],
                details: "Create group."
            };
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_group_disband",
        label: "Olvid Group Disband",
        description: "rpc service: GroupCommandService, method: GroupDisband",
        parameters: Type.Object({olvidChannelAccountId: Type.Optional(Type.String()), groupId: Type.Number()}),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const groupId: number = (params as {groupId: number}).groupId;
            const ret = await client.groupDisband({groupId: BigInt(groupId)});
            const result: { content: any, details: string; } = {
                content: [{type: "text", text: JSON.stringify(ret)}],
                details: "Result of GroupDisband method."
            };
            client.stop();
            return result;

        }
    },
    {
        name: "olvid_group_leave",
        label: "Olvid Group Leave",
        description: "rpc service: GroupCommandService, method: GroupLeave",
        parameters: Type.Object({olvidChannelAccountId: Type.Optional(Type.String()), groupId: Type.Number()}),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const groupId: number = (params as {groupId: number}).groupId;
            const ret = await client.groupLeave({groupId: BigInt(groupId)})
            const result: { content: any, details: string; } = {
                content: [{type: "text", text: JSON.stringify(ret)}],
                details: "Result of GroupLeave method."
            };
            client.stop();
            return result;
        }
    }
]
