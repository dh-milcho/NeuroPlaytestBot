const {
	Command
} = require('discord-akairo');
const {
	MessageCollector, ReactionCollector
} = require('discord.js');

const VC = [
	'187626540161433609',
	'369175592370831360',
	'369175615674253324',
	'465149813017542667',
	'465149863609499658'
];

const VCtest = [
	'467383821231456267',
	'467383840114081792',
	'467383854274052096',
	'467383866089275412',
	'467383877070225420'
];

module.exports = class StartPlayTestCommand extends Command {
	constructor() {
		super('startplaytest', {
			aliases: ['startplaytest', 'spt'],
			description: 'Starts the playtests session.',
			ownerOnly: true,
			args: [{
				id: 'playtestid',
				match: 'content',
				default: 'upcoming'
			}]
		});
	}
    
	userPermissions(msg) {
		return this.client.hasPermission(msg.member);
	}

	async exec(msg, {
		playtestid
	}) {
		if (playtestid == 'upcoming') playtestid = {
			where: {
				Finished: false
			},
			order: [
				['When', 'DESC']
			]
		};
		else playtestid = {
			where: {
				Finished: false,
				id: playtestid
			}
		};
		var playtest = await this.client.database.PLAYTESTS.findOne(playtestid);
		var players = Object.assign([], playtest.Attendees);
		var ready = await this.readyCheck(msg, playtest);
		if (!ready) return msg.reply('Aborting playtest.');
		await msg.channel.send('Starting playtest.');
		var pairs = [];
		var alone;
		if (players.length % 2 == 1) {
			alone = players[Math.floor(Math.random() * players.length)];
			players = this.client.helper.arrayRemove(players, alone);
		}
		var playerCount = Math.floor(players.length / 2);
		for (var i = 0; i < playerCount; i++) {
			var num1 = players[Math.floor(Math.random() * players.length)];
			players = this.client.helper.arrayRemove(players, num1);
			var num2 = players[Math.floor(Math.random() * players.length)];
			players = this.client.helper.arrayRemove(players, num2);
			pairs.push([num1, num2]);
		}
		msg.channel.send(`Generated player pairs:
${pairs.map((pair, ind) => `**Pair ${ind+1}**:
${this.client.users.get(pair[0]).username}
${this.client.users.get(pair[1]).username}`).join('\n')}
${alone == undefined ? '' : '\nPairless player: ' + this.client.users.find(m => m.id == alone).username + '\n'}
Moving players to voicechannel in 30 seconds.`);
		await new Promise((resolve) => setTimeout(() => {
			pairs.forEach((ele, ind) => {
				for (var user of ele) {
					msg.guild.members.get(user).setVoiceChannel(this.client.test ? VCtest[ind] : VC[ind]);
				}
			});
			resolve();
		}, 30000));
		var stages = [
			{
				text: 'Stage 0 complete. Entering stage 1. Please start searching according to the pair number in ascending order.',
				timeout: 2100000
			},
			{
				text: '5 minutes remaining of Phase 1.',
				timeout: 300000
			},
			{
				text: 'This marks the end of Phase 1. Now entering Phase 2.',
				function: () => players = Object.assign([], playtest.Attendees),
				timeout: 900000
			},
			{
				text: '5 minutes remaining of Phase 2.',
				timeout: 300000
			},
			{
				text: 'This marks the end of Phase 2. Please everyone join a common channel to discuss today\'s playtest.',
				timeout: 600000
			}, {
				end: true,
				text: 'And that marks today\'s playtest. Thank you for attending and have a nice day!',
				function: () => {
					playtest.Phase = 4;
					playtest.Finished = true;
					playtest.Pairs = JSON.stringify(pairs.map((ele) => ele.map((usr) => this.client.users.get(usr).username)));
					this.client.database.PLAYTESTS.findOne({
						where: {
							id: playtest.id
						}
					}).then((res) => {
						res.updateAttributes(playtest);
					});
				}
			}
		];
		/*msg.client.playtestStage = 0;
		var execFunction = () =>
		var idontknowhowtonamethisvariablesoitjustbeareallylongonewhatcouldgowrongreally = true;
		do {
			var 

		} while (idontknowhowtonamethisvariablesoitjustbeareallylongonewhatcouldgowrongreally);*/
		

	}


	readyCheck(msg, playtest) {
		return new Promise(async resolve => {
			msg.channel.send(`Playtest ${playtest.id} has been started. Performing ready-check.`);
			var tocheck = await msg.channel.send(`Please react to this message, so you are marked as ready. You have 5 minutes to check in. ${playtest.Attendees.map((e) => `<@!${e}>`).join(' ')}`);
			await tocheck.react('🤔');
			var toCollect = playtest.Attendees;
			var collector = new ReactionCollector(tocheck, () => true);
			var waittime = setTimeout(() => collector.stop('timeout'), 300000);
			collector.on('collect', (react) => {
				toCollect = this.client.helper.arrayRemove(toCollect, react.users.last().id);
				tocheck.edit(`Please react to this message, so you are marked as ready. You have 5 minutes to check in. ${toCollect.map((e) => `<@!${e}>`).join(' ')}`)
				if (toCollect.length == 0) {
					collector.stop('ready');
					clearTimeout(waittime);
				}
			});
                    
			collector.on('end', (coll, reason) => {
				if (reason == 'ready') msg.reply('Everyone is ready. Initalizing Groups.').then(resolve(true));
				if (reason == 'timeout') {
					msg.reply(`Users not ready are listed in the previous message. Type abort or start to decide.`);
					collector = new MessageCollector(msg.channel, mess => ['abort', 'start'].indexOf(mess.content.toLowerCase()) !== -1 && this.client.ownerID.includes(mess.author.id));
					collector.on('collect', (mess) => {
						if (mess.content.toLowerCase() == 'abort') resolve(false);
						if (mess.content.toLowerCase() == 'start') resolve(true);
						collector.stop();
					});
				}
			});
		});
	}
    
	/*readyCheck(msg, playtest) {
        return new Promise(resolve => {
            msg.channel.send(`Playtest ${playtest.id} has been started. Performing ready-check.`);
            msg.channel.send(`Please send a message in the channel, so you are marked as ready. You have 5 minutes to check in. ${playtest.Attendees.map((e) => `<@!${e}>`).join(' ')}`);
            var toCollect = playtest.Attendees;
            var collector = new MessageCollector(msg.channel, mess => toCollect.indexOf(mess.author.id) !== -1);
            var waittime = setTimeout(() => collector.stop("timeout"), 300000);
            collector.on('collect', (mess) => {
                toCollect = this.client.helper.arrayRemove(toCollect, mess.author.id);
                if (toCollect.length == 0) {
                    collector.stop("ready");
                    clearTimeout(waittime);
                }
            });
            
            collector.on('end', (coll, reason) => {
                if (reason == "ready") resolve(true);
                if (reason == "timeout") resolve(`Users not ready: ${toCollect.map(usr => this.client.users.get(us).username).join(' ')}.`);
            });
        });
    }*/
};