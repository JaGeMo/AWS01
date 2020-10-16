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

s3 = new AWS.S3({apiVersion: '2006-03-01'});
// Create unique bucket name
var bucketName = uuid.v4();
// Create name for uploaded object key
var keyName = 'checkTest';

s3.createBucket({Bucket: bucketName}, (error, data) => {
  if (error) {
      console.log(error);
    } else {
      console.log("successfully created bucket");
      s3.listBuckets((error, data) => {
        if (error) {
          console.log("error", error);
        } else {
          console.log("successfully retrieved bucket data", data.Buckets);
          data.Buckets.forEach(element => {
            s3.deleteBucket({Bucket: element.Name}, (error, data) => {
              if(error) {
                console.log("nameE: " + element.Name)
                console.log("deleting bucket failed");
              }
              else {
                console.log("nameS: " + element.Name)
                console.log( "deleting bucket " + element.name + " successful");
                console.log(data);
              }
            })  
          });
          
        }
      });
    }
  }
)

// s3.deleteBucket({Bucket: bucketName}, function(err, data) {
//   if (err) {
//       console.log(err);
//     } else {
//       console.log("Successfully deleted bucket");
//     }
//   }
// );

// s3.listBuckets(function(error, data) {
//   if (error) {
//     console.log("Error", error);
//   } else {
//     console.log("Success", data.Buckets);
//   }
// });