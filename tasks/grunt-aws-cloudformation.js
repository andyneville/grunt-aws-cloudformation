'use strict';
const AWS = require("aws-sdk");
const _ = require("lodash");
const async = require("async");

const completeStatuses = [
	"CREATE_COMPLETE",
	"DELETE_COMPLETE",
	"UPDATE_COMPLETE"
];

const failedStatuses = [
	"CREATE_FAILED",
	"ROLLBACK_COMPLETE",
	"DELETE_FAILED",
	"UPDATE_FAILED",
	"UPDATE_ROLLBACK_COMPLETE"
];

function CloudFormation(grunt, options){
	this.grunt = grunt;
	this.options = options;
	this.cloudformation = new AWS.CloudFormation();
}

CloudFormation.prototype.checkIfStackExists = function(callback){
	var self = this;
	if (self.stackExists != null) {
		return callback();
	}
	self.grunt.verbose.writeln("Checking whether stack " + self.options.stackName + " exists");
	self.cloudformation.describeStacks({ StackName: self.options.stackName }, function(err, data) {
		if (err && err.message && err.message.indexOf("Stack ") == 0 && err.message.indexOf(" does not exist") > 0)  {
			self.grunt.verbose.writeln("  stack does not exist");
			self.stackExists = false;
			callback();
		} else if (err) {
			self.grunt.verbose.error("Loading description failed: " + JSON.stringify(err));
			callback(err);
		} else if (data && data.Stacks && data.Stacks.length == 1) {
			self.grunt.verbose.writeln("  stack exists");
			self.stackExists = true;
			self.stackId = data.Stacks[0].StackId;
			callback();
		} else {
			self.grunt.verbose.error("Loading description returned invalid result: " + JSON.stringify(data));
			callback(new Error("Invalid describeStacks result"));
		}
	});
};


CloudFormation.prototype.loadStackEvents = function(callback){
	var self = this;

	self.grunt.verbose.writeln("Loading previous events for stack " + self.options.stackName);
	self.cloudformation.describeStackEvents({ StackName: self.stackId || self.options.stackName }, function(err, data) {
		if (err) {
			self.grunt.verbose.error("Loading stack events failed: " + JSON.stringify(err));
			callback(err);
		} else {
			self.grunt.verbose.writeln("  stack " + self.options.stackName + " exists");
			self.stackEvents = data.StackEvents;
			callback();
		}
	});
};

CloudFormation.prototype.createStack = function(callback){
	var self = this;
	var params = {};
	var options = self.options;

	params.StackName = self.options.stackName;
	if (!_.isEmpty(options.templateBody)) {
		params.TemplateBody = options.templateBody;
	} else if (!_.isEmpty(options.templateUrl)) {
		params.TemplateURL = options.templateUrl;
	}

	// Optional parameters
	params.Capabilities = options.capabilities;
	params.DisableRollback = options.disableRollback;
	params.OnFailure = options.onFailure;
	params.NotificationARNs = options.notificationARNs;
	params.ResourceTypes = options.resourceTypes;
	params.RoleARN = options.roleARN;
	params.StackPolicyBody = options.stackPolicyBody;
	params.StackPolicyURL = options.stackPolicyURL;
	params.Tags = options.tags;
	params.TimeoutInMinutes = options.timeoutInMinutes;

	if (options.params) {
		params.Parameters = [];
		_.forIn(options.params, function(value, key){
			params.Parameters.push({
				ParameterKey: key,
				ParameterValue: value
			});
		});
	}

	self.grunt.verbose.writeln("Creating stack " + options.stackName);
	self.cloudformation.createStack(params, function(err, data) {
		if (err) {
			self.grunt.verbose.error("Creating stack failed: " + err);
			callback(err);
		} else if (!data || !data.StackId) {
			self.grunt.verbose.error("Creating stack returned invalid result: " + JSON.stringify(data));
			callback(new Error("Invalid createStack result"));
		} else {
			self.grunt.verbose.writeln("  stack " + data.StackId + " has started creating");
			self.stackId = data.StackId;
			callback();
		}
	});
};

CloudFormation.prototype.actionCreateStack = function(callback) {
	var self = this;
	var options = self.options;

	if (!options.stackName){
		self.grunt.warn("Create stack missing required option 'stackName'");
	}

	if (_.isEmpty(options.templateBody) && _.isEmpty(options.templateUrl)) {
		self.grunt.warn("Create stack requires either a 'templateBody' or 'templateUrl' option");
	}

	async.waterfall([
		function (next) {
			self.checkIfStackExists(next);
		},
		function (next) {
			if (self.stackExists != true || options.deleteIfExists != true) {
				return next();
			}
			options.trackStatus = true;
			self.loadStackEvents(function(err){
				if (err) {
					return next(err);
				}
				self.grunt.log.notverbose.write('Deleting preexisting stack ' + options.stackName);
				self.deleteStack(function(err){
					if (err) {
						return next(err);
					}
					self.trackStatus(next);
				});
			});
		},
		function (next) {
			self.createStack(next);
		},
		function (next) {
			if (options.trackStatus == false) {
				return next();
			}
			self.grunt.log.notverbose.write('Creating stack ' + options.stackName);
			self.trackStatus(function(err){
				if (err) {
					return next(err);
				}
				if (!self.options.outputKey) {
					return next();
				}
				self.updateOutputs(next);
			});
		}


	], function (err) {
		callback(err);
	});
};

CloudFormation.prototype.updateStack = function(callback){
	var self = this;
	var params = {};
	var options = self.options;

	params.StackName = self.options.stackName;
	if (!_.isEmpty(options.templateBody)) {
		params.TemplateBody = options.templateBody;
	} else if (!_.isEmpty(options.templateUrl)) {
		params.TemplateURL = options.templateUrl;
	} else if (options.usePreviousTemplate == true) {
		params.UsePreviousTemplate = true;
	}

	// Optional parameters
	params.Capabilities = options.capabilities;
	params.NotificationARNs = options.notificationARNs;
	params.ResourceTypes = options.resourceTypes;
	params.RoleARN = options.roleARN;
	params.StackPolicyBody = options.stackPolicyBody;
	params.StackPolicyURL = options.stackPolicyURL;
	params.Tags = options.tags;

	if (options.params) {
		params.Parameters = [];
		_.forIn(options.params, function(value, key){
			if (value === true) {
				params.Parameters.push({
					ParameterKey: key,
					UsePreviousValue: true
				});
			} else {
				params.Parameters.push({
					ParameterKey: key,
					ParameterValue: value
				});
			}
		});
	}

	self.grunt.verbose.writeln("Updating stack " + options.stackName);
	self.cloudformation.updateStack(params, function(err, data) {
		if (err) {
			self.grunt.verbose.error("Updating stack failed: " + err);
			callback(err);
		} else if (!data || !data.StackId) {
			self.grunt.verbose.error("Updating stack returned invalid result: " + JSON.stringify(data));
			callback(new Error("Invalid updateStack result"));
		} else {
			self.grunt.verbose.writeln("  stack " + data.StackId + " has started updating");
			self.stackId = data.StackId;
			callback();
		}
	});
};

CloudFormation.prototype.actionUpdateStack = function(callback) {
	var self = this;
	var options = self.options;

	if (!options.stackName){
		self.grunt.warn("Update stack missing required option 'stackName'");
	}

	if (_.isEmpty(options.templateBody) && _.isEmpty(options.templateUrl) && options.usePreviousTemplate != true) {
		self.grunt.warn("Update stack requires either a 'templateBody', 'templateUrl', or 'usePreviousTemplate' option");
	}

	async.waterfall([
		function (next) {
			self.checkIfStackExists(function(err){
				if (err) {
					return next(err);
				}
				if (self.stackExists != true) {
					return next(new Error("Stack " + options.stackName + " does not exist, update failed"));
				}
				next();
			});
		},
		function (next) {
			if (options.trackStatus != false) {
				self.loadStackEvents(next);
			} else {
				next();
			}
		},
		function (next) {
			self.updateStack(next);
		},
		function (next) {
			if (options.trackStatus == false) {
				return next();
			}
			self.grunt.log.notverbose.write('Updating stack ' + options.stackName);
			self.trackStatus(function(err){
				if (err) {
					return next(err);
				}
				if (!self.options.outputKey) {
					return next();
				}
				self.updateOutputs(next);
			});
		}
	], function (err) {
		callback(err);
	});
};

CloudFormation.prototype.deleteStack = function(callback){
	var self = this;
	var params = {};
	var options = self.options;

	params.StackName = self.options.stackName;

	// Optional parameters
	params.RetainResources = options.retainResources;
	params.RoleARN = options.roleARN;

	self.grunt.verbose.writeln("Deleting stack " + options.stackName);
	self.cloudformation.deleteStack(params, function(err, data) {
		if (err) {
			self.grunt.verbose.error("Deleting stack failed: " + err);
			callback(err);
		} else {
			self.grunt.verbose.writeln("  stack " + options.stackName + " has started deleting");
			callback();
		}
	});
};

CloudFormation.prototype.actionDeleteStack = function(callback) {
	var self = this;
	var options = self.options;

	if (!options.stackName){
		self.grunt.warn("Delete stack missing required option 'stackName'");
	}

	async.waterfall([
		function (next) {
			self.checkIfStackExists(next);
		},
		function (next) {
			if (self.stackExists == true && options.trackStatus != false) {
				self.loadStackEvents(next);
			} else {
				next();
			}
		},
		function (next) {
			if (self.stackExists != true) {
				return next();
			}
			self.deleteStack(next);
		},
		function (next) {
			if (self.stackExists != true || options.trackStatus == false) {
				return next();
			}
			self.grunt.log.notverbose.write('Deleting stack ' + options.stackName);
			self.trackStatus(next);
		}
	], function (err) {
		callback(err);
	});
};


CloudFormation.prototype.describeStack = function(callback){
	var self = this;
	self.grunt.verbose.writeln("Loading description of stack " + self.options.stackName);
	self.cloudformation.describeStacks({StackName: self.options.stackName}, function(err, data) {
		if (err) {
			self.grunt.verbose.error("Loading stack description failed: " + err);
			callback(err);
		} else if (data && data.Stacks && data.Stacks.length == 1) {
			self.grunt.verbose.writeln("  stack " + self.options.stackName + " status is " + data.Stacks[0].StackStatus);
			self.grunt.log.notverbose.writeln("Stack " + self.options.stackName + " status is " + data.Stacks[0].StackStatus);
			if (data.Stacks[0].Outputs && self.options.outputKey) {
				_.each(data.Stacks[0].Outputs, function(output){
					self.grunt.verbose.writeln("Setting output config `" + self.options.outputKey + "." + output.OutputKey + "` to value " + output.OutputValue);
					self.grunt.config.set(self.options.outputKey + "." + output.OutputKey, output.OutputValue);
				});
			}
			self.grunt.verbose.writeln("Stack:\n" + JSON.stringify(data.Stacks[0], null, 2));
			callback(null);
		} else {
			self.grunt.verbose.error("Loading description returned invalid result: " + JSON.stringify(data));
			callback(new Error("Invalid describeStacks result"));
		}
	});
};

CloudFormation.prototype.actionDescribeStack = function(callback) {
	var self = this;
	var options = self.options;

	if (!options.stackName){
		self.grunt.warn("Describe stack missing required option 'stackName'");
	}

	self.describeStack(function (err) {
		callback(err);
	});
};

CloudFormation.prototype.trackStatus = function(callback){
	var self = this;
	var eventMap = {};

	var firstError = null;
	if (self.stackEvents) {
		_.each(self.stackEvents, function(event){ eventMap[event.EventId] = true; });
	}

	var complete = false;
	var failed = false;

	function updateStatus(){
		self.cloudformation.describeStackEvents({StackName: self.stackId}, function(err, data) {
			if (err) {
				self.grunt.verbose.error("Error tracking stack status: " + err);
				return callback(err);
			} else {
				if (data.StackEvents && data.StackEvents.length > 0) {
					var events = _.sortBy(data.StackEvents, function(event) {
						return event.Timestamp.getTime();
					});
					_.each(events, function(event){
						if (eventMap[event.EventId]) {
							return;
						}
						eventMap[event.EventId] = event;
						var message = event.LogicalResourceId +
							" (" + event.ResourceType + ") - " +
							event.ResourceStatus +
							(event.ResourceStatusReason ? " - " + event.ResourceStatusReason : "");
						if (_.includes(failedStatuses, event.ResourceStatus)) {
							if (firstError == null) {
								firstError = message;
								self.grunt.log.notverbose.error(message);
							}
							self.grunt.verbose.error(message);
						} else {
							self.grunt.verbose.writeln(message);
						}
						self.grunt.log.notverbose.write('.');
						if (event.ResourceType == "AWS::CloudFormation::Stack") {
							if (_.includes(completeStatuses, event.ResourceStatus)) {
								complete = true;
							} else if (_.includes(failedStatuses, event.ResourceStatus)) {
								complete = true;
								failed = true;
							}
						}
					});
				}
				if (complete) {
					if (failed) {
						self.grunt.verbose.error();
						self.grunt.log.notverbose.error();
						callback("Error: " + firstError);
					} else {
						self.grunt.log.notverbose.ok();
						callback();
					}
				} else {
					setTimeout(updateStatus, self.options.trackPollingPeriod);
				}
			}
		});
	}
	updateStatus();
};


CloudFormation.prototype.updateOutputs = function(callback){
	var self = this;
	self.grunt.verbose.writeln("Getting stack output values");
	self.cloudformation.describeStacks({StackName: self.stackId}, function(err, data) {
		if (err) {
			self.grunt.verbose.error("Error describing stack: " + err);
			return callback(err);
		} else if (data && data.Stacks && data.Stacks.length == 1) {
			if (data.Stacks[0].Outputs && self.options.outputKey) {
				var outputs = {};
				_.each(data.Stacks[0].Outputs, function(output){
					self.grunt.verbose.writeln("Setting output config `" + self.options.outputKey + "." + output.OutputKey + "` to value " + output.OutputValue);
					self.grunt.config.set(self.options.outputKey + "." + output.OutputKey, output.OutputValue);
				});
			}
			callback();
		} else {
			self.grunt.verbose.error("Loading description returned invalid result: " + JSON.stringify(data));
			callback(new Error("Invalid describeStacks result"));
		}
	});
};

module.exports = function(grunt) {

	grunt.registerMultiTask('cloudformation', 'Performs AWS CloudFormation tasks', function() {
		var done = this.async();
		var options = this.options({
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			sessionToken: process.env.AWS_SESSION_TOKEN,
			trackStatus: true,
			trackPollingPeriod: 1000
		});

		var data = _.defaults(this.data, options);

		if (data.profile) {
			AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: data.profile});
		}

		if (_.isEmpty(data.region)) {
			grunt.warn("Action requires option: region");
		}

		AWS.config.region = data.region;

		if (this.filesSrc && this.filesSrc.length > 0) {
			if (this.filesSrc.length != 1) {
				grunt.warn("A template source can only contain a single file");
			}
			data.templateBody = grunt.file.read(this.filesSrc[0]);
		}

		if (!data.action) {
			grunt.fatal("Missing action in options");
		}

		var cloudformation = new CloudFormation(grunt, data);

		switch(data.action) {
			case "create-stack":
				cloudformation.actionCreateStack(function(err){
					if (err) {
						grunt.warn("Error creating stack: " + err);
					}
					done();
				});
				return;

			case "delete-stack":
				cloudformation.actionDeleteStack(function(err){
					if (err) {
						grunt.warn("Error deleting stack: " + err);
					}
					done();
				});
				return;

			case "update-stack":
				cloudformation.actionUpdateStack(function(err){
					if (err) {
						grunt.warn("Error updating stack: " + err);
					}
					done();
				});
				return;

			case "describe-stack":
			case "stack-status": // for backware compatibility
				cloudformation.actionDescribeStack(function(err){
					if (err) {
						grunt.warn("Error describing stack: " + err);
					}
					done();
				});
				return;

			default:
				grunt.fatal("Unsupported action \"" + data.action + "\"");
				break;
		}
	});
};
