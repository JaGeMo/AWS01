// load the SDK and UUID
var AWS = require('aws-sdk');
var uuid = require('uuid');
const { MultiSelect } = require("enquirer");

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// check creds
AWS.config.getCredentials(function(err) {
    if (err) console.log(err.stack);
    // crSedentials not loaded
    else {
      console.log("Access key:", AWS.config.credentials.accessKeyId);
    }
});

s3 = new AWS.S3({apiVersion: '2006-03-01'});
// create unique bucket name
var bucketName = uuid.v4();
// create name for uploaded object key

function createBucketAndListAllBuckets() {
  return new Promise((resolve,reject) => {
    s3.createBucket({Bucket: bucketName}, (err, data) => {
    if (err) {
      console.log("\n", err, "\n");
      reject(err);
    } 
    else {
      console.log("successfully created bucket"); 
      var loadBuckets = loadBucketList();
      loadBuckets
        .then((result) => {
          result.Buckets.forEach(bucket => {
            console.log("name: " + bucket.Name);
          });
          resolve();
        })
        .catch((err) => {
          console.err(`could not retrieve all: ${err}`);
        });
    }})
  })
}

const main = async () => {
  createBucketAndListAllBuckets()
    .then( async () => {
      const { Buckets } = await s3.listBuckets().promise();
      const choices = Buckets.map(({ Name }) => ({ name: Name, value: Name }));
      const prompt = new MultiSelect({
        name: "value",
        message: "Select the buckets you would like to delete",
        choices
      });

      const bucketsToDelete = await prompt.run();
      let deletedBuckets = 0;
      for (let bucket of bucketsToDelete) {
        await delay(200);
        const isDeleted = await deleteBucket(bucket);
        deletedBuckets += isDeleted ? 1 : 0;
      }
      console.log(
        `\nDeleted ${deletedBuckets}/${bucketsToDelete.length} buckets.\n`
      );
    })
}

main();

function loadBucketList() {
  return new Promise((resolve, reject) => {
    s3.listBuckets((err, data) => {
      if(err) {
        reject(new err("could not retrieve bucket list"))
      }
      else {
        resolve(data)
      }
    })
  })
}

const deleteBucket = async Bucket => {
  try {
    console.log(`deleting ${Bucket}`);
    // We can't delete a bucket before emptying its contents
    const { Contents } = await s3.listObjects({ Bucket }).promise();
    if (Contents.length > 0) {
      await s3
        .deleteObjects({
          Bucket,
          Delete: {
            Objects: Contents.map(({ Key }) => ({ Key }))
          }
        })
        .promise();
    }
    await s3.deleteBucket({ Bucket }).promise();
    return true;
  } catch (err) {
    console.log("\n", err, "\n");
    return false;
  }
};


function deleteSingleBucket(bucketName) {
  return new Promise((resolve, reject) => {
  s3.deleteBucket({Bucket: bucketName}, function(err, data) {
    if (err) {
        reject(new err("successfully deleted bucket"));
      } else {
        resolve(data);
      }
    }
  );
  })
}