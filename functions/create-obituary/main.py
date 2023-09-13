# add your create-obituary function here
from requests_toolbelt.multipart import decoder
import requests
import boto3
import base64
import os
import time
import hashlib
import json
import uuid
from datetime import datetime


dynamodb_resource = boto3.resource("dynamodb")
data_table = dynamodb_resource.Table("thelastshow-30142184")

client = boto3.client('ssm')
value = client.get_parameters_by_path(
    Path='/the-last-show/',
    Recursive=True,
    WithDecryption=True,
)

response = {key["Name"]: key["Value"] for key in value["Parameters"]}
api_key = response.get('/the-last-show/cloudinaryapikey', None)
api_secret = response.get('/the-last-show/cloudinarysecret', None)
gpt_api = response.get('/the-last-show/gptkey', None)
cloud_Name = response.get('/the-last-show/cloudname', None)


def lambda_handler(event, context):
    body = event["body"]
    if event["isBase64Encoded"]:
        body = base64.b64decode(body)

    content_type = event["headers"]["content-type"]
    data = decoder.MultipartDecoder(body, content_type)

    binary_data = [part.content for part in data.parts]
    name = binary_data[1].decode()
    born = binary_data[2].decode()
    died = binary_data[3].decode()

    key = "obituary.png"
    file_name = os.path.join("/tmp", key)
    with open(file_name, "wb") as f:
        f.write(binary_data[0])

    s3_client = boto3.client("s3")
    _ = s3_client.upload_file(file_name, "thelastshow-st", key)

    res = upload("/tmp/obituary.png", extra_fields={
                 "eager": "e_art:zorro,e_grayscale"})

    ser = chatgbt(name, born, died)
    audio(ser)

    tes = upload("/tmp/polly.mp3", resource_type="raw")

    obituary_to_add = {
        "Name": name,
        "uuid": str(uuid.uuid1()),
        "birth": born,
        "death": died,
        "image": res["eager"][0]["secure_url"],
        "memoir": ser,
        "audio": tes["secure_url"],
        "creation": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    try:
        test = data_table.put_item(Item=obituary_to_add)
        print(test['ResponseMetadata'])
        return {
            "statusCode": 201,
            "body": obituary_to_add
        }
    except Exception as exp:
        return {
            "statusCode": 500,
            "body": json.dumps(
                {
                    "message": str(exp)
                }
            )
        }


def upload(filename, resource_type="image", extra_fields={}):

    body = {
        "api_key": api_key,

    }

    files = {
        "file": open(filename, 'rb')
    }
    timestamp = int(time.time())
    body["timestamp"] = timestamp
    body.update(extra_fields)
    body["signature"] = create_signature(body, api_secret)
    url = f"http://api.cloudinary.com/v1_1/{cloud_Name}/{resource_type}/upload"
    res = requests.post(url, files=files, data=body)
    return res.json()


def create_signature(body, api_secret):
    exclued = ["api_key", "resource_type", "cloud_name"]
    timestamp = int(time.time())
    body["timestamp"] = timestamp
    sorted_body = sort(body, exclued)
    q_s = query_string(sorted_body)
    q_s_append = f"{q_s}{api_secret}"
    hashed = hashlib.sha1(q_s_append.encode())
    signature = hashed.hexdigest()
    return signature


def sort(dic, exclude):
    return {k: v for k, v in sorted(dic.items(), key=lambda item: item[0]) if k not in exclude}


def query_string(body):
    q_s = ""
    for idx, (k, v) in enumerate(body.items()):
        q_s = f"{k}={v}" if idx == 0 else f"{q_s}&{k}={v}"
    return q_s


def chatgbt(name, born_year, died_year):
    url = "https://api.openai.com/v1/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {gpt_api}"
    }

    body = {

        "model": "text-davinci-003",
        "prompt": f"write an obituary about a fictional character named {name} who was born on {born_year} and died on {died_year}",
        "max_tokens": 100,
        "temperature": 0.1
    }

    res = requests.post(url, headers=headers, json=body)
    return res.json()["choices"][0]["text"]


def audio(text):
    client = boto3.client('polly')
    response = client.synthesize_speech(
        Engine='standard',
        LanguageCode='en-US',
        OutputFormat='mp3',

        Text=text,
        TextType='text',
        VoiceId='Joanna'
    )

    key = "polly.mp3"

    file_name = os.path.join("/tmp", key)
    with open(file_name, "wb") as f:
        f.write(response["AudioStream"].read())

    s3_client = boto3.client("s3")
    _ = s3_client.upload_file(file_name, "thelastshow-st", key)
