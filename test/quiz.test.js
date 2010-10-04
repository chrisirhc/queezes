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
      questionorders: [
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
            open_ended: false
            answers: [
              {
                content: "Female"
              },
              {
                content: "Male"
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
    delete shallowQuizObj.questionorders;
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
      for (var a in quizObj.questionorders) {
        /** Setup the questions **/
        request({
          uri: 'http://' + hostname + ':' + portno + "/question",
          method: 'POST',
          client: httpclient,
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(quizObj.questionorders[a].question)
        }, (function(a) {
          return function(error, response, body) {
            quizObj.questionorders[a].question.id = JSON.parse(body).id;
            /** Setup the Question Orders **/
            request({
              uri: 'http://' + hostname + ':' + portno + "/questionorder",
              method: 'POST',
              client: httpclient,
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                question: quizObj.questionorders[a].question.id,
                weight: quizObj.questionorders[a].weight
              })
            }, function(error, response, body) {
              quizObj.questionorders[a].id = JSON.parse(body).id;
              request({
                uri: 'http://' + hostname + ':' + portno + "/quizqorder/" + 
                quizObj.id + "/" + quizObj.questionorders[a].id,
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
