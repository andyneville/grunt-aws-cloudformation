'use strict';

const AWS = require("aws-sdk");
const _ = require("lodash");
const async = require("async");
const s3utils = require("../utils/s3utils");

module.exports = function(grunt) {

  grunt.registerMultiTask("cloudformation_update_stack",
    "uploads files to S3 and updates stack with file versions as parameters.",
    function() {
      var done = this.async();
      var options = this.options({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
        region: 'us-east-1',
        capabilities: [],
        optionsParameters: null,
        templateBody: null,
        templatePath: null,
        templateURL: null,
        s3files: null,
        stackName: null,
        parameters: []
      });

      var data = _.defaults(this.data, options);

      if (data.profile) {
        AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: data.profile});
      }

      AWS.config.region = data.region;

      if (this.data.templatePath) {
        data.templateBody = grunt.file.read(this.data.templatePath);
      }

      if(data.optionsParameters) {
        data.parameters = data.parameters.concat(data.optionsParameters);
      }

      async.series([
        function(callback) {
          checkData(data, callback);
        },
        function(callback) {
          async.each(data.s3files, sendFile.bind(null, data), callback);
        },
        function(callback) {
          updateCloudformation(data, callback);
        }
      ], function (err) {
        done(!err);
      });


    });

  function checkData(data, callback) {
    if (_.isEmpty(data.region)) {
      grunt.warn("Function requires option: region");
    }
    if (_.isEmpty(data.stackName)) {
      grunt.warn("Function requires option: stackName");
    }
    if (_.isEmpty(data.region)) {
      grunt.warn("Function requires option: region");
    }
    if (_.isEmpty(data.templateBody) && _.isEmpty(data.templateURL)) {
      grunt.warn("Function requires option: templatePath, templateURL or templateBody");
    }
    if (_.isEmpty(data.s3files)) {
      grunt.warn("Function requires option: s3files");
    }
    callback(null);
  }

  function sendFile(data, file, callback) {
    grunt.log.writeln("Uploading S3 file " + file.s3Key + "...");
    s3utils.uploadFile(grunt, file, data.region, function (err, s3data) {
      if(err) {
        grunt.warn(err);
      } else {
        grunt.log.writeln("Uploaded file: " + file.s3Key);
        if(file.versionParam && s3data.VersionId) {
          data.parameters.push({
            ParameterKey: file.versionParam,
            ParameterValue: s3data.VersionId
          });
        }
        if(file.cloudformationTemplate && data.templateURL && s3data.VersionId) {
          data.templateURL += "?versionId=" + s3data.VersionId;
        }
        callback(null);
      }
    });
  }

  function updateCloudformation(data, callback) {
    var params = {
      StackName: data.stackName,
      Capabilities: data.capabilities,
      TemplateBody: data.templateBody,
      TemplateURL: data.templateURL,
      Parameters: data.parameters
    };

    var cloudformation = new AWS.CloudFormation();
    grunt.log.writeln("Creating CloudFoundation stack " + data.stackName + "...");
    cloudformation.updateStack(params, function(err, data){
      if (err) {
        grunt.warn("Update stack failed - " + err);
      } else {
        grunt.log.writeln("Update stack:\n" + JSON.stringify(data,null,1));
        callback(null);
      }
    });
  }

};
