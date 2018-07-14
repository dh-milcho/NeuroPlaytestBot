const {	Command } = require('discord-akairo');
const util = require('util');

module.exports = class EvalCommand extends Command {
	constructor() {
		super('eval', {
			aliases: ['eval', '%'],
			ownerOnly: true,
			protected: true,
			args: [
				{
					id: 'code',
					match: 'content'
				}
			]
		});
	}
    
	async exec(msg, {code}) {

		const token = this.client.token.split('').join('[^]{0,2}');
		const rev = this.client.token.split('').reverse().join('[^]{0,2}');
		const tokenRegex = new RegExp(`${token}|${rev}`, 'g');
        
		try {
			var start = new Date();
			var ev = eval(code);
			var took = new Date() - start;
			var result = ev.replace(tokenRegex, '[TOKEN]');
			if (typeof result !== 'string') result = util.inspect(result, 0);
			return msg.reply(`**Code:**
\`\`|\`
${code}
\`\`\`
**Result:**
\`\`\`js
${result}
\`\`\`
Took: ${took} ms.
`);
		} catch (e) {
            e = e.toString();
			const token = this.client.token.split('').join('[^]{0,2}');
			const rev = this.client.token.split('').reverse().join('[^]{0,2}');
			const tokenRegex = new RegExp(`${token}|${rev}`, 'g');
			e = e.replace(tokenRegex, '[TOKEN]');
			return msg.reply(`**Code:**
\`\`|\`
${code}
\`\`\`
**Error:**
\`\`\`js
${e}
\`\`\`
Took: ${took} ms.
`);
		}
	}
}


