import type {ChannelDirectoryAdapter, ChannelDirectoryEntry, OpenClawConfig, RuntimeEnv} from "openclaw/plugin-sdk";
import {contactIdToString, getOlvidClient, groupIdToString} from "./tools";

export let OlvidDirectoryAdapter: ChannelDirectoryAdapter = {
    self: async (params: { cfg: OpenClawConfig; accountId?: string | null; runtime: RuntimeEnv; }) => {
        const client = getOlvidClient(params?.accountId ?? undefined);
        const identity = await client.identityGet();
        client.stop();
        return {
            kind: "user",
            id: `identity:${identity.id}`,
            name: identity.displayName,
            raw: identity
        };
    },
    listPeers: async (params: {cfg: OpenClawConfig; accountId?: string|null; query?: string | null; limit?: number | null; runtime: RuntimeEnv;}) => {
        const client = getOlvidClient(params?.accountId ?? undefined);
        const ret: ChannelDirectoryEntry[] = [];
        for await (let contact of client.contactList({})) {
            ret.push({
                kind: "user",
                id: contactIdToString(contact.id),
                name: contact.displayName,
                raw: contact
            })
        }
        client.stop();
        return ret;
    },
    listGroups: async (params: { cfg: OpenClawConfig; accountId?: string | null; query?: string | null; limit?: number | null; runtime: RuntimeEnv; }) => {
        const client = getOlvidClient(params?.accountId ?? undefined);
        const ret: ChannelDirectoryEntry[] = [];
        for await (let group of client.groupList({})) {
            ret.push({
                kind: "group",
                id: groupIdToString(group.id),
                name: group.name,
                raw: group
            })
        }
        client.stop();
        return ret;
    },
    listGroupMembers : async (params: { cfg: OpenClawConfig; accountId?: string | null; groupId: string; limit?: number | null; runtime: RuntimeEnv; }) => {
        const client = getOlvidClient(params?.accountId ?? undefined);
        const ret: ChannelDirectoryEntry[] = [];
        const group = await client.groupGet({groupId: BigInt(params.groupId)});

        for (let member of group.members) {
            const contact = await client.contactGet({contactId: member.contactId})
            ret.push({
                kind: "user",
                id: contactIdToString(member.contactId),
                name: contact.displayName,
                raw: member
            })
        }
        client.stop();
        return ret;
    }
}