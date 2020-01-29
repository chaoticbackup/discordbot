import { Guild, GuildMember } from 'discord.js';
import { asyncForEach } from '../../common';
import { MeetupsDB, Region, Member } from './MeetupsDB';

const rmSpecialChars = (text: string): string => {
  text = text.replace('é', 'e');
  return text;
}

const memberList = async (guild: Guild, region: Region): Promise<string> => {
  const members: Member[] = MeetupsDB.getMembersInRegion(region);

  if (members.length === 0) return 'No members';

  const displayNames: string[] = [];
  await asyncForEach(members, async (mb: Member, i: number) => {
    return guild.fetchMember(mb.id)
    .then((gl) => {
      displayNames.push(gl.displayName);
    })
    .catch(async () =>
      MeetupsDB.removeMemberFromRegionByIndex(i, region)
    )
    .catch(() => {});
  });

  let msg = `List of Members: (${members.length})\n`;

  displayNames
  .sort((a: string, b: string) => a.localeCompare(b))
  .forEach((name: string) => {
    msg += `${name}\n`;
  });

  return msg;
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
        .then((regionName) => `Added new region ${regionName}`)
        .catch((err: Error) => err.message);
      }
      break;
    case 'remove':
      if (moderator) {
        if (args.length < 2) return '!region add <regionName>';
        return MeetupsDB.getRegion(args[1])
        .then(async (region) => {
          return MeetupsDB.removeRegion(region);
        })
        .then((region) => `Removed region ${region.name}`)
        .catch((err: Error) => err.message);
      }
      break;
    case 'rename':
      if (moderator) {
        if (args.length < 2) return '!region add <regionName>';
        return MeetupsDB.getRegion(args[1])
        .then(async (region: Region) => {
          return MeetupsDB.renameRegion(region, args[2]);
        })
        .then(() => `Renamed ${args[1]} -> ${args[2]}`)
        .catch((err: Error) => err.message);
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
        .then((region: Region) => region)
        .catch((err: Error) => { throw err });

        if (args.length < 2) {
          return memberList(guild, region);
        }

        const param = args[1].toLowerCase();

        if (mentions.length > 0) {
          switch (param) {
            case 'add':
              if (moderator) {
                const added: string[] = [];
                await asyncForEach(mentions, async (id: string) =>
                  guild.fetchMember(id)
                  .then(async (mb) =>
                    MeetupsDB.addMemberToRegion(mb, region)
                  )
                  .then((mb) => {
                    added.push(mb.displayName);
                  })
                  .catch(() => {})
                );
                if (added.length > 0) {
                  let msg = 'Added ';
                  added.forEach((name) => {
                    msg += `${name}, `;
                  });
                  return `${msg.slice(0, -2)} to ${region.name}`;
                }
                return `No users were added to ${region.name}`;
              }
              break;
            case 'remove':
              if (moderator) {
                const removed: string[] = [];
                await asyncForEach(mentions, async (id: string) => {
                  return guild.fetchMember(id)
                  .then(async (mb) =>
                    MeetupsDB.removeMemberFromRegion(mb, region)
                  )
                  .then((mb) => {
                    removed.push(mb.displayName);
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
            return memberList(guild, region);
          case 'join':
            return MeetupsDB.addMemberToRegion(user, region)
            .then(() => `${user.displayName} joined ${region.name}`)
            .catch((err: Error) => err.message);
          case 'leave':
            return MeetupsDB.removeMemberFromRegion(user, region)
            .then(() => `${user.displayName} left ${region.name}`)
            .catch((err: Error) => err.message);
          case 'ping':
            let msg = '';
            MeetupsDB.getMembersInRegion(region).forEach((mb: Member) => {
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
