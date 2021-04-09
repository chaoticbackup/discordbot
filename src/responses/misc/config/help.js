/* eslint-disable max-len */
// File is js until I remove all the comments, then can revert to json
module.exports = {
    "card": {
        "cmd": "!card <card-name|> [;<card-name>...]", 
        "list": "Returns a card; has many options", 
        "details": "Provide a card name and I'll return the card's text as well as its picture.\nWithout a card name, I'll return a random card. You can ask for multiple cards using a semi-colon\nYou can use ``--type=`` for card type or ``--tribe=`` for a Tribe (no space after the = ).\nAdditional options are ``--min``, ``--max``, ``--detailed``, ``--text``, ``--stats``, ``--ability``, ``--image``"
    },
    "cards": {
        "cmd": "!cards [<card-name>] [;<card-name>]...",
        "alias": "card"
    },
    "ability": {
        "cmd": "!ability [<card-name>] [;<card-name>]...",
        "details": "I only show the ability, subtypes, and stats of a card. Equivalent to ``!card --ability``"
    },
    "text": {
        "cmd": "!text [<card-name>] [;<card-name>]...",
        "details": "I'll show all the card information without the card image. Equivalent to ``!card --text``"
    },
    "stats": {
        "cmd": "!stats [<card-name>] [;<card-name>]...",
        "details": "I'll only show the stats of a card. Equivalent to ``!card --stats``"
    },
    "image": {
        "cmd": "!image [<card-name>] [;<card-name>]...",
        "details": "I'll only show the card image. Equivalent to ``!card --image``"
    },
    "fullart": {
        "cmd":"!fullart [<card-name>]", 
        "list": "", 
        "details": "You provide a card name, I'll look for its full art.\nSome pieces have alternative, which you can access via ``--alt`` or ``--alt2``"
    },
    "full": {
        "cmd": "!full [<card-name>]",
        "alias": "fullart"
    },
    "cutout": {
        "cmd": "!cutout [<card-name>]",
        "details": "I'll show you a cutout art of a Creature card"
    },
    "avatar": {
        "cmd": "!avatar [<card-name>]",
        "alias": "cutout"
    },
    "find": {
        "cmd": "!find <input>", 
        "list": "Returns card names that contain supplied input", 
        "details": "I'll search for card names that contain the letters you provide."
    },
    "rate": {
        "cmd":"!rate <Creature> <Courage> <Power> <Wisdom> <Speed> <Energy>", 
        "list": "I'll rate a Creature based on its stats",
        "details": "I have three methods ``--metal``, ``--king``, or ``--smildon`` (default metal)."
    },
    "readthecard": {
        "cmd": "!readthecard <card-name>",
        "details": "I have discord read the card's ability using text to speech.\nUse ``--brainwashed`` for brainwashed text.",
        "mod": true
    },
    "parasite": {
        "cmd": "!parasite ['token'] 'orange'|'blue' ['1'|'2']",
        "details": "Returns the specified parasite token"
    },
    "token": {
        "cmd": "!token 'orange'|'blue' ['1'|'2']",
        "alias": "parasite"
    },
    "faq": {
        "cmd": "!faq <phrase>",
        "list": "Answers to some of the common questions"
    },
    "rule": {
        "cmd": "!rule <rule>",
        "list": "Returns the definition of the rule"
    },
    "keyword": {
        "cmd": "!keyword <rule>",
        "alias": "rule"
    },
    "documents": {
        "cmd": "!rulebook, !cr, !errata, !guide", 
        "list": "The important documents. Use any of these commands"
    },
    "rulebook": {
        "cmd":"!rulebook <language|> <set|>", 
        "details": "You can ask for a different different rulebooks. If you don't tell me otherwise, I'll return the equivalent of ``!rulebook EN AU``\nFor a list of all rulebooks I have, type ``!rulebook --list``"
    },
    "rulebooks": {
        "cmd": "!rulebooks",
        "details": "I show a list of rulebooks I have. Equivalent to ``!rulebook --list``"
    },
    "cr": {
        "cmd": "!cr [<section>]",
        "details": "I'll give you the Comphrensive Rules document, or just the section specified"
    },
    "comprehensive": {
        "cmd": "!comprehensive",
        "details": "I'll give you the Comphrensive Rules document"
    },
    "errata": {
        "cmd": "!errata",
        "details": "I'll give you the official errata document"
    },
    "guide": {
        "cmd": "!guide",
        "details": "It's a player made guide that provides a more thorough explaination of the basic rules"
    },
    "starters": {
        "cmd":"!starters", 
        "list": "Player made starter decks", 
        "details": "I'll provide a list of starter decks. Default are Metal's old recode starter decks, but you can add ``--king`` or ``--ivan`` for different ones."
    },
    "starter": {
        "alias": "starters"
    },
    "formats": {
    // TODO
    },
    "banlist": {
        "cmd": "!banlist\n!ban, !whyban <card-name>",
        "list":"You can use `!format` for the list of formats", 
        "details": "Ask me about the banlist or why a card is or could be banned.\nThere are different ``!formats`` with their own banlists."
    },
    "standard": {
    // TODO
    },
    "legacy": {
    // TODO
    },
    "modern": {
    // TODO
    },
    "pauper": {
    // TODO
    },
    "noble": {
    // TODO
    },
    "ban": {
    // TODO
    },
    "whyban": {
    // TODO
    },
    "strong": {
        "cmd": "!strong <type|tribe> <bp|type>",
        "alias": "good"
    },
    "good": {
        "cmd": "!good <type|tribe> < bp|type >", 
        "list": "Returns a list of good cards", 
        "details": "Asking about good cards? What'cha looking for?\nI can give by type, or if you need something more specific: by build point or tribe.\n``!good M'arrillian Creatures``\n ``!good Attacks 1``"
    },
    "goodstuff": {
        "cmd": "!goodstuff <type|tribe> < bp|type >", 
        "alias": "good"
    },
    "deck": {
    // TODO
    },
    "decks": {
    // TODO
    },
    "decklist": {
    // TODO
    },
    "tier": {
    // TODO
    },
    "tierlist": {
        "cmd": "!tierlist [<tribe|tier>]",
        "list": "Returns the tierlist or a subsection based on tribe or tier"
    },
    "tiers": {
    // TODO
    },
    "cupid": {
        "alias": "lf"
    },
    "if": {
        "alias": "lf"
    },
    "lf": {
        "cmd": "!lf [<type>]",
        "list": "Adds or removes specific match making roles"
    },
    "lookingfor": {
        "alias": "lf"
    },
    "match": {
    // TODO
    },
    "cancel": {
    // TODO
    },
    "donate": {
    // TODO
    },
    "collection": {
    // TODO
    },
    "portal": {
    // TODO
    },
    "recode": {
    // TODO
    },
    "forum": {
    // TODO
    },
    "fun": {
    // TODO
    },
    "funstuff": {
    // TODO
    },
    "agame": {
    // TODO
    },
    "menu": {
    // TODO
    },
    "order": {
    // TODO
    },
    "make": {
    // TODO
    },
    "cook": {
    // TODO
    },
    "speak": {
    // TODO
    },
    "speaker": {
    // TODO
    },
    "speakers": {
    // TODO
    },
    "language": {
        "cmd": "!language <language> 'join|leave|list'",
        "list": "Connect with other players of the same language!",
        "details": "To find out what languages you can join use ``!language list``"
    },
    "languages": {
        "alias": "language"
    },
    "region": {
    // TODO
    },
    "regions": {
    // TODO
    },
    "tribe": {
        "cmd": "!tribe 'join|leave' [<tribe>]", 
        "list": "You can join your favorite tribe (or lack thereof)", 
        "details": "Here are the tribes you can join:\n <:Dan:294942889337683968> Danian, <:Mip:294941790052679690> Mipedian, <:Mar:294942283273601044> M'arrillian, <:OW:294939978897555457> OverWorld, <:UW:294943282943885313> UnderWorld, <:TL:294945357392248833> Tribeless\nYou can only be loyal to one... but you can always switch."
    },
    "bw": {
    // TODO
    },
    "brainwash": {
    // TODO
    },
    "colour": {
    // TODO
    },
    "color": {
    // TODO
    },
    "never": {
    // TODO
    },
    "nowornever": {
    // TODO
    },
    "non": {
    // TODO
    },
    "gone": {
    // TODO
    },
    "fan": {
    // TODO
    },
    "unset": {
    // TODO
    },
    "flirt": {
        "alias": "compliment"
    },
    "compliment": {
        "cmd":"!compliment [<name|@name>]", 
        "list": ""
    },
    "burn": {
        "alias": "insult"
    },
    "roast": {
        "alias": "insult"
    },
    "insult": {
        "cmd":"!insult [<name|@name>]", 
        "list": ""
    },
    "joke": {
    // TODO
    },
    "whistle": {
    // TODO
    },
    "trivia": {
    // TODO
    },
    "answer": {
    // TODO
    },
    "happy": {
    // TODO
    },
    "watch": {
        "cmd":"!watch <language> [<season>]", 
        "details": "You can watch Chaotic in various languages!\nIf a season number is followed by SD it isn't high definition.\nFor a list of all episodes I have, type ``!watch --list``"
    },
    "perim": {
        "cmd": "!perim 'help'",
        "list": "For all commands related to the scanquest use ``!perim help``"
    },
    "map": {
    // TODO
    },
    "help": {
    // TODO
    },
    "cmd": {
    // TODO
    },
    "commands": {
        "cmd": "", 
        "details": "This is for when you need help with my help"
    },
    "banhammer": {
    // TODO
    },
    "rm": {
    // TODO
    },
    "clear": {
    // TODO
    },
    "clean": {
    // TODO
    },
    "delete": {
    // TODO
    },
    "haxxor": {
    // TODO
    },
    "logs": {
    // TODO
    }
}

