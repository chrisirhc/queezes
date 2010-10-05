var request = require('request');
assert = require('assert'),
http = require('http'),
_ = require('../lib/underscore-min')._;

var hostname = '127.0.0.1';
var portno = '3000';
/** note that a single client is used to ensure requests are synchronous **/
var httpclient = http.createClient(3000, hostname);

module.exports = {
  'sample questions for the default profile': function() {
    var quizObj = {
      name: "Profile",
      short_name: "p",
      privacy: 0,
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
                weight: 0
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
    });
  },
};