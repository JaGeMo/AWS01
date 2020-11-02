#!/bin/bash

# get region and account
region=$(aws configure get default.region)
account=$(aws sts get-caller-identity --query Account --output text)
zip function.zip index.js

# check role
roleName=$(aws iam get-role --role-name LambdaAPIDynamoDBAccess | jq -r '.Role.Arn')

if [ $roleName != "null" ] &&  [ -n "$roleName" ]
then
    echo "role: $roleName"
else
    echo "exit prep"
    exit 1
fi
# check existence of function
functionName=$(aws lambda get-function --function-name LambdaFunctionOverHttps | jq -r '.Configuration.FunctionName')
if [ -z $functionName ]
then
    aws lambda create-function --function-name LambdaFunctionOverHttps --zip-file fileb://function.zip --handler index.handler --runtime nodejs12.x --role $roleName
else
    $true
fi
# test function
testRequestResult=$(aws lambda  invoke --function-name LambdaFunctionOverHttps --payload fileb://testrequestinput.txt outputfile.txt)
echo "initial test: $testRequestResult"
# check api existence
restAPINames=$(aws apigateway get-rest-apis)
orderedAPIs=$(echo $restAPINames | jq -r '.[]')
echo "existing apis: $orderedAPIs"
# check rest api's existence
a=0
for apiName in $(echo $orderedAPIs | jq -c '.[]'); do
    echo $(echo $apiName | jq -r '.id')
    echo $(echo $apiName | jq -r '.name')
    if [ $(echo $apiName | jq -r '.name') == 'DynamoDBOperations' ]
    then
        let "a += 1"
        restApiId=$(echo $apiName | jq -r '.id')
        echo 'api already exists ..'
        break
    fi
done
# create rest api if not existent
if [ $a == "0" ]
then
    restApiId=$(aws apigateway create-rest-api --name DynamoDBOperations | jq -r '.id')
    echo $restApiId
fi
# check resource (path, selection of methods)
checkApiResources=$(aws apigateway get-resources --rest-api-id $restApiId)
# echo "root resource: $checkApiResources"
parentResourcesId=$(echo ${checkApiResources} | jq -r '.items[0].id')
arrayLength=$(echo ${checkApiResources} | jq '.items | length')
# create sub resource (sub path)
echo "length: $arrayLength "
if [ $arrayLength -eq 1 ]
then
    # echo "in the length loop"
    resourceId=$(aws apigateway create-resource --rest-api-id $restApiId --path-part DynamoDBManager --parent-id $parentResourcesId | jq -r '.id')
else
    resourceId=$(echo ${checkApiResources} | jq -r '.items[1].id')
fi
echo "resourceId (DynamoDBManager): $resourceId"
# check existence of POST method
getExistingPOSTMethod=$(aws apigateway get-method --rest-api-id $restApiId --resource-id $resourceId --http-method POST | jq -r '.httpMethod')
echo "POST method exist y/n: $getExistingPOSTMethod"
# create POST method on resource if not existing
if [ -z $getExistingPOSTMethod ]
then
    createPOSTMethodId=$(aws apigateway put-method --rest-api-id $restApiId --resource-id $resourceId --http-method POST --authorization-type NONE)
fi 
# set lambda method as target of POST method (intgration) if POST method has been created 
if [ -z $createPOSTMethodId ]
then    
    assignPOSTMethodToLambda=$(aws apigateway put-integration --rest-api-id $restApiId --resource-id $resourceId --http-method POST --type AWS --integration-http-method POST \
    --uri arn:aws:apigateway:$region:lambda:path/2015-03-31/functions/arn:aws:lambda:$region:$account:function:LambdaFunctionOverHttps/invocations)
    echo $test
fi
# set API method response to json
aws apigateway put-method-response --rest-api-id $restApiId --resource-id $resourceId --http-method POST --status-code 200 --response-models application/json=Empty
# set integration method to json (lambda)
aws apigateway put-integration-response --rest-api-id $restApiId --resource-id $resourceId --http-method POST --status-code 200 --response-templates application/json=""
# deploy api to stage
aws apigateway create-deployment --rest-api-id $restApiId --stage-name prod
# check existence of policies
sids=$(aws lambda get-policy --function-name LambdaFunctionOverHttps | jq -r '.Policy' | jq -r '.Statement[].Sid')
for sid in $(echo $sids); do
    echo "sid: $sid"
    if [ $sid = "apigateway-test-1" ] || [ $sid = "apigateway-prod-1" ]
    then
        echo "sid in the condition: $sid"
        aws lambda remove-permission --function-name LambdaFunctionOverHttps --statement-id $sid
    fi
done  
# grant permission to apigateway to invoke lambda (required for test)
aws lambda add-permission --function-name LambdaFunctionOverHttps \
--statement-id apigateway-test-1 --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:$region:$account:$restApiId/*/POST/DynamoDBManager"
# grant permission to api to invoke lambda (required for actual function)
aws lambda add-permission --function-name LambdaFunctionOverHttps --statement-id apigateway-prod-1 --action lambda:InvokeFunction \
--principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:$region:$account:$restApiId/*/POST/DynamoDBManager"
# create table in dynamo db
tables=$(aws dynamodb list-tables| jq -r '.TableNames' | jq -r '.[]')
for table in $(echo $tables); do
    echo "table: $table"
    if [ $table = "lambda-apigateway" ]
    then
        echo "delete $table"
        aws dynamodb delete-table --table-name $table
    fi
done  
sleep 5
aws dynamodb create-table --table-name lambda-apigateway --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5



aws apigateway test-invoke-method --rest-api-id $restApiId --resource-id $resourceId --http-method POST --path-with-query-string "" --body file://create-item.json