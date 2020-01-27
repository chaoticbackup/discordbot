import { Guild, GuildMember, Snowflake } from 'discord.js';
import Loki, { Collection } from 'lokijs';
import path from 'path';
import { asyncForEach } from '../../common';
import db_path from '../../database/db_path';
const LokiFSStructuredAdapter = require('lokijs/src/loki-fs-structured-adapter');

class Region {
    public name: string;
    public members: Member[];
}

class Member {
    public id: Snowflake;

    constructor(member: GuildMember) {
      this.id = member.id;
    }
}

class MeetupsAPI {
    private regions: Collection<Region>;

    constructor() {
      const db = new Loki(path.resolve(db_path, 'regions.db'), {
        autosave: true,
        autoload: true,
        autosaveInterval: 4000,
        adapter: new LokiFSStructuredAdapter(),
        autoloadCallback: () => {
          const regions = db.getCollection('regions') as Collection<Region>;
          if (regions === null) {
            this.regions = db.addCollection('regions');
          }
          else {
            this.regions = regions;
          }
        }
      });
    }

    addRegion = async (regionName: string) => {
      const region = this.regions.findOne({ name: regionName });
      if (region) throw new Error(`Region "${region}" already exists`);
      this.regions.insert({ name: regionName, members: [] });
    }

    getRegion = async (regionName: string): Promise<Region> => {
      const region = this.regions.findOne({ name: regionName });
      if (!region) throw new Error(`Region "${regionName}" does not exist`);
      return region;
    }

    removeRegion = async (region: Region) => {
      this.regions.remove(region);
    }

    getRegionList = async (): Promise<Region[]> => {
      return this.regions.chain().simplesort('name').data();
    }

    renameRegion = async (region: Region, newName: string) => {
      return this.regions.findAndUpdate({ name: region.name }, (rg: Region) => {
        rg.name = newName;
      });
    }

    convertGuildMember = (member: GuildMember): Member => {
      return new Member(member);
    }

    getMembersInRegion = async (region: Region): Promise<Member[]> => {
      return region.members;
    }

    findMemberRegionIndex = async(member: GuildMember, region: Region): Promise<number> => {
      return this.getMembersInRegion(region).then((members: Member[]) => {
        return members.findIndex((mb) => mb.id === member.id);
      });
    }

    addMemberToRegion = async (member: GuildMember, region: Region) => {
      return this.findMemberRegionIndex(member, region).then((i: number) => {
        if (i >= 0) {
          throw new Error(`${member.displayName} is already in ${region.name}`);
        }

        this.regions.findAndUpdate({ name: region.name }, (rg: Region) => {
          rg.members.push(this.convertGuildMember(member));
        });
      });
    }

    removeMemberFromRegionByIndex = async (i: number, region: Region) => {
      this.regions.findAndUpdate({ name: region.name }, (rg: Region) => {
        rg.members.splice(i, 1);
      });
    }

    removeMemberFromRegion = async (member: GuildMember, region: Region) => {
      return this.findMemberRegionIndex(member, region).then((i: number) => {
        if (i < 0) {
          throw new Error(`${member.displayName} is not a member of ${region.name}`);
        }
        this.removeMemberFromRegionByIndex(i, region);
      });
    }
}

const MeetupsDB = new MeetupsAPI();

const rmSpecialChars = (text: string): string => {
  text = text.replace('é', 'e');
  return text;
}

/**
 * @param user the user who sent the message
 * @param args array of text from the message
 * @example
 * // !region <list|>
 * // !region <add|remove> <regionName>
 * // !region <rename> <regionName> <newName>
 *
 * // !region <regionName> <ping|list|>
 * // !region <regionName> <join|leave>
 * // !region <regionName> <add|remove> <@guildMember>
 */
export default async (user: GuildMember, guild: Guild, args: string[], mentions: string[]): Promise<string> => {
  const moderator = Boolean(user.roles.find(role => role.name === 'lord emperor'));

  const regionList = async (): Promise<string> => {
    const regions: Region[] = await MeetupsDB.getRegionList();

    let msg = 'List of Regions:\n';
    regions.forEach((region) => {
      msg += region.name + '\n';
    });

    return Promise.resolve(msg);
  }

  const memberList = async (region: Region): Promise<string> => {
    const members: Member[] = await MeetupsDB.getMembersInRegion(region);

    if (members.length === 0) return Promise.resolve('No members');

    let msg = `List of Members: (${members.length})\n`;
    const displayNames: string[] = [];
    await asyncForEach(members, async (mb: Member, i: number) => {
      await guild.fetchMember(mb.id)
        .then((gl: GuildMember) => {
          displayNames.push(gl.displayName);
        })
        .catch((_err) => {
          MeetupsDB.removeMemberFromRegionByIndex(i, region);
        });
    });

    displayNames
      .sort((a: string, b: string) => a.localeCompare(b))
      .forEach((name: string) => {
        msg += name + '\n';
      });

    return Promise.resolve(msg);
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
          .then((region: Region) => {
            return MeetupsDB.removeRegion(region);
          })
          .catch((err: Error) => { return err.message })
          .then(() => {
            return `Removed region ${args[1]}`;
          });
      }
      break;
    case 'rename':
      if (moderator) {
        if (args.length < 2) return '!region add <regionName>';
        return MeetupsDB.getRegion(args[1])
          .then((region: Region) => {
            return MeetupsDB.renameRegion(region, args[2]);
          })
          .catch((err: Error) => { return err.message })
          .then(() => {
            return `Renamed ${args[1]} -> ${args[2]}`;
          });
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
                    msg += name + ', ';
                  });
                  msg = msg.slice(0, -2) + ' to ' + region.name;
                  return Promise.resolve(msg);
                }
                return Promise.resolve(`No users were added to ${region.name}`);
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
                    msg += name + ', ';
                  });
                  msg = msg.slice(0, -2) + ' from ' + region.name;
                  return Promise.resolve(msg);
                }
                return Promise.resolve(`No users were removed from ${region.name}`);
              }
              break;
            default:
              return Promise.resolve(`!region ${args[0]} <add|remove> <guildMember>`);
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
            return MeetupsDB.getMembersInRegion(region)
              .then(async (members: Member[]) => {
                let msg = '';
                await asyncForEach(members, async (mb: Member) => {
                  msg += `<@!${mb.id}> `;
                });
                return msg;
              })
              .catch((err: Error) => {
                return (err.message);
              });
          default:
            return Promise.resolve(`!region ${args[0]} <join|leave|list>\n`);
        }
      }
      catch (err) {
        return Promise.resolve(err.message);
      }
    }
  }

  return Promise.resolve('!region <regionName> <join|leave|ping|list|>');
}
