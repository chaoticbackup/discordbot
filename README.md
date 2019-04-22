# Chaotic Backtalk
A bot which checks the forum for new messages along with other Chaotic related features.

For information on setting up and adding the bot to a server check the [wiki](https://github.com/chaoticbackup/discordbot/wiki).

### Installation
This bot is written in Javascript using Nodejs ([node installation](https://nodejs.org/en/)) and Discord.js ([documentation](https://discord.js.org/#/docs/main/stable/general/welcome))
```bash
npm install
```

### Development Running
To start the bot in development mode
```bash
npm start
```

### Production Deployment
To run and build the production server
```
npm run prod
```

If you need it to run in the background (such as on [AWS EC2 Hosting](https://github.com/chaoticbackup/discordbot/wiki/AWS-EC2-Hosting))
```bash
npm run forever
```
To stop the forever instance
```bash
npm run stop
```
If the server is currently running and you wish to rebuild new changes
```bash
npm run rebuild
```

Since the project uses Babel, the code gets preprocessed (The prod and forever commands build the project by default)
```bash
npm run build
```
You can clean the build folder with
```bash
npm run clean
```
