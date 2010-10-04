/**
 * This is where it all begins
 */
var express = require('express');
var datastore = require('./lib/datastore');
var persistence = datastore.persistence;
var persistenceStore = datastore.persistenceStore;

var app = express.createServer();

/** debugging **/
app.set('env', 'development');

app.set('view engine', 'jade');
/** API **/
app.configure(function() {
  /** if it's a file, serve it **/
  app.use(express.compiler({src: __dirname + '/public', enable: ['less']}));
  app.use(express.staticProvider(__dirname + '/public'));
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
  app.listen(80);
  console.log("Listening to 80");
});
app.configure('development', function() {
  app.listen(3000);
  console.log("Listening to 3000");
});
