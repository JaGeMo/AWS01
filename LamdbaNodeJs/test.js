// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

var bucketParams = {Bucket: "be6b29b9-1f73-4c22-b3f6-95c8a5971fc6"};
// call S3 to retrieve policy for selected bucket
s3.getBucketAcl(bucketParams, function(err, data) {
  if (err) {
    consosle.log("Error", err);
  } else if (data) {
    console.log(data.Grants[0].Grantee.ID);
  }
});
