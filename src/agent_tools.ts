import {datatypes} from "@olvid/bot-node";
import { Type } from "@sinclair/typebox";
import {getOlvidClient, stringifyDatatypesEntity} from "./tools";
import * as fs from "node:fs";
import {getOlvidRuntime} from "./runtime";

export const olvidAgentTools = [
    {
        name: "olvid_list_discussions",
        label: "Olvid List Discussions",
        description: "Shows a list of every discussion (private or group) that belongs to **your** Olvid profile, including IDs, titles, and participant details.",
        parameters: Type.Object({
            olvidChannelAccountId: Type.Optional(Type.String())
        }),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const result: { content: any, details: string; } = {
                content: [],
                details: "List of my discussions in Olvid."
            };
            for await (const discussion of client.discussionList()) {
                result.content.push({type: "text", text: stringifyDatatypesEntity(discussion)});
            }
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_list_contacts",
        label: "Olvid List Contacts",
        description: "Returns the full contact list for **your** Olvid profile, with each contact’s ID, name and status.",
        parameters: Type.Object({
            olvidChannelAccountId: Type.Optional(Type.String())
        }),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const result: { content: any, details: string; } = {
                content: [],
                details: "Olvid contacts list."
            };
            for await (const contact of client.contactList()) {
                result.content.push({type: "text", text: stringifyDatatypesEntity(contact)});
            }
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_list_groups",
        label: "Olvid List Groups",
        description: "Lists every Olvid groups that **you** are a member of, including group IDs, names, and member lists.",
        parameters: Type.Object({
            olvidChannelAccountId: Type.Optional(Type.String())
        }),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const result: { content: any, details: string; } = {
                content: [],
                details: "List of my Olvid groups"
            };
            for await (const contact of client.groupList()) {
                result.content.push({type: "text", text: stringifyDatatypesEntity(contact)});
            }
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_start_call",
        label: "Olvid Start Call",
        description: "Initiates a voice/video call inside any discussion that **belongs to you** (private or group). Returns the call ID.",
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
        name: "olvid_group_add_member",
        label: "Olvid Group Add Member",
        description: "Adds a contact (by ID) to an Olvid group **you’re an admin of**, therefore giving you control over group membership.",
        parameters: Type.Object({olvidChannelAccountId: Type.Optional(Type.String()), groupId: Type.Number(), contactIdToAdd: Type.Number(), filePath: Type.String()}),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const groupId: number = (params as {groupId: number}).groupId;
            const contactIdToAdd: number = (params as {contactIdToAdd: number}).contactIdToAdd;
            const group = await client.groupGet({groupId: BigInt(groupId)});
            group.members.push(new datatypes.GroupMember({contactId: BigInt(contactIdToAdd)}));
            const ret = await client.groupUpdate({group: group});
            const result: { content: any, details: string; } = {
                content: [{type: "text", text: stringifyDatatypesEntity(ret)}],
                details: "Result of GroupAddMember method."
            };
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_group_kick_member",
        label: "Olvid Group Kick Member",
        description: "Removes a contact from an Olvid group you admin.",
        parameters: Type.Object({olvidChannelAccountId: Type.Optional(Type.String()), groupId: Type.Number(), contactIdToKick: Type.Number(), filePath: Type.String()}),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const groupId: number = (params as {groupId: number}).groupId;
            const contactIdToKick: number = (params as {contactIdToKick: number}).contactIdToKick;
            const group = await client.groupGet({groupId: BigInt(groupId)});
            group.members = group.members.filter(m => m.contactId !== BigInt(contactIdToKick));
            const ret = await client.groupUpdate({group: group});
            const result: { content: any, details: string; } = {
                content: [{type: "text", text: stringifyDatatypesEntity(ret)}],
                details: "Result of GroupKickMember method."
            };
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_create_group",
        label: "Olvid Create Group",
        description: "Creates a new Olvid group under **your** Olvid profile. Specify the group name and the IDs of the initial members.",
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
                content: [{type: "text", text: stringifyDatatypesEntity(group)}],
                details: "Create group."
            };
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_group_disband",
        label: "Olvid Group Disband",
        description: "Disband an Olvid group that you are member of.",
        parameters: Type.Object({olvidChannelAccountId: Type.Optional(Type.String()), groupId: Type.Number()}),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const groupId: number = (params as {groupId: number}).groupId;
            const ret = await client.groupDisband({groupId: BigInt(groupId)});
            const result: { content: any, details: string; } = {
                content: [{type: "text", text: stringifyDatatypesEntity(ret)}],
                details: "Result of GroupDisband method."
            };
            client.stop();
            return result;

        }
    },
    {
        name: "olvid_group_leave",
        label: "Olvid Group Leave",
        description: "Leaves an Olvid group that you’re a member of. The group remains for others, but you cease to see its updates.",
        parameters: Type.Object({olvidChannelAccountId: Type.Optional(Type.String()), groupId: Type.Number()}),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const groupId: number = (params as {groupId: number}).groupId;
            const ret = await client.groupLeave({groupId: BigInt(groupId)})
            const result: { content: any, details: string; } = {
                content: [{type: "text", text: stringifyDatatypesEntity(ret)}],
                details: "Result of GroupLeave method."
            };
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_identity_photo_set",
        label: "Olvid Identity Photo Set",
        description: "Change identity photo for Agent Olvid profile. File must point to a valid local png or jpg image.",
        parameters: Type.Object({imagePath: Type.Optional(Type.String())}),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const imagePath: string = (params as {imagePath: string}).imagePath;
            // validate image is valid
            if (!fs.existsSync(imagePath)) {
                throw new Error("Image path does not exist");
            }
            const runtime = getOlvidRuntime();
            const mimeType = await runtime.media.detectMime({filePath: imagePath});
            if (!mimeType?.startsWith("image/")) {
                throw new Error("You must pass an image file");
            }

            await client.identitySetPhoto({filePath: imagePath})
            const result: { content: any, details: string; } = {
                content: [],
                details: "Result of Olvid Identity Photo Set method."
            };
            client.stop();
            return result;
        }
    },
    {
        name: "olvid_group_photo_set",
        label: "Olvid Group Photo Set",
        description: "Change group photo for an group you have admin permissions. File must point to a valid local png or jpg image.",
        parameters: Type.Object({imagePath: Type.Optional(Type.String())}),
        async execute(_id: string, params: unknown) {
            const client = getOlvidClient((params as {olvidChannelAccountId: string}).olvidChannelAccountId);
            const imagePath: string = (params as {imagePath: string}).imagePath;
            // validate image is valid
            if (!fs.existsSync(imagePath)) {
                throw new Error("Image path does not exist");
            }
            const runtime = getOlvidRuntime();
            const mimeType = await runtime.media.detectMime({filePath: imagePath});
            if (!mimeType?.startsWith("image/")) {
                throw new Error("You must pass an image file");
            }

            await client.identitySetPhoto({filePath: imagePath})
            const result: { content: any, details: string; } = {
                content: [],
                details: "Result of Olvid Identity Photo Set method."
            };
            client.stop();
            return result;
        }
    },
]
