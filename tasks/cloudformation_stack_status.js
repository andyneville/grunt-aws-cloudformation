'use strict';

const AWS = require("aws-sdk");
const _ = require("lodash");
const async = require("async");

module.exports = function(grunt) {

  grunt.registerMultiTask("cloudformation_stack_status",
    "Gets and prints status of cloudformation stack.",
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
    grunt.log.writeln("Getting status for CloudFoundation stack " + data.stackName + "...");
    cloudformation.describeStacks(params, function(err, data){
      if (err) {
        grunt.warn("Status of stack failed - " + err);
      } else {
        grunt.log.writeln("Parameters: " + JSON.stringify(data.Stacks[0].Parameters, null, 1));
        grunt.log.writeln("Outputs: " + JSON.stringify(data.Stacks[0].Outputs, null, 1));
        grunt.log.writeln("Stack ID: " + data.Stacks[0].StackId);
        grunt.log.writeln("Last updated: " + data.Stacks[0].LastUpdatedTime);
        grunt.log.writeln("\nStatus: " + data.Stacks[0].StackStatus);
        callback(null);
      }
    });
  }

};
