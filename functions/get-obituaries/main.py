# add your get-obituaries function here
import boto3


def lambda_handler(event, context):
    dynamodb_resource = boto3.resource("dynamodb")
    data_table = dynamodb_resource.Table("thelastshow-30142184")

    response = data_table.scan()

    items = response["Items"]
    while 'LastEvaluatedKey' in response:
        response = data_table.scan(
            ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response['Items'])

    sorted_items = sorted(items, key=lambda x: x["creation"])

    return sorted_items
