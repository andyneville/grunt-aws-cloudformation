'use strict';
var AWS = require("aws-sdk");

module.exports = function(grunt) {
	grunt.registerTask('cloudformation', 'Performs AWS CloudFormation tasks', function() {
		var done = this.async();

		done();
	});
};
