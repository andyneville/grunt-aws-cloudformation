'use strict';

const AWS = require("aws-sdk");
const _ = require("lodash");
const async = require("async");

module.exports = function(grunt) {

  grunt.registerMultiTask("cloudformation_delete_stack",
    "Deletes a cloudformation stack and all its resources.",
    function() {
      var done = this.async();
      var options = this.options({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
        region: 'us-east-1',
        stackName: null
      });

      var data = _.defaults(this.data, options);

      if (data.profile) {
        AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: data.profile});
      }

      async.series([
        function(callback) {
          checkData(data, callback);
        },
        function(callback) {
          cloudformationStatus(data, callback);
        }
      ], function (err) {
        done(!err);
      });

    });

  function checkData(data, callback) {
    if (_.isEmpty(data.stackName)) {
      grunt.warn("Function requires option: stackName");
    }
    if (_.isEmpty(data.region)) {
      grunt.warn("Function requires option: region");
    }
    callback(null);
  }

  function cloudformationStatus(data, callback) {
    AWS.config.region = data.region;

    var params = {
      StackName: data.stackName
    };

    var cloudformation = new AWS.CloudFormation();
    grunt.log.writeln("Deleting CloudFoundation stack " + data.stackName + "...");
    cloudformation.deleteStack(params, function(err, data){
      if (err) {
        grunt.warn("Stack deletion failed - " + err);
      } else {
        grunt.log.writeln("Deleted stack: " + JSON.stringify(data, null, 1));

        callback(null);
      }
    });
  }

};
