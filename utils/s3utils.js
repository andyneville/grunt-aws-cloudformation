var AWS = require("aws-sdk");

module.exports.uploadFile = function (grunt, file, region, callback) {
  /** @namespace file.s3Key */
  /** @namespace file.s3Bucket */
  /** @namespace file.path */

  AWS.config.update({region: region});
  var s3 = new AWS.S3();

  var param = {
    Bucket: file.s3Bucket,
    Key: file.s3Key,
    Body: grunt.file.read(file.path, { encoding: null })
  };

  s3.putObject(param, callback);

};
