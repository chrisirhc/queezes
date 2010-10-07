var request = require('request');
assert = require('assert'),
http = require('http'),
_ = require('../lib/underscore-min')._;

var hostname = '127.0.0.1';
var portno = '3000';
/** note that a single client is used to ensure requests are synchronous **/
var httpclient = http.createClient(3000, hostname);

module.exports = {
  'sample user (myself)': function () {
    var user = {
      id: 'C566218CF7654AED8DB5A53D12145ADD',
      user_name: 'chris',
      passphrase: 'freshly squeezed'
    };
    request({
      uri: 'http://' + hostname + ':' + portno + "/user",
      method: 'POST',
      client: httpclient,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(user)
    }, function (error, response, body) {
      assert.equal(201, response.statusCode, 'Test created User');
      console.log("User created");
    });
  },
  'sample questions for the default profile': function () {
    var quizObj = {
      name: "Profile",
      short_name: "p",
      privacy: 0,
      description: "This is the default profile quiz.",
      creation_time: new Date("October 4, 2010 21:21:00"),
      questionOrders: [
        {
          question: {
            content: "What is your full name?",
            short_name: 'fullname',
            open_ended: true
          },
          weight: 0
        },
        {
          question: {
            content: "What is your gender?",
            short_name: 'gender',
            open_ended: false,
            answerOrders: [
              {
                answer: {
                  content: "Female"
                },
                weight: 0
              },
              {
                answer: {
                  content: "Male"
                },
                weight: 1
              }
            ]
          },
          weight: 1
        },
        {
          question: {
            content: "What is your age?",
            short_name: 'age',
            open_ended: true
          },
          weight: 2
        },
        {
          question: {
            content: "What is your hometown?",
            short_name: 'hometown',
            open_ended: true
          },
          weight: 3
        }
      ],
      decisionRules: [
        {
          scriptcontent: "return answers[1] == 'Female';",
          result: {
            title: "Welcome babe!",
            content: "We don't get many of you around here."
          }
        },
        {
          scriptcontent: "return answers[1] == 'Male';",
          result: {
            title: "Welcome dude!",
            content: ""
          }
        },
        {
          scriptcontent: "return (answers[2] > 40 && answers[2] < 60);",
          result: {
            title: "Middle-aged?",
            content: "Your mid-life crises end now!"
          }
        },
        {
          scriptcontent: "return answers[2] < 18;",
          result: {
            title: "Minor alert!",
            content: "Don't worry, your data is kept safe."
          }
        }
      ]
    };
    shallowQuizObj = _.clone(quizObj);
    delete shallowQuizObj.questionOrders;
    /** Typical quiz generation. Seems rather complex **/
    /**
     * It's only complex for generation of a quiz out of nothing
     * in a normal process it'll be built from scratch
     **/
    request({
      uri: 'http://' + hostname + ':' + portno + "/quiz",
      method: 'POST',
      client: httpclient,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(shallowQuizObj)
    }, function (error, response, body) {
      /** Set the ID returned **/
      quizObj.id = JSON.parse(body).id;
      console.log(quizObj.id);
      for (var a in quizObj.questionOrders) {
        /** Setup the questions **/
        request({
          uri: 'http://' + hostname + ':' + portno + "/question",
          method: 'POST',
          client: httpclient,
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(quizObj.questionOrders[a].question)
        }, (function(a) {
          return function(error, response, body) {
            assert.equal(201, response.statusCode, 'Test created Question');
            quizObj.questionOrders[a].question.id = JSON.parse(body).id;
            /** Setup the Answer Orders **/
            if(quizObj.questionOrders[a].question.answerOrders) {
              quizObj.questionOrders[a].question.answerOrders.forEach(function (aorderObj) {
                request({
                  uri: 'http://' + hostname + ':' + portno + "/answer",
                  method: 'POST',
                  client: httpclient,
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(aorderObj.answer)
                }, function (err, response, body) {
                  assert.equal(201, response.statusCode, 'Test created Answer');
                  aorderObj.answer.id = JSON.parse(body).id;
                  request({
                    uri: 'http://' + hostname + ':' + portno + "/answerOrder",
                    method: 'POST',
                    client: httpclient,
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                      answer: aorderObj.answer.id,
                      weight: aorderObj.weight
                    })
                  }, function (err, response, body) {
                    assert.equal(201, response.statusCode, 'Created created AnswerOrder');
                    aorderObj.id = JSON.parse(body).id;
                    request({
                      uri: 'http://' + hostname + ':' + portno + "/linkquestionaorder/" +
                      quizObj.questionOrders[a].question.id + "/" + aorderObj.id,
                      method: 'PUT',
                      client: httpclient
                    }, function (err, response, body) {
                      console.log("here");
                      assert.equal(200, response.statusCode, 'Test linked AnswerOrder to QuestionOrder');
                      console.log("Answers setup for question " + a);
                    });
                  });
                });
              });
            };
            /** Setup the Question Orders **/
            request({
              uri: 'http://' + hostname + ':' + portno + "/questionOrder",
              method: 'POST',
              client: httpclient,
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                question: quizObj.questionOrders[a].question.id,
                weight: quizObj.questionOrders[a].weight
              })
            }, function(error, response, body) {
              quizObj.questionOrders[a].id = JSON.parse(body).id;
              request({
                uri: 'http://' + hostname + ':' + portno + "/linkquizqorder/" +
                quizObj.id + "/" + quizObj.questionOrders[a].id,
                method: 'PUT',
                client: httpclient
              }, function(error, response, body) {
                console.log("Question " + a + " inserted.");
              });
            });
          }
        })(a));
      }

      /** Setup the Decision Rules **/

      quizObj.decisionRules.forEach(function (dObj, i) {
        request({
          uri: 'http://' + hostname + ':' + portno + "/result",
          method: 'POST',
          client: httpclient,
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(dObj.result)
        }, function (err, response, body) {
          assert.equal(201, response.statusCode, 'Test created Result');
          dObj.result.id = JSON.parse(body).id;
          request({
            uri: 'http://' + hostname + ':' + portno + "/decisionRule",
            method: 'POST',
            client: httpclient,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dObj)
          }, function (err, response, body) {
            assert.equal(201, response.statusCode, 'Test created DecisionRule');
            dObj.id = JSON.parse(body).id;
            request({
              uri: 'http://' + hostname + ':' + portno + "/linkquizdrule/" +
              quizObj.id + "/" + dObj.id,
              method: 'PUT',
              client: httpclient
            }, function(error, response, body) {
              console.log("Decision Rule " + i + " inserted.");
            });
          });
        });
      });

    });
  },
};
