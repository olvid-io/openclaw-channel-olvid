---
name: olvid-channel
version: 0.0.0-a9
description: Add a native Olvid channel in OpenClaw.
homepage: https://doc.bot.olvid.io/openclaw
metadata: {"openclaw":{"emoji":"🗨️","category":"communication"}}
---

# Olvid Channel
This plugin adds a native Olvid channel in OpenClaw. It allows to securely chat with your Agent within Olvid application.
Olvid is available on every platform (Android/iOs, Linux/Windows/MacOs).

With this channel you can use Olvid authenticated end-to-end encryption to exchange with your agent without exposing your OpenClaw instance on the web. 

# Install
Follow our installation guide: https://doc.bot.olvid.io/openclaw.

# Olvid Targets
Here are examples of expected Olvid targets:
```
olvid:discussion:42
olvid:contact:21
olvid:group:12
```

# Agent tools
## Send message 
When channel have been configured agent can use openclaw cli to post messages in Olvid discussions. Example of commands:
```bash
openclaw message send --channel olvid -t olvid:discussion:${olvid_discussion_id} --message "Hello there"
openclaw message send --channel olvid -t olvid:contact:${olvid_contact_id} --message "Hi Contact" --media /tmp/image.jpg
openclaw message send --channel olvid -t olvid:group:${olvid_group_id} --media /tmp/image.jpg
```

## Directory
To access your Olvid profile contacts and groups agent can use openclaw cli. Example of commands
```bash
# list your Olvid contacts
openclaw directory peers list --channel olvid
# list Olvid groups you are member of
openclaw directory groups list --channel olvid
# list your current olvid profile
openclaw directory self  list --channel olvid
```

## Actions

### Hints
- MessageIds are a combination of "I" or "O" letters (for inbound and outbound), followed by an integer: I42, O21.
- Olvid targets are a combination of an optional "olvid:" prefix and "discussion:ID" or "group:ID" or "contact:ID" where ID is an integer.

### React to a message

```JSON5
{
    "action": "react",
    "messageId": "I2",
    "emoji": "👍",
    "remove": false
}
```
- messageId is required.
- Set remove to true to remove a reaction (functionality depends on the readReactionParams implementation).

### Get message reactions
```json
{
    "action": "reactions",
    "messageId": "I2"
}
```
- messageId is required.
- Returns the full list of reactions associated with a specific message ID.

### Send a message

```JSON5
{
    "action": "send",
    "to": "target",
    "text": "Hello World",
    "media": "https://olvid.io/image.png",
    "replyTo": "I2"
}
```
- to is required, and is a valid olvid target (olvid:contact:1 or olvid:group:1).
- message is required (can be empty if sending media).
- media is optional (URL string).
- replyTo is optional and is a message id.

### Send an attachment

```JSON5
{
    "action": "sendAttachment",
    "to": "target",
    "filePath": "/local/path/to/file.pdf"
}
```
- to is required, and is a valid olvid target (olvid:contact:1 or olvid:group:1).
- filePath is a file location.

### Rename a group

```JSON5
{
    "action": "renameGroup",
    "groupId": "olvid:group:ID",
    "name": "New Group Name"
}
```
- groupId is required (ex: olvid:group:2)
- name is required and is the new group name.

### Add a group member

```JSON5
{
    "action": "addParticipant",
    "groupId": "olvid:group:ID",
    "contactId": "olvid:contact:ID"
}
```
- groupId is required (ex: olvid:group:21)
- contactId is required (ex: olvid:contact:42)

### Remove a group member

```JSON5
{
    "action": "removeParticipant",
    "groupId": "olvid:group:ID",
    "contactId": "olvid:contact:ID"
}
```
- groupId is required (ex: olvid:group:21)
- contactId is required (ex: olvid:contact:42)

### Leave a group

```JSON5
{
    "action": "leaveGroup",
    "groupId": "olvid:group:ID"
}
```
- groupId is required (ex: olvid:group:21)

## Tool List

The following tools are exposed by this skill.  Each tool’s is executed with the Bot's Olvid profile.

| Tool                       | Description                                                                                                                                 |
|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `olvid_list_discussions`   | Shows a list of every discussion (private or group) that belongs to **your** Olvid profile, including IDs, titles, and participant details. |
| `olvid_list_contacts`      | Returns the full contact list for **your** Olvid profile, with each contact’s ID, name, and status.                                         |
| `olvid_list_groups`        | Lists every Olvid group that **you** are a member of, including group IDs, names, and member lists.                                         |
| `olvid_start_call`         | Initiates a voice/video call inside any discussion that **belongs to you** (private or group). Returns the call ID.                         |
| `olvid_identity_set_photo` | Updates the **profile picture** for your own Olvid profile. Supplies the file path of the new image.                                        |
| `olvid_group_set_photo`    | Changes the avatar of an Olvid group you manage. Requires the group’s ID and the photo file path.                                           |
| `olvid_group_add_member`   | Adds a contact (by ID) to an Olvid group **you’re an admin of**, therefore giving you control over group membership.                        |
| `olvid_group_kick_member`  | Removes a contact from an Olvid group you administer.                                                                                       |
| `olvid_create_group`       | Creates a new Olvid group under **your** Olvid profile. Specify the group name and the IDs of the initial members.                          |
| `olvid_group_disband`      | Disbands an Olvid group of which you are a member.                                                                                          |
| `olvid_group_leave`        | Leaves an Olvid group that you’re a member of. The group remains for others, but you cease to see its updates.                              |
| `olvid_identity_photo_set` | Change identity photo for Agent Olvid profile. File must point to a valid local png or jpg image.                                           |
| `olvid_group_photo_set`    | Change group photo for an group you have admin permissions. File must point to a valid local png or jpg image.                              |

### Using the Tools

When invoking a tool, you typically need to pass the optional `olvidChannelAccountId`.  
If omitted, the skill will use the default Olvid client attached to your session.

```json5
{
  action: "execute",
  name: "olvid_list_discussions",
  params: { olvidChannelAccountId: "default" }
}
```

## Documentation

Documentation to use this skill is available here: https://doc.bot.olvid.io/openclaw.

This skill code is hosted on GitHub: https://github.com/olvid-io/openclaw-channel-olvid.

## Publishing

The skill is ready for publication on the OpenClaw Hub.  
Run:

```bash
openclaw hub publish
```

This will upload the package to the hub and make it discoverable by other OpenClaw users.

---

### Contact

Feel free to open [new issues](https://github.com/olvid-io/openclaw-channel-olvid/issues/new/choose) or contact us at: [bot@olvid.io](mailto:bot@olvid.io).

--- 
