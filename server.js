/**
 * This is where it all begins
 */

var connect = require('lib/connect');
var quip = require('lib/quip');

var server = connect.createServer();

/** API **/
server.use('/user',     connect.bodyDecoder(), connect.methodOverride(), quip(), connect.router(User.route));
server.use('/question', connect.bodyDecoder(), connect.methodOverride(), quip(), connect.router(Question.route));
server.use('/answer',   connect.bodyDecoder(), connect.methodOverride(), quip(), connect.router(Answer.route));
server.use('/result',   connect.bodyDecoder(), connect.methodOverride(), quip(), connect.router(Result.route));
server.use('/quiz',     connect.bodyDecoder(), connect.methodOverride(), quip(), connect.router(Quiz.route));
server.use('/attempt',  connect.bodyDecoder(), connect.methodOverride(), quip(), connect.router(Attempt.route));
server.use('/ruleset',  connect.bodyDecoder(), connect.methodOverride(), quip(), connect.router(Ruleset.route));
server.listen(3000);
console.log('Connect server listening on port 3000');
