---
name: olvid-channel
version: 0.0.0-a5
description: Add a native Olvid channel in OpenClaw.
homepage: https://doc.bot.olvid.io/openclaw
metadata: {"openclaw":{"emoji":"🗨️","category":"communication"}}
---

# Olvid Channel Skill

This skill adds a native Olvid channel to OpenClaw, letting you communicate with your OpenClaw Agent via Olvid.  
Your agent has its own Olvid profile, enabling one‑to‑one exchanges or group conversations.

The agent can also perform actions with its own profile, for example:
- 📬 List its discussions (direct messages and groups)
- 📇 List its contacts
- 👥 List its groups
- 🎥 Start a call within any discussion
- 💬 Send messages to any discussion or contact
- ✏️ Update its Olvid profile photo
- 📸 Update a group avatar
- 🗂️ Create new groups
- 👥 Add or remove members from groups you administer
- 🚪 Disband or leave existing groups

All actions are wrapped in agent tools, so you can call them directly from a prompt or from custom scripts.

## Installation

Follow our installation guide: https://doc.bot.olvid.io/openclaw.

## Tool List

The following tools are exposed by this skill.  Each tool’s is executed with the Bot's Olvid profile.

| Tool | Description |
|------|-------------|
| `olvid_list_discussions` | Shows a list of every discussion (private or group) that belongs to **your** Olvid profile, including IDs, titles, and participant details. |
| `olvid_list_contacts` | Returns the full contact list for **your** Olvid profile, with each contact’s ID, name, and status. |
| `olvid_list_groups` | Lists every Olvid group that **you** are a member of, including group IDs, names, and member lists. |
| `start_olvid_call` | Initiates a voice/video call inside any discussion that **belongs to you** (private or group). Returns the call ID. |
| `olvid_identity_set_photo` | Updates the **profile picture** for your own Olvid profile. Supplies the file path of the new image. |
| `olvid_group_set_photo` | Changes the avatar of an Olvid group you manage. Requires the group’s ID and the photo file path. |
| `olvid_group_add_member` | Adds a contact (by ID) to an Olvid group **you’re an admin of**, therefore giving you control over group membership. |
| `olvid_group_kick_member` | Removes a contact from an Olvid group you administer. |
| `create_olvid_group` | Creates a new Olvid group under **your** Olvid profile. Specify the group name and the IDs of the initial members. |
| `olvid_group_disband` | Disbands an Olvid group of which you are a member. |
| `olvid_group_leave` | Leaves an Olvid group that you’re a member of. The group remains for others, but you cease to see its updates. |

### Using the Tools

When invoking a tool, you typically need to pass the optional `olvidChannelAccountId`.  
If omitted, the skill will use the default Olvid client attached to your session.

```ts
{
  action: "execute",
  name: "olvid_list_discussions",
  params: { olvidChannelAccountId: "yourId" }
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
