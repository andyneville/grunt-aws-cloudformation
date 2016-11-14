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

This plugin is split over a number of multiTasks depending on what action you want to take, allowing you to set up multiple configurations for each one.
* cloudformation_deploy_stack - Creates a new CloudFormation stack.
* cloudformation_update_stack - Updates a existing CloudFormation stack.
* cloudformation_delete_stack - Removes a single stack and all resources it created.
* cloudformation_stack_status - Displays the status of CloudFormation stack.

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


## Task: cloudformation_deploy_stack

Deploys a new cloudformation stack according to template file or string.
Can also upload files to s3 and add their s3 versionId as Parameter to the template.

##### options.region
Type: `String`
Required: `true`

The AWS region where the stack will be created.

##### options.stackName
Type: `String`
Required: `true`

The name of the CloudFormation stack to be created.

##### options.templateBody
Type: `String`
Required: `templateBody || templateUrl || templatePath`

The body of the template to be used to create the stack.

##### options.templatePath
Type: `String`
Required: `templateBody || templateUrl || templatePath`

The path to a local file containing the template, contents will be added as string.
(overwrites templateBody)

##### options.templateUrl
Type: `String`
Required: `templateBody || templateUrl || templatePath`

The URL to the template (e.g. on AWS S3) to be used to create the stack.

##### options.parameters
Type: `Object`

An object specifying parameter values for the template.
Example: `{ ParameterKey: 'stage', ParameterValue: 'dev' }`

##### options.optionsParameters
Type: `Object`

A second object specifying parameter values for the template, will be concatenated upon the first.
Used for adding task level parameters not to be overwritten by target level parameters.
Example: `{ ParameterKey: 'source', ParameterValue: 'London' }`

##### options.capabilities
Type: `String array`

A list of values that you must specify before AWS CloudFormation can update certain stacks. 
Some stack templates might include resources that can affect permissions in your AWS account, for example, by creating new AWS Identity and Access Management (IAM) users. 
For those stacks, you must explicitly acknowledge their capabilities by specifying this parameter.
The only valid values are CAPABILITY_IAM and CAPABILITY_NAMED_IAM.

##### options.s3Files
Type: `Object array`

Files that will be uploaded to S3 before deploying the stack, version may be added to parameters.
Can contain the following parameters:
- path `string` - required - Local path to the file, eg: "dist/getCustomer_latest.zip"
- s3Key `string` - required - Key to be used for file on S3, can contain path to folder, eg: "functions/getCustomer.zip" 
- s3Bucket `string` - required - Name of the bucket to put the file in on S3.
- versionParam `string` - Name of the parameter top be created with the S3 file version and put into the create stack request.
- cloudformationTemplate `boolean` - If true and templateUrl is set, the s3 file version will be concatenated to it. ("?versionId=ndgJNIUN877unHh89h")

Example:
```js
    cloudformation_deploy_stack: {
      options: {
        region: "eu-central-1",
        capabilities: ["CAPABILITY_IAM"],
        optionsParameters: []
      },

      mystack_dev: {
        stackName: "myStack-dev",
        parameters: [
          {
            ParameterKey: 'stage',
            ParameterValue: 'dev'
          }
        ],
        templateURL: "https://s3.eu-central-1.amazonaws.com/mystack-bucket/cloudformation.yml",
        s3files: [
          {
            path: "cloudformation/cloudformation.yml",
            s3Key: "cloudformation.yml",
            s3Bucket: "mystack-bucket",
            cloudformationTemplate: true
          },
          {
            path: "dist/getCustomers_latest.zip",
            s3Key: "functions/getCustomers.zip",
            s3Bucket: "mystack-bucket",
            versionParam: "getCustomersS3Version"
          },
          {
            path: "dist/swagger.json",
            s3Key: "swagger.json",
            s3Bucket: "mystack-bucket",
            versionParam: "swaggerS3Version"
          }
        ]
      }
    }
```

## Task: cloudformation_update_stack

Updates a stack that is already deployed by applying a new or modified template.
Uses the same options as create_stack except for parameters.
To trigger changes in resources defined in other files (ie Lambda code) file name or version must be updated, use s3files with versionParam to achieve this.

##### options.parameters
Type: `Object`

In update_stack the only difference is parameters that may have the "UsePreviousValue" boolean set to true instead of a value.

Example:
```js
    cloudformation_update_stack: {
      options: {
        region: "eu-central-1",
        capabilities: ["CAPABILITY_IAM"],
        optionsParameters: [
          {
            ParameterKey: 'stage',
            UsePreviousValue: true
          },
          {
            ParameterKey: 'getCustomersS3Version',
            UsePreviousValue: true
          },
          {
            ParameterKey: 'swaggerS3Version',
            UsePreviousValue: true
          }
        ]
      },

      mystack_dev_lambda: {
        stackName: "myStack-dev",
        parameters: [],
        templateURL: "https://s3.eu-central-1.amazonaws.com/mystack-bucket/cloudformation.yml",
        s3files: [
          {
            path: "cloudformation/cloudformation.yml",
            s3Key: "cloudformation.yml",
            s3Bucket: "mystack-bucket",
            cloudformationTemplate: true
          },
          {
            path: "dist/getCustomers_latest.zip",
            s3Key: "functions/getCustomers.zip",
            s3Bucket: "mystack-bucket",
            versionParam: "getCustomersS3Version"
          }
        ]
      }
    }
```

## Task: cloudformation_delete_stack

Deletes a single stack and all resources created by it.

##### options.region
Type: `string`
Required: `true`

The region the stack should be removed from.

##### options.stackName
Type: `string`
Required: `true`

The name of the stack to be removed.

Example:
```js
    cloudformation_delete_stack: {
      options: {
        region: "eu-central-1"
      },
      mystack_dev: {
        stackName: "mystack-dev"
      }
    }
```

## Task: cloudformation_stack_status

Prints the status, parameters, outputs, id and last updated date of a stack.

##### options.region
Type: `string`
Required: `true`

The region the stack is in.

##### options.stackName
Type: `string`
Required: `true`

The name of the stack.

Example:
```js
    cloudformation_stack_status: {
      options: {
        region: "eu-central-1"
      },
      mystack_dev: {
        stackName: "mystack-dev"
      }
    }
```