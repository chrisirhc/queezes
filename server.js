/**
 * This is where it all begins
 */
var express = require('express');
var datastore = require('./lib/datastore');
var persistence = datastore.persistence;
var persistenceStore = datastore.persistenceStore;
var MemoryStore = require('connect/middleware/session/memory');

var app = express.createServer();

/** debugging **/
app.set('env', 'production');

app.set('view engine', 'jade');
/** API **/
app.configure(function() {
  /** if it's a file, serve it **/
  app.use(express.compiler({src: __dirname + '/public', enable: ['less']}));
  app.use(express.staticProvider(__dirname + '/public'));

  /** Support for sessions **/
  app.use(express.cookieDecoder());
  app.use(express.session({ store: new MemoryStore() }));

  /** setup user **/
  app.use(function(req, res, next) {
    req.renderlocal = {};
    req.user = req.session.userId || null;
    req.renderlocal.user_name = req.session.user_name || null;
    req.renderoptions = {scope: req.renderlocal};
    app.set('view options', req.renderoptions);
    next();
  });

  app.use(express.logger());
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  /** setup persistence db connection **/
  app.use(function(req, res, next) {
    var end = res.end;

    req.conn = persistenceStore.getSession();
    res.end = function() {
      req.conn.close();
      end.apply(res, arguments);
    };
    req.conn.transaction(function(tx) {
      req.tx = tx;
      next();
    });
  });
  app.get('/init', function(req, res, next) {
    req.conn.reset(req.tx, function() {
      req.conn.schemaSync(req.tx, function() {
        res.send("Database setup");
        res.end();
      });
    });
  });
  app.use(express.router(datastore.route));
});
// local testing
app.configure('production', function() {
  // app.use(express.errorHandler());
  app.listen(80);
  console.log("Listening to 80");
});
app.configure('development', function() {
  app.listen(3000);
  console.log("Listening to 3000");
});
