import {getOlvidRuntime} from "./runtime";
import {ResolvedOlvidAccount, resolveOlvidAccount} from "./accounts";
import {CoreConfig} from "./types";
import {OlvidClient} from "@olvid/bot-node";
import { Type } from "@sinclair/typebox";

function getOlvidClient(accountId: string): OlvidClient {
    const runtime = getOlvidRuntime();
    const config = runtime.config.loadConfig();

    // Retrieve the configuration/credentials for the specific accountId, or fallback to default
    let olvidAccount: ResolvedOlvidAccount = resolveOlvidAccount({cfg: config as CoreConfig, accountId});
    if (!olvidAccount || !olvidAccount.daemonUrl || !olvidAccount.clientKey) {
        olvidAccount = resolveOlvidAccount({cfg: config as CoreConfig, accountId: "default"});
    }
    return new OlvidClient({clientKey: olvidAccount.clientKey, serverUrl: olvidAccount.daemonUrl});
}

export const olvidAgentTools = [
    {
        name: "list_olvid_discussions",
        label: "List Olvid Discussions",
        description: "List available Olvid discussions.",
        parameters: Type.Object({
            accountId: Type.String()
        }),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {accountId: string}).accountId);
            const result: { content: any, details: string; } = {
                content: [],
                details: "List of discussions in Olvid."
            };
            for await (const discussion of client.discussionList()) {
                result.content.push({type: "text", text: JSON.stringify(discussion.toJson())});
            }
            client.stop();
            return result;
        }
    },
    {
        name: "list_olvid_contacts",
        label: "List Olvid Contacts",
        description: "List Olvid Contacts",
        parameters: Type.Object({
            accountId: Type.String()
        }),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {accountId: string}).accountId);
            const result: { content: any, details: string; } = {
                content: [],
                details: "List of Olvid contacts"
            };
            for await (const contact of client.contactList()) {
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
            accountId: Type.String(),
            discussionId: Type.Number()
        }),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {accountId: string}).accountId);
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
        name: "create_olvid_group",
        label: "Create Olvid Group",
        description: "Create an olvid group discussion",
        parameters: Type.Object({
            accountId: Type.String(),
            groupName: Type.String(),
            contactIds: Type.Array(Type.Number())
        }),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {accountId: string}).accountId);
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
]
