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

## Tool List

The following tools are exposed by this skill.  Each tool’s is executed with the Bot's Olvid profile.

| Tool                       | Description                                                                                                                                 |
|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `olvid_list_discussions`   | Shows a list of every discussion (private or group) that belongs to **your** Olvid profile, including IDs, titles, and participant details. |
| `olvid_list_contacts`      | Returns the full contact list for **your** Olvid profile, with each contact’s ID, name, and status.                                         |
| `olvid_list_groups`        | Lists every Olvid group that **you** are a member of, including group IDs, names, and member lists.                                         |
| `olvid_start_call`         | Initiates a voice/video call inside any discussion that **belongs to you** (private or group). Returns the call ID.                         |
| `olvid_group_set_photo`    | Changes the avatar of an Olvid group you manage. Requires the group’s ID and the photo file path.                                           |
| `olvid_group_add_member`   | Adds a contact (by ID) to an Olvid group **you’re an admin of**, therefore giving you control over group membership.                        |
| `olvid_group_kick_member`  | Removes a contact from an Olvid group you administer.                                                                                       |
| `olvid_create_group`       | Creates a new Olvid group under **your** Olvid profile. Specify the group name and the IDs of the initial members.                          |
| `olvid_group_disband`      | Disbands an Olvid group of which you are a member.                                                                                          |
| `olvid_group_leave`        | Leaves an Olvid group that you’re a member of. The group remains for others, but you cease to see its updates.                              |

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
