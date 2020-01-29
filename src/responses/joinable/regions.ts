import { Guild, GuildMember } from 'discord.js';
import { asyncForEach } from '../../common';
import { MeetupsDB, Region, Member } from './MeetupsDB';

const rmSpecialChars = (text: string): string => {
  text = text.replace('é', 'e');
  return text;
}

/**
 * @param user the user who sent the message
 * @param args array of text from the message
 * @example
 * !region <list|>
 * !region <add|remove> <regionName>
 * !region <rename> <regionName> <newName>
 *
 * !region <regionName> <ping|list|>
 * !region <regionName> <join|leave>
 * !region <regionName> <add|remove> <@guildMember>
 */
export default async (user: GuildMember, guild: Guild, args: string[], mentions: string[]): Promise<string> => {
  const moderator = Boolean(user.roles.find(role => role.name === 'lord emperor'));

  const regionList = async (): Promise<string> => {
    const regions: Region[] = await MeetupsDB.getRegionList();

    let msg = 'List of Regions:\n';
    regions.forEach((region) => {
      msg += `${region.name}\n`;
    });

    return msg;
  }

  const memberList = async (region: Region): Promise<string> => {
    const members: Member[] = await MeetupsDB.getMembersInRegion(region);

    if (members.length === 0) return 'No members';

    let msg = `List of Members: (${members.length})\n`;
    const displayNames: string[] = [];
    await asyncForEach(members, async (mb: Member, i: number) => {
      await guild.fetchMember(mb.id)
      .then((gl: GuildMember) => {
        displayNames.push(gl.displayName);
      })
      .catch(async (_err) => {
        return MeetupsDB.removeMemberFromRegionByIndex(i, region);
      })
      .catch(() => {});
    });

    displayNames
    .sort((a: string, b: string) => a.localeCompare(b))
    .forEach((name: string) => {
      msg += `${name}\n`;
    });

    return msg;
  }

  if (args.length === 0 || args[0] === '') {
    return MeetupsDB.getRegionList().then(regionList);
  }

  switch (args[0].toLowerCase()) {
    case 'list': {
      return MeetupsDB.getRegionList().then(regionList);
    }
    case 'add':
      if (moderator) {
        if (args.length < 2) return '!region add <regionName>';
        return MeetupsDB.addRegion(args[1])
        .then(() => {
          return `Added new region ${args[1]}`;
        })
        .catch((err: Error) => { return err.message });
      }
      break;
    case 'remove':
      if (moderator) {
        if (args.length < 2) return '!region add <regionName>';
        return MeetupsDB.getRegion(args[1])
        .then(async (region: Region) => {
          await MeetupsDB.removeRegion(region);
        })
        .catch((err: Error) => err.message)
        .then(() => `Removed region ${args[1]}`);
      }
      break;
    case 'rename':
      if (moderator) {
        if (args.length < 2) return '!region add <regionName>';
        return MeetupsDB.getRegion(args[1])
        .then(async (region: Region) => {
          await MeetupsDB.renameRegion(region, args[2]);
        })
        .catch((err: Error) => err.message)
        .then(() => `Renamed ${args[1]} -> ${args[2]}`);
      }
      break;
    case 'details':
      return MeetupsDB.getRegionList()
      .then((regions: Region[]) => {
        let msg = 'Number of members per region:\n';
        regions.forEach((region: Region) => {
          if (region.members.length === 0)
            msg += `${region.name} (no members)\n`
          else if (region.members.length === 1)
            msg += `${region.name} (1 member)\n`
          else
            msg += `${region.name} (${region.members.length} members)\n`
        });
        return msg;
      });
    // Assume user provided region name
    default: {
      try {
        const region: Region = await MeetupsDB.getRegion(rmSpecialChars(args[0]))
        .then((regions: Region) => { return regions })
        .catch((err: Error) => { throw err });

        if (args.length < 2) {
          return memberList(region);
        }

        const param = args[1].toLowerCase();

        if (mentions.length > 0) {
          switch (param) {
            case 'add':
              if (moderator) {
                const added: string[] = [];
                await asyncForEach(mentions, async (id: string) => {
                  await guild.fetchMember(id)
                  .then(async (mb: GuildMember) => {
                    await MeetupsDB.addMemberToRegion(mb, region);
                    return mb;
                  })
                  .then((mb) => {
                    return added.push(mb.displayName);
                  })
                  .catch(() => {});
                });
                if (added.length > 0) {
                  let msg = 'Added ';
                  added.forEach((name) => {
                    msg += `${name}, `;
                  });
                  msg = `${msg.slice(0, -2)} to ${region.name}`;
                  return msg;
                }
                return `No users were added to ${region.name}`;
              }
              break;
            case 'remove':
              if (moderator) {
                const removed: string[] = [];
                await asyncForEach(mentions, async (id: string) => {
                  await guild.fetchMember(id)
                  .then(async (mb: GuildMember) => {
                    await MeetupsDB.removeMemberFromRegion(mb, region);
                    return mb;
                  })
                  .then((mb) => {
                    return removed.push(mb.displayName);
                  })
                  .catch(() => {});
                });
                if (removed.length > 0) {
                  let msg = 'Removed ';
                  removed.forEach((name) => {
                    msg += `${name}, `;
                  });
                  msg = `${msg.slice(0, -2)} from ${region.name}`;
                  return msg;
                }
                return `No users were removed from ${region.name}`;
              }
              break;
            default:
              return `!region ${args[0]} <add|remove> <guildMember>`;
          }
        }

        switch (param) {
          case 'list':
            return memberList(region);
          case 'join':
            return MeetupsDB.addMemberToRegion(user, region)
            .then(() => {
              return `${user.displayName} joined ${region.name}`
            })
            .catch((err: Error) => {
              return (err.message);
            });
          case 'leave':
            return MeetupsDB.removeMemberFromRegion(user, region)
            .then(() => {
              return `${user.displayName} left ${region.name}`
            })
            .catch((err: Error) => {
              return (err.message);
            });
          case 'ping':
            const members: Member[] = MeetupsDB.getMembersInRegion(region);
            let msg = '';
            await asyncForEach(members, (mb: Member) => {
              msg += `<@!${mb.id}> `;
            });
            return msg;
          default:
            return `!region ${args[0]} <join|leave|list>\n`;
        }
      }
      catch (err) {
        return err.message;
      }
    }
  }

  return '!region <regionName> <join|leave|ping|list|>';
}
