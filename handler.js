'use strict';

module.exports.check = (event, context, callback) => {
  var rssList = require("./rssList.json")
  var async = require('async');
  var FeedParser = require('feedparser');
  var request = require('request');
  var moment = require("moment");

  var sendMessage = function(message){
    

    var bearerToken = process.env.bearerToken
    var group_id = process.env.group_id
    
    var headers = {
      'Content-Type':'application/json'
    }
    
    var options = {
      url: 'https://www.yammer.com/api/v1/messages.json',
      method: 'POST',
      headers: headers,
      json: true,
      form: {
        "body":message,
        "group_id":group_id,
      },
      auth:{
        'bearer': bearerToken
      }
    }

    request(options, function (error, response, body) {
      if(error){
        return new Error('sendMessage error')
      }
      console.log(moment().format("YYYY-MM-DD HH:mm:ss") + ' : sent message ' + message)
    })
  }
  
  async.forEachSeries(rssList.target, function(rss,next) {

    var req = request(rss);
    var feedparser = new FeedParser({});
    
    req.on('error', function (error) {
        console.error(moment().format("YYYY-MM-DD HH:mm:ss") + " : don't acccess " + rss)
    });

    req.on('response', function (res) {
        var stream = this;
        if (res.statusCode != 200) {
            return this.emit('error', new Error('Bad status code'));
        }
        console.log(moment().format("YYYY-MM-DD HH:mm:ss") + " : check " + rss)
        stream.pipe(feedparser);
    });
    
    feedparser.on('readable', function() {
      var stream = this
        , meta = this.meta
        , item;
      while (item = stream.read()) {
        var updateHour = moment(item.date).endOf('hour').fromNow();
        if (updateHour === 'an hour ago'){
          var botMessage = meta.title + '\n' + item.title +'\n' + item.link;
          sendMessage(botMessage)
        }
      }
    });
    next()
  })
};
