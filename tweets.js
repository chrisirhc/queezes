var tweetstream = require('tweetstream'),
    sys = require('sys');

var stream = tweetstream.createTweetStream({
  username:"queezes",
  password:"squeezeme!" 
});
stream.addListener("tweet", function (tweet) {
  sys.puts(sys.inspect(tweet))
});
