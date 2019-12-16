class Server {
    name: string;
    id: string;
    channels: Channel[];
    constructor({name, id, channels}: {name: string, id: string, channels: Channel[]}) {
        this.name = name;
        this.id = id;
        this.channels = channels;
    }
    channel (name: string): string {
        const channel = this.channels.find(channel => name === channel.name);
        if (channel) return channel.id;
        else return "";
    }
};

type Channel = {
    id: string;
    name: string;
}


export default function (name: string): Server {
    const server = servers.find(server => server.name === name);
    if (server == undefined) return new Server({name: "", id: "", channels: []});
    return server;
}

const servers: Server[] = [
    new Server ({
        name: "main",
        id: "135657678633566208",
        channels: [
            {
                name: "staff",
                id: "293610368947716096"
            },
            {
                name: "gen_1",
                id: "135657678633566208"
            },
            {
                name: "bot_commands",
                id: "387805334657433600"
            },
            {
                name: "match_making",
                id: "278314121198305281"
            },
            {
                name: "ruling_questions",
                id: "468785561533153290"
            },
            {
                name: "banlist_discussion",
                id: "473975360342458368"
            },
            {
                name: "meta_analysis",
                id: "418856983018471435"
            },
            {
                name: "other_games",
                id: "286993363175997440"
            },
            {
                name: "perim",
                id: "656156361029320704"
            },
        ]
    }),
    new Server ({
        name: "develop",
        id: "504052742201933824",
        channels: [
            {
                name: "gen",
                id: "504052742201933827"
            },
            {
                name: "errors",
                id: "558184649466314752"
            },
            {
                name: "bot_commands",
                id: "559935570428559386"
            }
        ]
    }),
    new Server ({
        name: "trading",
        id: "617128322593456128",
        channels: []
    }),
    new Server({
        name: "international",
        id: "624576671630098433",
        channels: [
            {
                name: "bot_commands",
                id: "624632794739376129"
            }
        ]
    }),
    new Server({
        name: "unchained",
        id: "339031939811901441",
        channels: [
            {
                name: "bot_commands",
                id: "392869882863026179"
            }
        ]
    })
];


