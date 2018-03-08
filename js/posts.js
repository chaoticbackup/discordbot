const jsdom = require("jsdom");
const jquery = require("jquery");
const {JSDOM} = jsdom;
const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.sendTo(console);

const {reload} = require('./shared.js');
const {forum, default_channel} = require('../config/config.json');

const monthTable = {
  "Jan": 0,
  "Feb": 1,
  "Mar": 2,
  "Apr": 3,
  "May": 4,
  "Jun": 5,
  "Jul": 6,
  "Aug": 7,
  "Sep": 8,
  "Oct": 9,
  "Nov": 10,
  "Dec": 11
};

function hm(date) {
  var h12 = date[date.length-1];
  var time = ((h12=="am"||h12=="pm") ? date[date.length-2] : date[date.length-1]).split(":");
  var hour, minute;

  if (h12 == "pm")
    hour = (time[0] < 12) ? time[0] + 12 : time[0];
  else if (h12 == "am")
    hour = (time[0] == 12) ? time[0] - 12 : time[0];
  else {
    hour = time[0];
  }
  minute = time[1];

  return {hour: hour, minute: minute};
}

function md(date) {
  var month, day;
  if (date[date.length-2] == "-") {
    month = monthTable[date[2]];
    day = date[1];
  }
  else {
    month = monthTable[date[1]];
    day = date[2].slice(0, -1);
  }
  return {month: month, day: day};
}

function newDate(dateTime) {
  // Tue 27 Feb 2018 - 14:31
  var date = dateTime.split(" ");

  var year = date[3];

  var {hour, minute} = hm(date);
  var {month, day} = md(date);

  return new Date(year, month, day, hour, minute, (new Date()).getSeconds());
}

function newToday(date) {
  var time = date[date.length-2].split(":");
  var {hour, minute} = hm(date);

  var today = new Date();
  today.setHours(hour, minute);
  return today;
}

module.exports = class ForumPosts {
	constructor(bot) {
		this.bot = bot;
	}

	checkMessages() {
	  var {seconds} = reload("../config/config.json");
	  console.log("Checking Messages");

	  // Simulated Browser
	  JSDOM.fromURL(forum, {
	    virtualConsole
	  })
	  .then(function(dom) {
	    const window = dom.window;
	    // const document = dom.window.document;
	    // const bodyEl = document.body;
	    // console.log(dom.serialize());

	    var $ = jquery(window);

	    var currenttime = newDate($('.current-time').contents().text().split("is ")[1]);

	    // List of new posts
	    var news = [];

	    // Latest posts
	    var latest = $('.row1 span');

	    var dates = latest.contents().filter(function() {
	      return this.nodeType === 3; //Node.TEXT_NODE
	    });

	    dates.each( function( index, element ) {
	      var date = ($( this ).text()).split(" ");

	      if (date[0] == "Yesterday") return;
	      else if (date[0] == "Today") {
	        if ((currenttime - newToday(date))/1000 <= (seconds)) {
	          news.push(latest[index]);
	        }
	      }
	      return;
	    });

	    news.forEach(function(newPost, i) {
	      var link = forum + ($(newPost).children().filter('a.last-post-icon').attr('href'));
	      var author = ($(newPost).children().filter('strong').children().children().children().text());
	      var topic = ($(newPost).children().filter('a').first().text());

	      var message = author+" posted on \""+topic+"\" -> "+link;
	      console.log(message);
	      // bot.channels.get(default_channel).send(message);
	    });

	  });

	  setTimeout(this.checkMessages.bind(this), seconds*1000);
	}

}
