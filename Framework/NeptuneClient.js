const { AkairoClient, SequelizeProvider } = require('discord-akairo');
const moment = require('moment');
const chrono = require('chrono-node');

class NeptuneClient extends AkairoClient {
	constructor(config) {
		super({
			ownerID: config.ownerID,
			prefix: config.prefix,
			allowMention: true,
			commandDirectory: config.commandDirectory,
			inhibitorDirectory: config.inhibitorDirectory,
			listenerDirectory: config.listenerDirectory,
			disableEveryone: true,
			automateCategories: true,
			disabledEvents: ['TYPING_START'],
			defaultPrompt: {
				timeout: 'Prompt has been canceled. Time out.',
				ended: 'Retry limit reached. Please use `' + config.prefix + ' help <command>` for more information',
				cancel: 'Command has been cancelled.',
				start: 'Please provide argument.',
				retries: 0,
				time: 30000
			},
		});

		this.helper = require('./helper');
		this.database = require('../postgresql/models.js');
		this.config = config;
		this.bus = require('./bus.js');
		this.remind = require('./remind');
		this.settings = new SequelizeProvider(this.database.SETTINGS, {
			idColumn: 'Guild',
			dataColumn: 'JSON'
		});
		
		this.players = new SequelizeProvider(this.database.PLAYER);
	}

	async start(auth) {
		this.build();
		this.settings.init();
		await this.login(auth);
		//this.bus.addFunction(this.remind.checkReminds, false, 'Reminds');
		this.bus.loop = setInterval(this.bus.execFunctions, 5000);
	}

	hasPermission (member) {
		//return (member.roles.has('465238967663591455'));
		return true;
	}

	canAttend(member) {
		//return (member.roles.has('465238967663591455'));
		return true;
	}

	parseDate(input) {
		var parsedTime = moment(input);
		if (parsedTime.isValid()) return parsedTime;
		parsedTime = moment(new Date(this.helper.parseUgly(input).absolute));
		if (parsedTime.isValid()) return parsedTime;
		parsedTime = chrono.parseDate(input);
		if (parsedTime !== null) return parsedTime;
		return false;
	}
}

module.exports = NeptuneClient;
