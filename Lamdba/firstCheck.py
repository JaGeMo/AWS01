import logging
import boto3
from botocore.exceptions import ClientError
region='eu-central-1'

# sqs = boto3.resource('sqs')
# queue = sqs.create_queue(QueueName='test', Attributes={'DelaySeconds': '5'})

s3_client = boto3.client('s3')
buckets = s3_client.list_buckets()
for bucket in buckets ['Buckets']:
    print(bucket['CreationDate'].ctime(), bucket['Name'])

try:
    if region is None:
        s3_client = boto3.client('s3')
        s3_client.create_bucket(Bucket='gjmtest_serverless')
    else:
        s3_client = boto3.client('s3', region_name=region)
        location = {'LocationConstraint': region}
        s3_client.create_bucket(Bucket='gjmtest-serverless',CreateBucketConfiguration=location)
except ClientError as e:
    logging.error(e)

data = open('test.jpg', 'rb')
with open("test.jpg", "rb") as f:
    s3_client.upload_fileobj(f, "gjmtest-serverless", "testupload")