const {
    Command
} = require('discord-akairo');
const {
    MessageCollector
} = require('discord.js');

const VC = [
    '187626540161433609',
    '369175592370831360',
    '369175615674253324',
    '465149813017542667',
    '465149863609499658'
]

module.exports = class StartPlayTestCommand extends Command {
    constructor() {
        super('startplaytest', {
            aliases: ['startplaytest', 'spt'],
            description: 'Starts the playtests session.',
            ownerOnly: true,
            args: [{
                id: 'playtestid',
                match: 'content',
                default: "upcoming"
            }]
        });
    }

    async exec(msg, {
        playtestid
    }) {
        if (playtestid == "upcoming") playtestid = {
            where: {
                Finished: false
            },
            order: [
                ['When', 'ASC']
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
        if (ready !== true) return msg.reply('Aborting playtest.\n' + ready);
        msg.channel.send("Starting playtest.");
        var pairs = [];
        for (var i = 0; i < Math.floor(players / 2); i++) {
            var num1 = Math.floor(Math.random() * players);
            players = this.client.helper.arrayRemove(players, num1);
            var num2 = Math.floor(Math.random() * players);
            players = this.client.helper.arrayRemove(players, num2);
            pairs.push([num1, num2]);
        }
        msg.channel.send(`Generated player pairs:
${pairs.map((pair, ind) => `Pair ${ind+1}:
${this.client.users.find(pair[0]).username}
${this.client.users.find(pair[1]).username}`).join('\n')}

Moving players to voicechannel in 10 seconds.`);
        await new Promise(() => setTimeout(() => {
            pairs.forEach((ele, ind) => {
                for (var user in ele) {
                    msg.guild.members.get('user').setVoiceChannel(VC[ind]);
                }
            })
        }, 10000));
        var time = new Date();
        msg.channel.send("Stage 0 complete. Entering stage 1. Please start searching according to the pair number in ascending order.");
        playtest.Phase = 1;
        await new Promise(() => setTimeout(() => {
            msg.channel.send("5 minutes remaining of Phase 1.");
        }, 2100000));
        await new Promise(() => setTimeout(() => {
            players = Object.assign([], playtest.Attendees);
            msg.channel.send("This marks the end of Phase 1. Now entering Phase 2.");
            playtest.Phase = 2;
        }, 300000));
        await new Promise(() => setTimeout(() => {
            msg.channel.send("5 minutes remaining of Phase 2.");
        }, 900000));
        await new Promise(() => setTimeout(() => {
            msg.channel.send("This marks the end of Phase 2. Please everyone join a common channel to discuss today's playtest.");
            playtest.Phase = 3;
        }, 300000));
        await new Promise(() => setTimeout(() => {
            msg.channel.send("And that marks today's playtest. Thank you for attending and have a nice day!");
            playtest.Phase = 4;
            playtest.Finished = true;
            playtest.Pairs = JSON.stringify(pairs.map((ele) => ele.map((usr) => this.client.users.get(usr).username)));
        }, 600000));
        this.client.database.findOne({
            where: {
                id: playtest.id
            }
        }).then((res) => {
            res.update(playtest);
        })
    }

    readyCheck(msg, playtest) {
        return new Promise((resolve, reject) => {
            msg.channel.send(`Playtest ${playtest.id} has been started. Performing ready-check.`);
            msg.channel.send(`Please send a message in the channel, so you are marked as ready. You have 5 minutes to check in. ${playtest.Attendees.map((e) => `<@!${e}>`).join(' ')}`);
            var toCollect = playtest.Attendees;
            let collector = new MessageCollector(msg.channel, mess => toCollect.indexOf(mess.author.id) != -1);
            var waittime = setTimeout(() => collector.stop("timeout"), 300000);
            collector.on('collect', (mess) => {
                console.log(msg);
                this.delegateSend(msg.channel.id, "test");
                toCollect = this.client.helper.arrayRemove(toCollect, mess.author.id);
                if (toCollect.length == 0) {
                    collector.stop("ready");
                    clearTimeout(waittime);
                }
            });
            collector.on('end', (coll, reason) => {
                if (reason == "ready") {
                    this.delegateSend(msg.channel.id, 'Everyone is ready. Initalizing Groups.');
                    resolve(true);
                }
            })
        })
    }

    delegateSend (channel, message) {
        this.client.channels.get(channel).send(message)
    };

    /*
    readyCheck(msg, playtest) {
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
}