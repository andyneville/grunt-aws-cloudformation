# grunt-aws-cloudformation

[![NPM version](https://img.shields.io/npm/v/grunt-aws-cloudformation.svg)](https://www.npmjs.com/package/grunt-aws-cloudformation)
[![Open Issues](https://img.shields.io/github/issues/andyneville/grunt-aws-cloudformation.svg)](https://github.com/andyneville/grunt-aws-cloudformation/issues)
[![Build Status](https://img.shields.io/travis/andyneville/grunt-aws-cloudformation.svg)](https://travis-ci.org/andyneville/grunt-aws-cloudformation)

> A grunt task to perform [AWS CloudFormation](http://aws.amazon.com/cloudformation/) operations.

## Installation

This is a task for the [Grunt](http://gruntjs.com/) tool, if you are not familiar please start with the [Getting Started](http://gruntjs.com/getting-started) guide to learn the basics for creating your [Gruntfile](http://gruntjs.com/sample-gruntfile) and how to use Grunt plugins.

To add the CloudFormation task to your project, first install the plug-in to your project with the command:

```bash
$ npm install grunt-aws-cloudformation --save-dev
```

and then add the following line to your Gruntfile:

```js
grunt.loadNpmTasks('grunt-aws-cloudformation');
```


### Overview

This plugin contains a single task called `cloudformation`. It can be used to perform the following actions:
* [create-stack](#using-the-create-stack-action) - Creates a new CloudFormation stack
* [update-stack](#using-the-update-stack-action) - Updates an existing CloudFormation stack
* [delete-stack](#using-the-delete-stack-action) - Deletes an existing CloudFormation stack
* [describe-stack](#using-the-describe-stack-action) - Describes an existing CloudFormation stack's status



### Example
```javascript
'use strict';
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-aws-cloudformation');

  grunt.initConfig({
    cloudformation: {
      options: {
        region: 'us-west-2',
        accessKeyId: "AAAAAAAAAAAAAAAAA",
        secretAccessKey: "XxXxXxXxXxXxXxXxXxXxXxXxXx"
      },
      createMyStack: {
        action: "create-stack",
        stackName: "my-stack",
        params: {
          SomeParameter: "Foo"
        },
        deleteIfExists: true,
        src: ['templates/MyStack.template']
      },
      deleteMyStack: {
        action: "delete-stack",
        stackName: "my-stack"
      }
    }
  });

  grunt.registerTask("default", ["cloudformation:createMyStack"]);
};
```
In this example, you could use the command `grunt` (or `grunt cloudformation:createMyStack`) to create the stack,
and the command `grunt cloudformation:deleteMyStack` would delete it.  For more examples, see the tests defined in
this project's [Gruntfile.js](./blob/master/Gruntfile.js).


### Authentication options

All CloudFormation actions can authenticate using either environment variables,
arguments specifying an access key/secret pair, a session token, or a saved configuration
profile (in `~/.aws/credentials`).

##### options.accessKeyId
Type: `String`
Default value: `the current value of the environment variable AWS_ACCESS_KEY_ID, if present`

The AWS access key id credential to use for authentication.

##### options.secretAccessKey
Type: `String`
Default value: `the current value of the environment variable AWS_SECRET_ACCESS_KEY, if present`

The AWS secret access key credential to use for authentication.

##### options.sessionToken
Type: `String`
Default value: `the current value of the environment variable AWS_SESSION_TOKEN, if present`

The AWS session token to use for authentication.

##### options.profile
Type: `String`

The profile in the `~/.aws/credentials` saved credentials to use.



### Common options

The following options are shared by all CloudFormation actions.

##### options.region
Type: `String`
*Required*

The AWS region where the stack either already exists or will be created.

##### options.action
Type: `String`
*Required*

The action to perform, which must be one of:
* create-stack
* update-stack
* delete-stack
* describe-stack



### Using the `create-stack` action

Use the `create-stack` action to create a new CloudFormation stack.

##### options.stackName
Type: `String`
*Required*

The name of the CloudFormation stack to be created.

##### options.templateBody
Type: `String`

The body of the template to be used to create the stack. This can also be specified as a src file in standard Grunt format.
You must specify either a templateBody (or src file) or templateUrl parameter

##### options.templateUrl
Type: `String`

The URL to the template (e.g. on AWS S3) to be used to create the stack.

##### options.trackStatus
Type: `Boolean`
Default: `true`

When true, the grunt task will track the progress of the create action until it completes or fails,
displaying progress dots (or detailed information in `--verbose` mode). When false, the task
simply initiates the create stack process, in which case the Grunt task will
complete before the stack is created.

##### options.outputKey
Type: `String`

If set, the grunt task will read all Output parameters after the creation of the stack, and append them to the
outputKey in the Grunt config, where a subsequent task could pick them up if desired.  For example, if outputKey
is set to `myTask.options`, and there is an Output of `foo`, then it's value would be set (via `grunt.config.set`)
to the key `myTask.options.foo`. Note that *trackStatus* must also be set to true (its default), otherwise the
Grunt task will not wait for the template to be created and therefore won't get the Outputs.

##### options.params
Type: `Object`

An object specifying parameter values for the template.

##### options.capabilities
Type: `String array`

A list of values that you must specify before AWS CloudFormation can update certain stacks. 
Some stack templates might include resources that can affect permissions in your AWS account, for example, by creating
new AWS Identity and Access Management (IAM) users. 
For those stacks, you must explicitly acknowledge their capabilities by specifying this parameter.
The only valid values are CAPABILITY_IAM and CAPABILITY_NAMED_IAM.

#### Other create-stack options
The following parameters can be specified and are treated exactly as in the documentation for the `createStack` function
described in the [AWS CloudFormation SDK's createStack function](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFormation.html#createStack-property)
##### options.disableRollback
##### options.onFailure
##### options.notificationARNs
##### options.resourceTypes
##### options.roleARN
##### options.stackPolicyBody
##### options.stackPolicyURL
##### options.tags
##### options.timeoutInMinutes



### Using the `update-stack` action

Use the `update-stack` action to update an existing CloudFormation stack. You must specify either a templateBody (or src file)
or templateUrl parameter, or the usePreviousTemplate=true parameter.

##### options.stackName
Type: `String`
*Required*

The name of the CloudFormation stack to be updated.

##### options.templateBody
Type: `String`

The body of the template to be used to update the stack. This can also be specified as a src file in standard Grunt format.

##### options.templateUrl
Type: `String`

The URL to the template (e.g. on AWS S3) to be used to update the stack.

##### options.usePreviousTemplate
Type: `Boolean`

The body of the template to be used to create the stack. This can also be specified as a src file in standard Grunt format.

##### options.trackStatus
Type: `Boolean`
Default: `true`

When true, the grunt task will track the progress of the update action until it completes or fails,
displaying progress dots (or detailed information in `--verbose` mode). When false, the task
simply initiates the update stack process, in which case the Grunt task will complete before the stack is updated.

##### options.outputKey
Type: `String`

If set, the grunt task will read all Output parameters after the update of the stack, and append them to the
outputKey in the Grunt config, where a subsequent task could pick them up if desired.  For example, if outputKey
is set to `myTask.options`, and there is an Output of `foo`, then it's value would be set (via `grunt.config.set`)
to the key `myTask.options.foo`. Note that *trackStatus* must also be set to true (its default), otherwise the
Grunt task will not wait for the template to be updated and therefore won't get the Outputs.

##### options.params
Type: `Object`

An object specifying parameter values for the template.  Pass a string value to specify a new value, or pass the boolean
value `true` to use the previous value.

##### options.capabilities
Type: `String array`

A list of values that you must specify before AWS CloudFormation can update certain stacks. 
Some stack templates might include resources that can affect permissions in your AWS account, for example, by creating
new AWS Identity and Access Management (IAM) users. 
For those stacks, you must explicitly acknowledge their capabilities by specifying this parameter.
The only valid values are CAPABILITY_IAM and CAPABILITY_NAMED_IAM.

#### Other update-stack options
The following parameters can be specified and are treated exactly as in the documentation for the `updateStack` function
described in the [AWS CloudFormation SDK's updateStack function](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFormation.html#updateStack-property)
##### options.notificationARNs
##### options.resourceTypes
##### options.roleARN
##### options.stackPolicyBody
##### options.stackPolicyURL
##### options.tags



### Using the `delete-stack` action

Use the `delete-stack` action to delete an existing CloudFormation stack.

##### options.stackName
Type: `String`
*Required*

The name of the CloudFormation stack to be deleted.

##### options.trackStatus
Type: `Boolean`
Default: `true`

When true, the grunt task will track the progress of the delete action until it completes or fails,
displaying progress dots (or detailed information in `--verbose` mode). When false, the task
simply initiates the delete stack process, in which case the Grunt task will complete before the stack is deleted.

#### Other delete-stack options
The following parameters can be specified and are treated exactly as in the documentation for the `deleteStack` function
described in the [AWS CloudFormation SDK's deleteStack function](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFormation.html#deleteStack-property)
##### options.retainResources
##### options.roleARN



### Using the `describe-stack` action

Use the `describe-stack` action to get the current status information about your stack and read Output values. Using
the `--verbose` flag will also print out all underlying stack information.

##### options.stackName
Type: `String`

The name of the CloudFormation stack to be described.
