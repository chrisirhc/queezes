/**
 * This is where it all begins
 */
var express = require('express');
var datastore = require('./lib/datastore');
var persistence = datastore.persistence;
var persistenceStore = datastore.persistenceStore;

var app = express.createServer();

/** API **/
app.configure(function() {
  /** if it's a file, serve it **/
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
    req.conn.schemaSync(req.tx, function() {
      res.send("Database setup");
      res.end();
    });
  });
  app.use(express.router(datastore.route));
});
app.listen(80);
