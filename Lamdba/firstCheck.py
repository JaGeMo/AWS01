import logging
import boto3
from botocore.exceptions import ClientError
region='eu-central-1'

# sqs = boto3.resource('sqs')
# queue = sqs.create_queue(QueueName='test', Attributes={'DelaySeconds': '5'})

s3 = boto3.resource('s3')
for bucket in s3.buckets.all():
    print(bucket.name)

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
s3.Bucket('gjmtest-serverless').put_object(Key='test.jpg', Body=data)