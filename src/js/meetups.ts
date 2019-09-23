import { Guild, GuildMember, Snowflake } from 'discord.js';
import loki, { Collection } from 'lokijs';
const LokiFSStructuredAdapter = require('lokijs/src/loki-fs-structured-adapter');

class Region {
    public name: string;
    public members: Member[];
}

class Member {
    public id: Snowflake;
}

class MeetupsAPI {
    private db: Loki;
    private regions: Collection<Region>;

    async databaseInitialize() {
        let regions = this.db.getCollection("regions") as Collection<Region>;
        if (regions === null) {
            this.regions = this.db.addCollection("regions");
        }
        else {
            this.regions = regions;
        }
    }
    
    constructor() {
        this.db = new loki(`${__dirname}/../db/regions.db`, {
            autosave: true,
            autoload: true,
            autoloadCallback: this.databaseInitialize.bind(this),
            autosaveInterval: 4000,
            adapter: new LokiFSStructuredAdapter()
        });
    }

    addRegion = async (regionName: string) => {
        const region = this.regions.findOne({ name: regionName});
        if (region) throw new Error("Region already exists");
        this.regions.insert({name: regionName, members: []});
    }

    getRegion = async (regionName: string): Promise<Region> => {
        const region = this.regions.findOne({name: regionName});
        if (!region) throw new Error("Region does not exist");
        return region;
    }

    removeRegion = async (region: Region) => {
        this.regions.remove(region);
    }

    getRegionList = async (): Promise<Region[]> => {
        return this.regions.chain().simplesort('name').data();
    }

    addMemberToRegion = async (member: Member, regionName: string) => {
        this.regions.findAndUpdate({name: regionName}, ((rg: Region) => {
            rg.members.push(member);
        }));
    }

    removeMemberFromRegion = async (member: Member, regionName: string) => {
        this.regions.findAndUpdate({name: regionName}, ((rg: Region) => {
            let i = rg.members.findIndex((mb) => mb === member);
            if (i > 0) rg.members.splice(i, 1);
        }));
    }

    getMembersInRegion = async (region: Region): Promise<Member[]> => {
        return region.members;
    }
}

const MeetupsDB = new MeetupsAPI();

/**
 * @param member the user who sent the message
 * @param args array of text from the message
 * @example
 * // !region <list>
 * // !region <add|remove> <regionName> 
 * // !region <regionName> <list|>
 * // !region <regionName> <join|leave>
 * // !region <regionName> <add|remove> <guildMember>
 */
export const meetup = async (member: GuildMember, guild: Guild, args: string[]): Promise<String> => {
    const moderator = Boolean(member.roles.find(role => role.name == "lord emperor"));

    console.log(args, args.length);

    const regionList = (regions: Region[]) => {
        let msg = "List of Regions:\n";
        regions.forEach((region) => {
            msg += region.name + "\n";
        });
        return Promise.resolve(msg);
    }

    const memberList = (members: Member[]) => {
        let msg = "List of Members:\n";
        members.forEach(async (member) => {
            const gl: GuildMember = await guild.fetchMember(member.id);
            msg += gl.displayName + "\n";
        });
        return Promise.resolve(msg);
    }

    if (args[0] == '') {
        return MeetupsDB.getRegionList()
        .then(regionList);
    }

    switch(args[0].toLowerCase()) {
        case 'list': {
            return MeetupsDB.getRegionList()
            .then(regionList);
        }
        case 'add': {
            if (moderator) {
                if (args.length < 2) return "!region add <regionName>";
                return MeetupsDB.addRegion(args[1])
                .then(() => {
                    return `Added new region ${args[1]}`;
                })
                .catch((err: Error) => {return err.message});
            }
        }
        break;
        case 'remove': {
            if (moderator) {
                if (args.length < 2) return "!region add <regionName>";
                return MeetupsDB.getRegion(args[1])
                .then((region: Region) => {
                    return MeetupsDB.removeRegion(region);
                })
                .catch((err: Error) => {return err.message})
                .then(() => {
                    return `Removed region ${args[1]}`;
                });
            }
        }
        break;
        // Assume user provided region name
        default: {
            try {
                const region: Region = await MeetupsDB.getRegion(args[0])
                .then((regions: Region) => {return regions})
                .catch((err: Error) => {throw err});

                if (args.length < 2) {
                    return MeetupsDB.getMembersInRegion(region).then(memberList);
                }

                switch(args[1].toLowerCase()) {
                    case 'list': 
                        return MeetupsDB.getMembersInRegion(region).then(memberList);
                    case 'join':
                        return MeetupsDB.addMemberToRegion(member, args[0]).then(() => {
                            return `${member.displayName} joined ${region.name}`
                        });
                    case 'leave':
                        return MeetupsDB.removeMemberFromRegion(member, args[0]).then(() => {
                            return `${member.displayName} left ${region.name}`
                        });
                    default: return Promise.resolve(
                        `!region ${args[1]} <join|leave|list>\n` +
                        `!region ${args[1]} <add|remove> <guildMember>`
                    );
                }
            }
            catch (err) {
                return err.message; 
            }
        }
    }

    return Promise.resolve("");
}

