// Load the SDK and UUID
var AWS = require('aws-sdk');
var uuid = require('uuid');

// Check creds
AWS.config.getCredentials(function(err) {
    if (err) console.log(err.stack);
    // crSedentials not loaded
    else {
      console.log("Access key:", AWS.config.credentials.accessKeyId);
    }
});

// Call S3 to list the buckets
s3 = new AWS.S3({apiVersion: '2006-03-01'});
s3.listBuckets(function(error, data) {
  if (error) {
    console.log("Error", error);
  } else {
    console.log("Success", data.Buckets);
  }
});

// Create unique bucket name
var bucketName = uuid.v4();
// Create name for uploaded object key
var keyName = 'checkTest';

// Create a promise on S3 service object
// new AWS.S3({apiVersion: '2006-03-01'}).createBucket({Bucket: bucketName}, {Key: keyName}, function(err, data) {
s3.createBucket({Bucket: bucketName}, function(err, data) {
  if (err) {
      console.log(err);
    } else {
      console.log("Successfully uploaded data to myBucket/myKey");
    }
  }
)

s3.listBuckets(function(error, data) {
  if (error) {
    console.log("Error", error);
  } else {
    console.log("Success", data.Buckets);
  }
});

s3.deleteBucket({Bucket: bucketName}, function(err, data) {
  if (err) {
      console.log(err);
    } else {
      console.log("Successfully uploaded data to myBucket/myKey");
    }
  }
);