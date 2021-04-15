import { Guild, GuildMember, Message, TextChannel } from 'discord.js';
import { FieldsEmbed } from 'discord-paginationembed';
import { asyncForEach, msgCatch } from '../../common';
import { MeetupsDB, Region, Member } from './MeetupsDB';
import commands from '../command_help.json';

const rmSpecialChars = (text: string): string => {
  text = text.replace('é', 'e');
  return text;
};

const memberList = async (message: Message, guild: Guild, region: Region): Promise<string | void> => {
  const members: Member[] = MeetupsDB.getMembersInRegion(region);

  if (members.length === 0) return 'No members';

  const displayNames: string[] = [];
  await asyncForEach(members, async (mb: Member, i: number) => {
    return await guild.fetchMember(mb.id)
    .then((gl) => {
      displayNames.push(gl.displayName);
    })
    .catch(async () =>
      await MeetupsDB.removeMemberFromRegionByIndex(i, region)
    )
    .catch(() => {});
  });

  const sort = (a: string, b: string) => a.localeCompare(b);

  const Pagination = new FieldsEmbed<string>();

  Pagination
    .setChannel(message.channel as TextChannel)
    .setDisabledNavigationEmojis(['DELETE'])
    .setElementsPerPage(20)
    .setPageIndicator(true)
    .setArray(displayNames.sort(sort))
    .formatField(`List of Members: (${members.length})`, name => name);

  return await Pagination.build();
};

const regionList = async (): Promise<string> => {
  const regions: Region[] = await MeetupsDB.getRegionList();

  let msg = 'List of Regions:\n';
  regions.forEach((region) => {
    msg += `${region.name}\n`;
  });

  return msg;
};

/**
 * @param user the user who sent the message
 * @param args array of text from the message
 * @example
 * !region ['list']
 * !region 'add|remove' <region name>
 * !region 'rename' <region name> <new name>
 *
 * !region <region name> ['ping|list']
 * !region <region name> 'join|leave'
 * !region <region name> 'add|remove' <@guildMember>
 */
export default async function (
  message: Message, args: string[], mentions: string[], guild?: Guild, user?: GuildMember
): Promise<string | void> {
  if (!guild || !user) {
    return 'You can only use this command in a guild';
  }

  const moderator = Boolean(user.hasPermission('ADMINISTRATOR'));

  if (args.length === 0 || args[0] === '') {
    return await regionList();
  }

  try {
    switch (args[0].toLowerCase()) {
      case 'list': {
        return await regionList();
      }
      case 'add':
        if (moderator) {
          if (args.length < 2) return '!region add <region name>';
          return await MeetupsDB.addRegion(args[1])
        .then((regionName) => `Added new region ${regionName}`)
        .catch(err => { throw err; });
        }
        break;
      case 'remove':
        if (moderator) {
          if (args.length < 2) return '!region remove <region name>';
          return await MeetupsDB.getRegion(args[1])
        .then(async (region) => {
          return await MeetupsDB.removeRegion(region);
        })
        .then((region) => `Removed region ${region.name}`)
        .catch(err => { throw err; });
        }
        break;
      case 'rename':
        if (moderator) {
          if (args.length < 3) return '!region rename <region name> <new name>';
          return await MeetupsDB.getRegion(args[1])
        .then(async (region: Region) => {
          return await MeetupsDB.renameRegion(region, args[2]);
        })
        .then(() => `Renamed ${args[1]} -> ${args[2]}`)
        .catch(err => { throw err; });
        }
        break;
      case 'details':
        return await MeetupsDB.getRegionList()
      .then((regions: Region[]) => {
        let msg = 'Number of members per region:\n';
        regions.forEach((region: Region) => {
          if (region.members.length === 0)
            msg += `${region.name} (no members)\n`;
          else if (region.members.length === 1)
            msg += `${region.name} (1 member)\n`;
          else
            msg += `${region.name} (${region.members.length} members)\n`;
        });
        return msg;
      });
        // Assume user provided region name
      default: {
        const region: Region = await MeetupsDB.getRegion(rmSpecialChars(args[0]))
        .then((region: Region) => region)
        .catch(err => { throw err; });

        if (args.length < 2) {
          return await memberList(message, guild, region);
        }

        const param = args[1].toLowerCase();

        if (mentions.length > 0) {
          switch (param) {
            case 'add':
              if (moderator) {
                const added: string[] = [];
                await asyncForEach(mentions, async (id: string) =>
                  await guild.fetchMember(id)
                  .then(async (mb) =>
                    await MeetupsDB.addMemberToRegion(mb, region)
                  )
                  .then((mb) => {
                    added.push(mb.displayName);
                  })
                  .catch(msgCatch)
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
                  return await guild.fetchMember(id)
                  .then(async (mb) =>
                    await MeetupsDB.removeMemberFromRegion(mb, region)
                  )
                  .then((mb) => {
                    removed.push(mb.displayName);
                  })
                  .catch(msgCatch);
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
              return `!region ${args[0]} 'add|remove' <@guildMember>`;
          }
        }

        switch (param) {
          case 'list':
            return await memberList(message, guild, region);
          case 'join':
            return await MeetupsDB.addMemberToRegion(user, region)
            .then(() => `${user.displayName} joined ${region.name}`)
            .catch(err => { throw err; });
          case 'leave':
            return await MeetupsDB.removeMemberFromRegion(user, region)
            .then(() => `${user.displayName} left ${region.name}`)
            .catch(err => { throw err; });
          case 'ping':
            let msg = '';
            MeetupsDB.getMembersInRegion(region).forEach((mb: Member) => {
              msg += `<@!${mb.id}> `;
            });
            return msg;
          default:
            return `!region ${args[0]} 'join|leave|list'\n`;
        }
      }
    }
  }
  catch (err) {
    return Promise.resolve(err);
  }

  return commands.region.cmd;
}
