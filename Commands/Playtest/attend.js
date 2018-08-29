const {
	Command
} = require('discord-akairo');

module.exports = class AttendCommand extends Command {
	constructor() {
		super('attend', {
			aliases: ['attend'],
			description: 'Marks you as attending for the upcoming playtest',
			args: [{
				id: 'playtestid',
				match: 'content',
				default: 'upcoming'
			}]
		});
	}
    
	userPermissions(msg) {
		if (this.client.canAttend(msg.member))
			return true;
		else
			msg.reply('Sorry, you are not part of the Sentry group.');
	}

	exec(msg, {playtestid}) {
		if (playtestid == 'upcoming') playtestid = {where: {Finished: false, When: {$gt: new Date()}},order: [['When', 'DESC']]};
		else playtestid = {where: {Finished: false, id: playtestid }};
		this.client.database.PLAYTESTS.findOne(playtestid).then((ele) => {
			if (ele == null) {
				msg.reply("Could not find any upcoming playtests.");
			}
			var players = ele.Attendees;
			if (ele.Attendees.indexOf(msg.author.id) !== -1) {
				var players = this.client.helper.arrayRemove(players, msg.author.id);
			} else {
				players.push(msg.author.id);
			}
			ele.update({
				Attendees: players
			}).then(() => {
				msg.reply(players.indexOf(msg.author.id) !== -1 ? `You successfully marked yourself as attending for the upcoming playtest.
The playtest will be at **${ele.When.toString()}**
Approximately in **${this.client.helper.forHumans((ele.When - new Date()) / 1000)}**
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
You will be notified of the playtest 30 minutes before it.
=======
You can type \`%remindme\` to be notified of the playtest 30 minutes before it.
>>>>>>> 0d269bdaa3b82a7dbbae2202d0f09175c57aa702
=======
You can type \`%remindme\` to be notified of the playtest 30 minutes before it.
>>>>>>> 0d269bdaa3b82a7dbbae2202d0f09175c57aa702
=======
You can type \`%remindme\` to be notified of the playtest 30 minutes before it.
>>>>>>> 0d269bdaa3b82a7dbbae2202d0f09175c57aa702
`: `You are no longer attending the playtest ID:**${ele.id}**`);
			});
		});
	}
};