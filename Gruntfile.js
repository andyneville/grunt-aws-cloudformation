'use strict';
const _ = require('lodash');
const async = require('async');
const AWS = require('aws-sdk');

module.exports = function(grunt) {
	grunt.initConfig({
		version: {
			project: {
				src: ['package.json']
			}
		},
		cloudformation: {
			options: {
				region: 'us-west-2'
			},
			simpleCreate: {
				action: "create-stack",
				trackProgress: true,
				stackName: "test-grunt-aws-cloudformation",
				params: {
					ProvisionedThroughput: "7"
				},
				outputKey: 'validateThroughput.simpleCreate',
				deleteIfExists: true,
				src: ['test/templates/SimpleDynamo.template']
			},
			simpleDescribe: {
				action: "describe-stack",
				stackName: "test-grunt-aws-cloudformation",
				outputKey: 'validateThroughput.simpleDescribe',
			},
			simpleUpdate1: {
				action: "update-stack",
				trackProgress: true,
				stackName: "test-grunt-aws-cloudformation",
				params: {
					ProvisionedThroughput: "8"
				},
				outputKey: 'validateThroughput.simpleUpdate1',
				usePreviousTemplate: true
			},
			simpleUpdate2: {
				action: "update-stack",
				trackProgress: true,
				stackName: "test-grunt-aws-cloudformation",
				outputKey: 'validateThroughput.simpleUpdate2',
				src: ['test/templates/SimpleDynamoUpdate.template']
			},
			simpleDelete: {
				action: "delete-stack",
				trackProgress: true,
				stackName: "test-grunt-aws-cloudformation"
			}
		},
		validateThroughput: {
			options: {
				region: 'us-west-2'
			},
			simpleCreate: {
				expectedThroughput: "7"
			},
			simpleDescribe: {
				expectedThroughput: "7"
			},
			simpleUpdate1: {
				expectedThroughput: "8"
			},
			simpleUpdate2: {
				expectedThroughput: "6"
			}
		}
	});

	grunt.loadTasks('./tasks');

	grunt.registerMultiTask("validateThroughput", function(){
		var options = _.defaults(this.data, this.options({
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			sessionToken: process.env.AWS_SESSION_TOKEN
		}));
		if (options.profile) {
			AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: options.profile});
		}

		AWS.config.region = options.region;

		if (!options.TableName) {
			grunt.warn("Output TableName not set!");
		}

		var done = this.async();

		var dynamodb = new AWS.DynamoDB();

		dynamodb.describeTable({TableName: options.TableName}, function(err, data) {
			if (err) {
				grunt.warn("Validating table settings failed: " + err);
			}
			if (data.Table && data.Table.ProvisionedThroughput &&
				data.Table.ProvisionedThroughput.ReadCapacityUnits == options.expectedThroughput &&
				data.Table.ProvisionedThroughput.WriteCapacityUnits == options.expectedThroughput) {
				grunt.log.writeln("Verified correct provisioned throughput settings for table " + options.TableName);
				done();
			} else {
				grunt.warn("Provisioned throughput settings did not match expected value (" +
					options.expectedThroughput + ") - actual table: " + JSON.stringify(data,null,1));
			}
		});
	});

	grunt.registerTask("create", ["cloudformation:simpleCreate", "validateThroughput:simpleCreate"]);
	grunt.registerTask("describe", ["cloudformation:simpleDescribe", "validateThroughput:simpleDescribe"]);
	grunt.registerTask("update1", ["cloudformation:simpleUpdate1", "validateThroughput:simpleUpdate1"]);
	grunt.registerTask("update2", ["cloudformation:simpleUpdate2", "validateThroughput:simpleUpdate2"]);
	grunt.registerTask("delete", ["cloudformation:simpleDelete"]);

	grunt.registerTask("test", ["create", "describe", "update1", "update2", "delete"]);
};