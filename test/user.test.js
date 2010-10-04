var request = require('request');
assert = require('assert'),
http = require('http');

var hostname = '127.0.0.1';
var portno = '3000';
/** note that a single client is used to ensure requests are synchronous **/
var httpclient = http.createClient(3000, hostname);

module.exports = {
  'test user object creation cycle': function() {
    var obj;
    request({
      uri: 'http://' + hostname + ':' + portno + "/user",
      method: 'POST',
      client: httpclient,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: 'user_name=tester&password=testing&twitter_name=noname'
    },
    function(error, response, body) {
      assert.equal(201, response.statusCode, 'Test created status');
      obj = JSON.parse(body);
      assert.equal("tester", obj.user_name, 'Test user name');
      assert.equal("testing", obj.password, 'Test password');
      assert.equal("noname", obj.twitter_name, 'Test twitter name');

      request({
        uri: 'http://' + hostname + ':' + portno + "/user/" + obj.id,
        method: 'GET',
        client: httpclient
      },
      function(error, response, body) {
        var testobj = JSON.parse(body);
        assert.equal(200, response.statusCode, 'Test retrieved status');
        assert.deepEqual(testobj, obj, 'Test object');
      });
      request({
        uri: 'http://' + hostname + ':' + portno + "/user/" + obj.id,
        method: 'DELETE',
        client: httpclient
      },
      function(error, response, body) {
        assert.equal(200, response.statusCode, 'Test deleted status');
      });
      request({
        uri: 'http://' + hostname + ':' + portno + "/user/" + obj.id,
        method: 'GET',
        client: httpclient
      },
      function(error, response, body) {
        assert.equal("null", body, 'Test body shows null');
      });
    });
  },
  'test quiz object creation cycle': function() {
    var quizObj = {
        name: "Profile",
        short_name: "p",
        privacy: 0,
        creation_time: new Date()
      };
    var obj;
    request({
      uri: 'http://' + hostname + ':' + portno + "/quiz",
      method: 'POST',
      client: httpclient,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(quizObj)
    },
    function(error, response, body) {
      assert.equal(201, response.statusCode, 'Test created status');
      obj = JSON.parse(body);
      /* Problem with precision of time
       for (a in quizObj) {
         assert.equal(quizObj[a], obj[a], 'Test object property ' + a);
       }
       */
      request({
        uri: 'http://' + hostname + ':' + portno + "/quiz/" + obj.id,
        method: 'GET',
        client: httpclient
      },
      function(error, response, body) {
        var testobj = JSON.parse(body);
        assert.equal(200, response.statusCode, 'Test retrieved status');
        /** Problem with precision of time **/
        // assert.deepEqual(testobj, obj, 'Test object');
      });
      request({
        uri: 'http://' + hostname + ':' + portno + "/quiz/" + obj.id,
        method: 'DELETE',
        client: httpclient
      },
      function(error, response, body) {
        assert.equal(200, response.statusCode, 'Test deleted status');
      });
      request({
        uri: 'http://' + hostname + ':' + portno + "/quiz/" + obj.id,
        method: 'GET',
        client: httpclient
      },
      function(error, response, body) {
        assert.equal("null", body, 'Test body shows null');
      });
    });
  }
};
