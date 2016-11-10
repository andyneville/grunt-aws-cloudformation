# grunt-aws-cloudformation

[![NPM version](https://img.shields.io/npm/v/grunt-aws-cloudformation.svg)](https://www.npmjs.com/package/grunt-aws-cloudformation)
[![Open Issues](https://img.shields.io/github/issues/andyneville/grunt-aws-cloudformation.svg)](https://github.com/andyneville/grunt-aws-cloudformation/issues)


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
* create-stack - Creates a new CloudFormation stack
* update-stack - Updates a existing CloudFormation stack
* stack-status - Displays the status of CloudFormation stack(s)

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



### Using the `create-stack` action

Use the `create-stack` action to create a new CloudFormation stack.

##### options.stackName
Type: `String`
*Required*

The name of the CloudFormation stack to be created.

##### options.templateBody
Type: `String`

The body of the template to be used to create the stack. This can also be specified as a src file in standard Grunt format.

##### options.templateUrl
Type: `String`

The URL to the template (e.g. on AWS S3) to be used to create the stack.

##### options.params
Type: `Object`

An object specifying parameter values for the template.

##### options.capabilities
Type: `String array`

A list of values that you must specify before AWS CloudFormation can update certain stacks. 
Some stack templates might include resources that can affect permissions in your AWS account, for example, by creating new AWS Identity and Access Management (IAM) users. 
For those stacks, you must explicitly acknowledge their capabilities by specifying this parameter.
The only valid values are CAPABILITY_IAM and CAPABILITY_NAMED_IAM.


### Using the `update-stack` action

Use the `update-stack` action to update a existing CloudFormation stack.

##### options.stackName
Type: `String`
*Required*

The name of the CloudFormation stack to be created.

##### options.templateBody
Type: `String`

The body of the template to be used to create the stack. This can also be specified as a src file in standard Grunt format.

##### options.templateUrl
Type: `String`

The URL to the template (e.g. on AWS S3) to be used to create the stack.

##### options.params
Type: `Object`

An object specifying parameter values for the template.
String values passed as parameter value, true boolean passed as UsePreviousValue. 

##### options.capabilities
Type: `String array`

A list of values that you must specify before AWS CloudFormation can update certain stacks. 
Some stack templates might include resources that can affect permissions in your AWS account, for example, by creating new AWS Identity and Access Management (IAM) users. 
For those stacks, you must explicitly acknowledge their capabilities by specifying this parameter.
The only valid values are CAPABILITY_IAM and CAPABILITY_NAMED_IAM.


### Using the `stack-status` action

Use the `stack-status` action to get the current status information about your stack.
Includes data like status message, last update time, parameters, output values etc.

##### options.stackName
Type: `String`

The name of the CloudFormation stack to be created.

##### options.nextToken
Type: `String`

A string that identifies the next page of stacks that you want to retrieve.


### Using the `delete-stack` action

Use the `delete-stack` action to delete a stack and all associated resources.

##### options.stackName
Type: `String`

The name of the CloudFormation stack.
