var persistence = require('persistencejs/persistence').persistence;
var persistenceStore = require('persistencejs/persistence.store.mysql');
persistenceStore.config(persistence, 'localhost', 'queezes', 'queezes', 'squeezeme!');

/**
 * User is the object that stores the user's profile information
 */

/** User object
 * User email?
 */
var User = persistence.define('User', {
  user_name: "TEXT",
  password: "TEXT",
  twitter_name: "TEXT"
});

/** API in JSON **/
function route(app) {
  app.get('/', function(req, res) {
    var session = persistenceStore.getSession();
    // List users
  });
  app.get('/:id', function(req, res) {
    // Find the user and display
  });
  app.post('/', function(req, res) {
    var session = persistenceStore.getSession();
    // Add a user
    var u = new User(session);
    session.add(t);
  });
  app.put('/:id', function(req, res) {
    // Modify a user
  });
  app.del('/:id', function(req, res) {
    // Find the user and display
  });
}
