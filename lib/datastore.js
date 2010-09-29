var persistence = require('persistencejs/persistence').persistence;
var persistenceStore = require('persistencejs/persistence.store.mysql');
persistenceStore.config(persistence, 'localhost', 'queezes', 'queezes', 'squeezeme!');

this.persistence = persistence;
this.persistenceStore = persistenceStore;

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

/**
 * Quiz object
 */
var Quiz = persistence.define('Quiz', {
  name: "TEXT",
  short_name: "TEXT",
  privacy: "INT",
  creation_time: "DATE"
});
/**
 * Friends-only should be implemented elsewhere,
 * while this is set to PRIVATE
 */
Quiz.privacies = {PRIVATE: 0, PUBLIC: 1};

/**
 * Also known as the the mapping table
 **/
var Question = persistence.define('Question', {
  content: "TEXT",
  short_name: "TEXT"
});

/**
 * Question order
 *
 **/
var QuestionOrder = persistence.define('QuestionOrder', {
  weight: "INT"
});

/**
 * Stores every attempt made at a question
 */
var Answer = persistence.define('Answer', {
  content: "TEXT"
});

/**
 * Attempt object
 * Stores every attempt made at a question
 */
var Attempt = persistence.define('Attempt', {
  /** number of attempts not important **/
  number: "INT",
  time: "DATE"
});

/**
 * DecisionRule object
 * A fragment of javascript that evaluates 
 * a set of questions and answer pairs into
 * a result
 */
var DecisionRule = persistence.define('DecisionRule', {
  /** number of attempts not important **/
  scriptcontent: "TEXT",
  time: "DATE"
});

/**
 * Result object
 */
var Result = persistence.define('Result', {
  /** number of attempts not important **/
  content: "TEXT",
});

/**
 * Decision object
 * Conclusion reached in the quiz
 */
var Decision = persistence.define('Decision', {
  time: "DATE",
  /** validity of the decision **/
  valid: "BOOL"
});

/** Relationships **/
Attempt.hasOne('user', User);
Attempt.hasOne('question', Question);
Attempt.hasOne('answer', Answer);
/** TODO this may not be important **/
Attempt.hasOne('quiz', Quiz);

/** Each question is inserted via questionorder into the quiz **/
Quiz.hasMany('questionorders', QuestionOrder, 'quiz');
QuestionOrder.hasOne('quiz', Quiz);
QuestionOrder.hasOne('question', Question);

/** we don't care about the other way for the answer **/
Question.hasMany('answers', Answer, 'question');

Decision.hasOne('user', User);
Decision.hasOne('result', Result);
Decision.hasOne('quiz', Quiz);

Quiz.hasMany('decisionrules', DecisionRule, 'quiz');
DecisionRule.hasOne('quiz', Quiz);

/** Export out of this module **/
exports.User = User;
exports.Quiz = Quiz;
exports.Question = Question;
exports.QuestionOrder = QuestionOrder;
exports.Result = Result;
exports.Answer = Answer;
exports.DecisionRule = DecisionRule;
exports.Attempt = Attempt;
exports.Decision = Decision;

var urlmap = {
  'user': User,
  'answer': Answer,
  'result': Result,
  'attempt': Attempt,
  'quiz': Quiz,
  'question': Question,
  'questionorder': QuestionOrder,
  'decision': Decision,
  'decisionrule': DecisionRule
};

var catchall = /(user|answer|result|attempt|quiz|questionorder|question|decisionrule|decision)/;
var catchallwithid = /(user|answer|result|attempt|quiz|questionorder|question|decisionrule|decision)\/([^\/]+)/;

/** API in JSON **/
exports.route = function (app) {
  /** Show object given ID **/
  app.get(catchallwithid, function(req, res, next) {
    var objectType = urlmap[req.params[0]];
    // Find the object and display
    objectType.load(req.conn, req.tx, req.params[1], function(object) {
      res.send(object);
    });
  });

  /** List objects **/
  app.get(catchall, function(req, res, next) {
    var objectType = urlmap[req.params[0]];
    // List objects
    objectType.all(req.conn).list(req.tx, function(objects) {
      res.send(objects);
    });
  });

  /** Create objects **/
  app.post(catchall, function(req, res, next) {
    var objectType = urlmap[req.params[0]];
    // Add a object
    var o = new objectType(req.conn);
    req.conn.add(o);
    /** set variables **/
    for (var a in req.body) {
      o[a] = req.body[a];
    }
    req.conn.flush(req.tx, function() {
      res.send(o, 201);
    });
  });

  /** Modify objects **/
  app.put(catchallwithid, function(req, res, next) {
    // Modify an object
    var objectType = urlmap[req.params[0]];
    // Find the object and display
    objectType.load(req.conn, req.tx, req.params[1], function(o) {
      req.conn.add(o);
      for (var a in req.body) {
        o[a] = req.body[a];
      }
      req.conn.flush(req.tx, function() {
        res.send(o);
      });
    });
  });

  /** Delete objects **/
  app.del(catchallwithid, function(req, res, next) {
    // Delete the object
    var objectType = urlmap[req.params[0]];
    // Find the object and display
    objectType.load(req.conn, req.tx, req.params[1], function(o) {
      req.conn.remove(o);
      req.conn.flush(req.tx, function() {
        res.send(200);
      });
    });
  });
}
