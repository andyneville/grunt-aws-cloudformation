'use strict';
const AWS = require("aws-sdk");
const _ = require("lodash");


module.exports = function(grunt) {
	grunt.registerMultiTask('cloudformation', 'Performs AWS CloudFormation tasks', function() {
		var done = this.async();
		var options = this.options({
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			sessionToken: process.env.AWS_SESSION_TOKEN,
		});

		var data = _.defaults(this.data, options);

		if (data.profile) {
			AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: data.profile});
		}

		if (_.isEmpty(data.region)) {
			grunt.warn("Action requires option: region");
		}

		AWS.config.region = data.region;

		var cloudformation = new AWS.CloudFormation();

		if (this.file && this.file.src) {
			var src = grunt.file.expandFiles(this.file.src);
			if (src.length != 1) {
				grunt.warn("This action requires a single src file for a template!");
			}
			data.templateBody = grunt.file.read(src[0]);
		}

		if (!data.action) {
			grunt.fatal("Missing action in options");
		}

		switch(data.action) {
			case "create-stack":
				if (_.isEmpty(data.stackName)) {
					grunt.warn("Action create-stack requires option: stackName");
				}
				var params = {
					StackName: data.stackName,
					Capabilities: data.capabilities
				};
				if (!_.isEmpty(data.templateBody)) {
					params.TemplateBody = data.templateBody;
				} else if (!_.isEmpty(data.templateUrl)) {
					params.TemplateURL = data.templateUrl;
				} else {
					grunt.warn("Action create-stack requires either a templateBody or templateUrl option");
				}
				if (data.params) {
					params.Parameters = [];
					_.forIn(data.params, function(value, key){
						params.Parameters.push({
							ParameterKey: key,
							ParameterValue: value
						});
					});
				}

				grunt.log.writeln("Creating CloudFoundation stack " + params.StackName + "...");
				cloudformation.createStack(params, function(err, data){
					if (err) {
						grunt.warn("Create stack failed - " + err);
					} else {
						grunt.log.writeln("Create stack succeeded:\n" + JSON.stringify(data,null,1));
						done();
					}
				});
				break;
			default:
				grunt.fatal("Unsupported action \"" + data.action + "\"");
				break;
		}
	});
};
