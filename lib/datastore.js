var persistence = require('./persistencejs/lib/persistence').persistence;
var persistenceStore = require('./persistencejs/lib/persistence.store.mysql');
persistenceStore.config(persistence, 'localhost', 'queezes', 'queezes', 'squeezeme!');

var Step = require('./step/lib/step');
var _ = require('./underscore-min')._;
// string operations
// http://bitbucket.org/epeli/underscore.strings/src
require('./underscore.strings-min');

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
  passphrase: "TEXT"
});

/**
 * Quiz object
 */
var Quiz = persistence.define('Quiz', {
  name: "TEXT",
  short_name: "TEXT",
  description: "TEXT",
  privacy: "INT",
  creation_time: "DATE"
});

/**
 * Friends-only should be implemented elsewhere,
 * while this is set to PRIVATE
 */
Quiz.privacies = {PRIVATE: 0, PUBLIC: 1};

/**
 * Question object
 *
 */
var Question = persistence.define('Question', {
  content: "TEXT",
  short_name: "TEXT",
  open_ended: "BOOL",
  /** question text for open ended option **/
  open_ended_text: "TEXT"
});

/**
 * Question order
 * abbrieviated with qorder
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
 * Answer order
 * How answers are ordered in the question
 * abbrieviated with qorder
 *
 **/
var AnswerOrder = persistence.define('AnswerOrder', {
  weight: "INT"
});

/**
 * Attempt object
 * Stores every attempt made at a question
 */
var Attempt = persistence.define('Attempt', {
  /** number of attempts not important **/
  time: "DATE"
});

/**
 * DecisionRule object
 * A fragment of javascript that evaluates 
 * a set of questions and answer pairs into
 * a result
 */
var DecisionRule = persistence.define('DecisionRule', {
  scriptcontent: "TEXT",
  time: "DATE"
});

/**
 * Result object
 */
var Result = persistence.define('Result', {
  title: "TEXT",
  content: "TEXT"
});

/**
 * Decision object
 * Conclusion reached in the quiz
 */
var Decision = persistence.define('Decision', {
  /** sort of the last valid attempt time **/
  time: "DATE",
  /** validity of the decision **/
  valid: "BOOL"
});

/** Relationships **/
User.hasMany('quizzes', Quiz, 'user');
Quiz.hasOne('author', User);

Attempt.hasOne('user', User);
Attempt.hasOne('question', Question);
Attempt.hasOne('answer', Answer);
/** TODO this may not be important **/
Attempt.hasOne('quiz', Quiz);

/** Each question is inserted via questionOrder into the quiz **/
Quiz.hasMany('questionOrders', QuestionOrder, 'quiz');
QuestionOrder.hasOne('quiz', Quiz);
QuestionOrder.hasOne('question', Question);

/** In order to track order of the answers **/
Question.hasMany('answerOrders', AnswerOrder, 'question');
AnswerOrder.hasOne('question', Question);
AnswerOrder.hasOne('answer', Answer);

Decision.hasOne('user', User);
Decision.hasOne('result', Result);
Decision.hasOne('quiz', Quiz);

Quiz.hasMany('decisionRules', DecisionRule, 'quiz');
DecisionRule.hasOne('quiz', Quiz);
DecisionRule.hasOne('result', Result);

/** Export out of this module **/
exports.User = User;
exports.Quiz = Quiz;
exports.Question = Question;
exports.QuestionOrder = QuestionOrder;
exports.Result = Result;
exports.Answer = Answer;
exports.AnswerOrder = AnswerOrder;
exports.DecisionRule = DecisionRule;
exports.Attempt = Attempt;
exports.Decision = Decision;

var urlmap = {
  'user': User,
  'answer': Answer,
  'answerOrder': AnswerOrder,
  'result': Result,
  'attempt': Attempt,
  'quiz': Quiz,
  'question': Question,
  'questionOrder': QuestionOrder,
  'decision': Decision,
  'decisionRule': DecisionRule
};

var catchall = /^\/(user|answerOrder|answer|result|attempt|quiz|questionOrder|question|decisionRule|decision)/;
var catchallwithid = /^\/(user|answerOrder|answer|result|attempt|quiz|questionOrder|question|decisionRule|decision)\/([^\/]+)/;

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

  /** Begin special case checks for the object creation **/

  function retrieveAnswer(persession, pertransaction, content, callback) {
    if (content && (content = _.trim(content))) {
      Answer.findBy(persession, pertransaction, 'content', content, callback);
    }
  }

  /** Special case of Answer objects (uniqueness) **/
  app.post('/question', function(req, res, next) {
    /** Don't want any duplicates for answer **/
    Question.findBy(req.conn, req.tx, "content", _.trim(req.body.content), function (qObj) {
      if(qObj){
        res.send(qObj.toJSON(), 201);
        res.end();
      } else {
        /** Proceed for creation **/
        next();
      }
    });
  });

  /** Special case of Answer objects (uniqueness) **/
  app.post('/answer', function(req, res, next) {
    /** Don't want any duplicates for answer **/
    retrieveAnswer(req.conn, req.tx, req.body.content, function (aObj) {
      if(aObj){
        res.send(aObj.toJSON(), 201);
        res.end();
      } else {
        /** Proceed for creation **/
        next();
      }
    });
  });

  function findId(target) {
    if(target) {
      target = target.id || target;
      if(_.isString(target)) {
        if(target.length == 32) {
          return target;
        }
      }
    }
    return null;
  }

  /** Create objects **/
  app.post(catchall, function(req, res, next) {
    var objectType = urlmap[req.params[0]];
    // Add a object
    var o = new objectType(req.conn);
    req.conn.add(o);
    /** set variables **/
    for (var a in req.body) {
      if (objectType.meta.hasMany[a]) {
        /** check whether it's a UUID else, don't touch **/
        if (req.body[a] = findId(req.body[a])) {
          o.meta.hasMany[a].type.load(req.body[a], (function (prop) {
            return function(tempObj) {
              prop.add(tempObj);
            };
          })(o[a]));
        }
      } else if (objectType.meta.hasOne[a]) {
        /** for safety sake **/
        if (req.body[a] = findId(req.body[a])) {
          o[a] = req.body[a];
        }
      } else {
        o[a] = req.body[a];
      }
    }
    req.conn.flush(req.tx, function() {
      res.send(o.toJSON(), 201);
      res.end();
    });
  });

  /** Modify objects **/
  app.put(catchallwithid, function(req, res, next) {
    // Modify an object
    var objectType = urlmap[req.params[0]];
    // Find the object and display
    objectType.load(req.conn, req.tx, req.params[1], function(o) {
      for (var a in req.body) {
        o[a] = req.body[a];
      }
      req.conn.flush(req.tx, function() {
        res.send(o.toJSON(), 200);
        res.end();
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
        res.end();
      });
    });
  });

  /** Add QuestionOrder/DecisionRule objects into the Quiz **/
  app.put(/linkquiz(qorder|drule)\/([^\/]+)\/([^\/]+)/, function (req, res) {
    Quiz.load(req.conn, req.tx, req.params[1], function(quizObj) {
      if (quizObj) {
        switch(req.params[0]) {
          case "qorder":
          QuestionOrder.load(req.conn, req.tx, req.params[2], function(qorderObj) {
            if (qorderObj) {
              quizObj.questionOrders.add(qorderObj);
              req.conn.flush(req.tx, function () {
                res.send(200);
                res.end();
              });
            }
          });
          break;
          case "drule":
          DecisionRule.load(req.conn, req.tx, req.params[2], function(druleObj) {
            if (druleObj) {
              quizObj.decisionRules.add(druleObj);
              req.conn.flush(req.tx, function () {
                res.send(200);
                res.end();
              });
            }
          });
          break;
        }
      }
    });
  });

  /** Remove QuestionOrder objects from the Quiz **/
  app.del(/linkquiz(qorder|drule)\/([^\/]+)\/([^\/]+)/, function (req, res) {
    Quiz.load(req.conn, req.tx, req.params[1], function(quizObj) {
      if (quizObj) {
        switch(req.params[0]) {
          case "qorder":
          QuestionOrder.load(req.conn, req.tx, req.params[2], function(qorderObj) {
            if (qorderObj) {
              quizObj.questionOrders.remove(qorderObj);
              req.conn.remove(qorderObj);
              req.conn.flush(req.tx, function () {
                res.send(200);
                res.end();
              });
            }
          });
          break;
          case "drule":
          DecisionRule.load(req.conn, req.tx, req.params[2], function(druleObj) {
            if (druleObj) {
              quizObj.decisionRules.remove(druleObj);
              req.conn.remove(druleObj);
              req.conn.flush(req.tx, function () {
                res.send(200);
                res.end();
              });
            }
          });
          break;
        }
      }
    });
  });

  /** Add AnswerOrder objects into the Question **/
  app.put('/linkquestionaorder/:questionid/:answerOrderid', function (req, res) {
    Question.load(req.conn, req.tx, req.params.questionid, function(questionObj) {
      if (questionObj) {
        AnswerOrder.load(req.conn, req.tx, req.params.answerOrderid, function(aorderObj) {
          if (aorderObj) {
            questionObj.answerOrders.add(aorderObj);
            req.conn.flush(req.tx, function () {
              res.send(200);
              res.end();
            });
          }
        });
      }
    });
  });

  /** Remove QuestionOrder objects from the Quiz **/
  app.del('/linkquestionaorder/:questionid/:answerOrderid', function (req, res) {
    Question.load(req.conn, req.tx, req.params.questionid, function(questionObj) {
      if (questionObj) {
        AnswerOrder.load(req.conn, req.tx, req.params.answerOrderid, function(aorderObj) {
          if (aorderObj) {
            questionObj.answerOrders.remove(aorderObj);
            req.conn.remove(aorderObj);
            req.conn.flush(req.tx, function () {
              res.send(200);
              res.end();
            });
          }
        });
      }
    });
  });

  app.get('/logout', function (req, res, next) {
    req.session.userId = null;
    req.session.user_name = null;
    res.redirect('/login');
  });
  app.get('/login', function (req, res, next ) {
    res.render("login", { locals: {title: "Login", redirecturl: req.query.url || "/"} });
  });

  app.post('/login', function (req, res, next) {
    if(req.body.user_name && (req.body.user_name = _.trim(req.body.user_name))) {
      /** Attempt to find the user **/
      User.findBy(req.conn, req.tx, 'user_name', req.body.user_name, function (uObj) {
        if(uObj) {
          if(req.body.passphrase == uObj.passphrase) {
            req.session.userId = uObj.id;
            req.session.user_name = uObj.user_name;
            res.redirect(req.body.redirecturl);
            res.end();
          } else {
            /** Unauthenticated **/
            res.send(401);
            res.end();
          }
        } else {
          /** Not found, create him! **/
          uObj = new User(req.conn);
          req.conn.add(uObj);

          /** Check if it's a twitter name **/
          /*
           if(_.startsWith(req.body.user_name, "@")) {
             uObj.twitter_name = req.body.user_name;
           } else {
             */
          uObj.user_name = req.body.user_name;
          uObj.passphrase = req.body.passphrase;

          /** Flush **/
          req.conn.flush(req.tx, function () {
            req.session.userId = uObj.id;
            req.session.user_name = uObj.user_name;
            res.redirect(req.body.redirecturl);
            res.end();
          });
        }
      });
    }
  });

  /** Display all quizzes **/
  app.get('/', function(req, res, next) {
    Quiz.all().list(req.tx, function(quizzes) {
      res.render("queezes", {
        locals: { quizzes: quizzes }
      });
    });
  });

  app.get('/:quizshortname/result(s?)', function (req, res, next) {
    Quiz.findBy(req.conn, req.tx, 'short_name', req.params.quizshortname, function (qObj) {
      /** retrieve results **/
      if (qObj) {
        Decision.all()
          .filter("quiz", "=", qObj.id)
          .filter("user", "=", req.session.userId)
          .filter("valid", "=", true)
          .prefetch("result")
          .list(req.tx, function(decisions) {
          res.render("results", {
            locals: {
              quiz: qObj,
              decisionObjs: decisions,
              title: "Results for " + qObj.name + " Quiz"
            }
          });
        });
      }

    });
  });

  /** Edit a chosen quiz via short_name **/
  app.get('/:quizshortname/edit', function (req, res, next) {
    if(!req.session.userId) {
      res.redirect("/login?url=" + req.url);
    }
    Quiz.findBy(req.conn, req.tx, 'short_name', req.params.quizshortname, function (qObj) {
      /** Don't check author for now **/

      if (qObj) {
        var allQuestionOrders = qObj.questionOrders.prefetch("question").order("weight", true);
        allQuestionOrders.list(req.tx, function (qorders) {
          Step(function() {
            var group1 = this.group(),
              group2 = this.group();
            /** fetch the answers for each question **/
            qorders.forEach(function(qorderObj) {
              if(qorderObj) {
                qorderObj.question.answerOrders.prefetch("answer").order("weight", true)
                /** TODO check whether this preserves order **/
                /** TODO Might want to use multiple sessions? **/
                .list(req.tx, (function(func) {
                  return function(x) {
                    func(null, x);
                  }
                })(group1()));

                Attempt.all()
                  .filter("question", "=", qorderObj.question.id)
                  .filter("user", "=", req.session.userId)
                  .order("time", false)
                  .limit(1)
                  .prefetch("answer")
                  .list(req.tx, (function(func) {
                    return function(x) {
                      func(null, x && x[0]);
                    }
                  })(group2()));
              }
            });
          }, function(err, aorderObjs, attObjs) {
            if(err) throw err;
            /** When it's done retrieving all the answer choices, RENDER! **/
            res.render("quizedit", {
              /**
               * questionOrders[x].answerOrders is not populated so it has to be passed separately.
               */
              locals: {
                quiz: qObj,
                questionOrders: qorders,
                answerOrders: aorderObjs,
                attempts: attObjs,
                title: "Editing the " + qObj.name + " Quiz"
              }
            });
            res.end();
          });
        });
      } else {
        /** If it can't be found, here it goes. :) **/
        res.send(404);
        res.end();
      }
    });
  });

  /** Display a chosen quiz via short_name **/
  app.get('/:quizshortname', function (req, res, next) {
    if(!req.session.userId) {
      res.redirect("/login?url=" + req.url);
    }
    Quiz.findBy(req.conn, req.tx, 'short_name', req.params.quizshortname, function (qObj) {
      if (qObj) {
        var allQuestionOrders = qObj.questionOrders.prefetch("question").order("weight", true);
        allQuestionOrders.list(req.tx, function (qorders) {
          Step(function() {
            var group1 = this.group(),
              group2 = this.group();
            /** fetch the answers for each question **/
            qorders.forEach(function(qorderObj) {
              if(qorderObj) {
                qorderObj.question.answerOrders.prefetch("answer").order("weight", true)
                /** TODO check whether this preserves order **/
                /** TODO Might want to use multiple sessions? **/
                .list(req.tx, (function(func) {
                  return function(x) {
                    func(null, x);
                  }
                })(group1()));

                Attempt.all()
                  .filter("question", "=", qorderObj.question.id)
                  .filter("user", "=", req.session.userId)
                  .order("time", false)
                  .limit(1)
                  .prefetch("answer")
                  .list(req.tx, (function(func) {
                    return function(x) {
                      func(null, x && x[0]);
                    }
                  })(group2()));
              }
            });
          }, function(err, aorderObjs, attObjs) {
            if(err) throw err;
            /** When it's done retrieving all the answer choices, RENDER! **/
            res.render("quiz", {
              /**
               * questionOrders[x].answerOrders is not populated so it has to be passed separately.
               */
              locals: {
                quiz: qObj,
                questionOrders: qorders,
                answerOrders: aorderObjs,
                attempts: attObjs,
                title: qObj.name + " Quiz"
              }
            });
          });
        });
      } else {
        /** If it can't be found, here it goes. :) **/
        res.send(404);
      }
    });
  });

  /** Process the quiz when it's done and show the conclusion **/
  app.post('/:quizshortname', function( req, res, next ) {
    if(!req.session.userId) {
      res.redirect("/login?url=" + req.url);
    }
    /**
     * This is the only required variable POST[quizid]
     * The rest maybe empty.
     */
    var quizid = req.body.quizid;
    var fullSubmission = req.body.fullsubmit || false;
    var quizObj;
    var currTime = new Date();
    delete req.body.quizid;

    Step(function () {

      /** Clean up the post data and insert answers where appropriate **/

      var group = this.group();

      for (var questionId in req.body) {
        if (_.trim(req.body[questionId]).length == 0) {
          delete req.body[questionId];
        } else if (_.endsWith(questionId, "_o")) {
          /**
           * In the case that the radio was selected but open-ended was filled,
           * override it
           */
          retrieveAnswer(req.conn, req.tx, req.body[questionId],
          (function (key, callback) {
            return function(aObj) {
              /** If it doesn't exist, create it **/
              if(!aObj) {
                aObj = new Answer(req.conn);
                req.conn.add(aObj);
                aObj.content = _.trim(req.body[key]);
              }
              req.body[key.replace("_o", "")] = aObj.id;

              delete req.body[key];
              callback();
            }
          })(questionId, group()));
        }
      }
      group()();

    }, function (err) {
      /** Insert all the Attempt objects into the database **/
      for (var questionId in req.body) {
        Attempt.all()
        .filter("question", "=", questionId)
        .filter("user", "=", req.session.userId)
        .filter("answer", "=", req.body[questionId])
        .order("time", false)
        .limit(1)
        .prefetch("quiz")
        .list(req.tx, (function(key, func) {
          return function(attObj) {
            attObj = attObj && attObj[0];
            if(!attObj || attObj.quiz.id != quizid) {
              attObj = new Attempt(req.conn);
              req.conn.add(attObj);

              /** Populate the Attempt object **/
              attObj.question = key;
              attObj.answer = req.body[key];
              attObj.user = req.session.userId;
              attObj.quiz = quizid;
            }
            attObj.time = currTime;
            func();
          }
        })(questionId, this.parallel()));
      }

    }, function (err) {
      /** TODO check whether flush is needed or just carry on **/

      /**
       * Begin determining Result
       */

      Quiz.load(req.conn, req.tx, quizid, (function(drulescallback, answerscallback) {
        return function (qObj) {
          if (qObj) {
            quizObj = qObj;

            /** Get all the DecisionRule objects **/

            qObj.decisionRules.prefetch("result").list(req.tx, function(decisionrules) {
              drulescallback(null, decisionrules);
            });

            /** Retrieve all the questions in this quiz **/

            var allQuestionOrders = qObj.questionOrders.prefetch("question").order("weight", true);
            allQuestionOrders.list(req.tx, function(qorders) {

              /** Fetch all Attempt objects by this user on the questions in the quiz **/

              qorders.forEach(function (qorderObj) {
                if(qorderObj) {
                  Attempt.all()
                  .filter("question", "=", qorderObj.question.id)
                  .filter("user", "=", req.session.userId)
                  .order("time", false)
                  .limit(1)
                  .prefetch("answer")
                  .list(req.tx, (function(func) {
                    return function(x) {
                      /** looks weird but it's all checks **/
                      func(null, (x && x[0]) ? x[0].answer.content : undefined);
                    }
                  })(answerscallback()));
                }
              });
            });

          } else {
            /** TODO hope we'll never reach here but this is not tested **/
            res.send(404);
            res.end();
          }
        }
      })(this.parallel(), this.group()));

      /** Invalidate previous Decision objects **/

      Decision.all()
        .filter("quiz", "=", quizid)
        .filter("user", "=", req.session.userId)
        .filter("valid", "=", true)
        .list(req.tx, (function (callback) {
          return function (decisions) {
            decisions && decisions.forEach(function (dObj) {
              /** TODO check whether need to if **/
              dObj.valid = false;
            });
            /** not sure if this is asynchronous **/
            callback();
          };
        })(this.parallel()));

      }, function(err, decisionrules, attemptanswers) {

        /** Process all the decision rules and come up with new decisions **/
        var group = this.group();

        decisionrules.forEach(function (decisionrule) {
          /** Load the decisionrule script **/
          var decisionfunc = new Function("answers", "_", decisionrule.scriptcontent);
          var decisionflag = false;

          /** Include underscorejs for helpers **/

          try {
            decisionflag = decisionfunc(attemptanswers, _);
          } catch(e) {
            /** Ignore if any error occurs **/
          }

          if (decisionflag) {
            Decision.all()
            .filter("result", "=", decisionrule.result.id)
            .filter("quiz", "=", quizid)
            .filter("user", "=", req.session.userId)
            .order("time", false)
            .limit(1)
            .list(req.tx, (function (callback) {
              return function (dObj) {
                dObj = dObj && dObj[0];
                if(!dObj) {
                  /** Create it if it's not there **/
                  dObj = new Decision(req.conn);
                  req.conn.add(dObj);
                  dObj.quiz = quizid;
                  dObj.result = decisionrule.result.id;
                  dObj.user = req.session.userId;
                }
                dObj.valid = true;
                dObj.time = currTime;
                callback();
              };
            })(group()));
          }
        });

        /** At least one callback **/
        group()();

      }, function(err) {
        if(err) throw err;

        /** Finally flush **/

        req.conn.flush(req.tx, function () {
          if(fullSubmission) {
            res.redirect("/" + quizObj.short_name + "/result");
          } else {
            res.send(200);
            res.end();
          }
      });
    });
  });
}
