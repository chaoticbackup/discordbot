const jsdom = require("jsdom");
const jquery = require("jquery");
const {JSDOM} = jsdom;
const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.sendTo(console);

const config = {
	"seconds": 60,
	"default_channel": "135657678633566208",
	"test_channel": "504052742201933827",
	"forum": "http://chaoticbackup.forumotion.com"
}

function hm(date) {
	let h12 = date[date.length-1];
	let time = ((h12=="am"||h12=="pm") ? date[date.length-2] : date[date.length-1]).split(":");
	let hour, minute;

	if (h12 == "pm")
		hour = (parseInt(time[0]) < 12) ? parseInt(time[0]) + 12 : parseInt(time[0]);
	else if (h12 == "am")
		hour = (parseInt(time[0]) == 12) ? parseInt(time[0]) - 12 : parseInt(time[0]);
	else {
		hour = parseInt(time[0]);
	}
	minute = parseInt(time[1]);

	return {hour: hour, minute: minute};
}

const monthTable = {
	"Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3,
	"May": 4, "Jun": 5, "Jul": 6, "Aug": 7, 
	"Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
};

function md(date) {
	let month, day;
	if (date[date.length-2] == "-") {
		month = monthTable[date[2]];
		day = date[1];
	}
	else {
		month = monthTable[date[1]];
		day = date[2].slice(0, -1);
	}
	return {month: month, day: parseInt(day)};
}

function newDate(dateTime) {
	// Tue 27 Feb 2018 - 14:31
	let date = dateTime.split(" ");
	let year = parseInt(date[3]);
	let {month, day} = md(date);
	let {hour, minute} = hm(date);

	return new Date(year, month, day, hour, minute);
}

function post_time_diff(date, currenttime) {
	let post_time = new Date(currenttime.getTime());
	let {hour, minute} = hm(date);
	post_time.setHours(hour, minute);
	return (currenttime.getTime() - post_time.getTime());
}

module.exports = class ForumPosts {
	links = [];

	constructor(bot) {
		this.bot = bot;
		this.channel = (process.env.NODE_ENV != "development") ? config.default_channel : config.test_channel;
	}

	expireLink(id) {
		this.links.push(id)
		setTimeout((() => this.links.shift()).bind(this), 5*60*1000);
	}

	checkMessages() {
		// Simulated Browser
		const {window} = JSDOM.fromURL(config.forum, {
			virtualConsole
		})
		.then((dom) => {
			// const document = dom.window.document;
			// const bodyEl = document.body;
			// console.log(dom.serialize());
			const $ = jquery(dom.window);

			// List of new posts
			let news = [];

			let currenttime = newDate($('.current-time').contents().text().split("is ")[1]);

			// Latest posts
			var latest = $('.row1 span');
			$('.row1 span').contents()
			.filter(function() {
				return this.nodeType === 3; //Node.TEXT_NODE
			})
			.each( function( index, element ) {
				var date = ($( this ).text()).split(" ");
				if (date[0] == "Yesterday") return; // midnight misses
				else if (date[0] == "Today" || date[0] == "Yesterday") {
					if ((post_time_diff(date, currenttime))/1000 <= (config.seconds)) {
						news.push(latest[index]);
					}
				}
			});

			news.forEach((newPost, i) => {
				let topicurl = ($(newPost).children().filter('a.last-post-icon').attr('href'));

				// ignore subsequent notifications per post
				let id = topicurl.split('-')[0];
				if (this.links.includes(id)) return;
				else this.expireLink(id);

				let fullurl = config.forum + topicurl;
				let author = ($(newPost).children().filter('strong').children().children().children().text());
				let topic = ($(newPost).children().filter('a').first().attr('title'));
				let message = `${author} posted on "${topic}" -> <${fullurl}>`;
				this.bot.channels.get(this.channel).send(message);
			});

		});

		setTimeout(this.checkMessages.bind(this), config.seconds*1000);

	}

}
