# Chaotic Backtalk
A bot which checks the forum for new messages along with other Chaotic related features.

For information on setting up and adding the bot to a server check the [wiki](https://github.com/chaoticbackup/discordbot/wiki).

You can add the public bot to your server with [this invite link](https://discordapp.com/oauth2/authorize?client_id=279331985955094529&scope=bot&permissions=388160).  
Note: to reduce load on my server, this public bot does not have the full feature set.

### Installation
This bot is written in Javascript using Nodejs ([node installation](https://nodejs.org/en/)) and Discord.js ([documentation](https://discord.js.org/#/docs/main/stable/general/welcome))
```bash
npm install
```

If you wish to use the ScanQuest, you will need to have MongoDB ([mongodb](https://www.mongodb.com/try/download/community)).

Create an ``auth.json`` file in the ``src`` folder.
```json
{
    "token": "your bot token",
    "db_uri": "connection uri to mongodb"
}
```

### Development Running
To start the bot in development mode
```bash
npm start
npm start:scan
```
You can add an option to clean build the directory
```bash
npm start -- --clean
```

### Production Deployment

Since the project uses Babel, the code gets preprocessed (The prod and forever commands build the project by default)
```bash
npm run build
```
To run the production server
```
node build/bot.js
```

If you need it to run in the background (such as on [AWS EC2 Hosting](https://github.com/chaoticbackup/discordbot/wiki/AWS-EC2-Hosting))  
Install yarn on the host server ([yarn installation](https://classic.yarnpkg.com/en/docs/install/))
```bash
yarn forever
```
To stop the forever instance
```bash
yarn stop
```
If the server is currently running and you wish to rebuild new changes
```bash
yarn rebuild
```
