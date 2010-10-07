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
app.set('env', 'development');

app.set('view engine', 'jade');
/** API **/
app.configure(function() {
  app.use(express.conditionalGet());
  app.use(express.cache());
  app.use(express.gzip());
  /** if it's a file, serve it **/
  app.use(express.compiler({src: __dirname + '/public', enable: ['less']}));
  app.use(express.staticProvider(__dirname + '/public'));

  /** Support for sessions **/
  app.use(express.cookieDecoder());
  app.use(express.session({ store: new MemoryStore() }));

  var renderlocal = {};
  var renderoptions = {scope: renderlocal};
  app.set('view options', renderoptions);

  /** setup user **/
  app.use(function(req, res, next) {
    req.renderlocal = renderlocal;
    req.user = req.session.userId || null;
    req.renderlocal.user_name = req.session.user_name || null;

    /** Autologin for development **/
    app.configure('development', function() {
      req.user = req.session.userId = 'C566218CF7654AED8DB5A53D12145ADD';
      req.renderlocal.user_name = req.session.user_name = 'chris';
    });
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
  app.get('/reset', function(req, res, next) {
    req.conn.reset(req.tx, function() {
        res.send(200);
        res.end();
    });
  });
  app.get('/init', function(req, res, next) {
    req.conn.reset(req.tx, function() {
      req.conn.schemaSync(req.tx, function() {
        res.redirect("/");
        res.end();
      });
    });
  });
  app.use(express.router(datastore.route));
});
// local testing
app.configure('production', function() {
  app.use(express.errorHandler());
  app.listen(80);
  console.log("Listening to 80");
});
app.configure('development', function() {
  app.listen(3000);
  console.log("Listening to 3000");
});
