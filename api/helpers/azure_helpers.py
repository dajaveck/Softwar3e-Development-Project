from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import AzureError
import json

AZURE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=fplstorage2025;AccountKey=6EWEimftlGG5o3ITMqao9JZrpVZWJAI3SUvy4elj/sBIDcILlpJ16lETp7Ydh1sEVo1WqnCkuKCc+ASt0D25iw==;EndpointSuffix=core.windows.net"
CONTAINER_NAME = "fpl-data"


def save_to_azure_blob(data, blob_name):
    try:
        blob_service_client = BlobServiceClient.from_connection_string(
            AZURE_CONNECTION_STRING
        )
        container_client = blob_service_client.get_container_client(CONTAINER_NAME)

        if not container_client.exists():
            container_client.create_container()

        blob_client = container_client.get_blob_client(blob_name)
        json_data = json.dumps(data)
        blob_client.upload_blob(json_data, overwrite=True)
        print(f"Data saved to {blob_name} successfully")
    except AzureError as e:
        print(f"Error saving data to {blob_name}: {e}")


def save_to_json(data, file_name):
    try:
        with open(file_name, "w") as json_file:
            json.dump(data, json_file)
        print(f"Data saved to {file_name} successfully")
    except Exception as e:
        print(f"Error saving data to {file_name}: {e}")


def fetch_from_azure_blob(blob_name):
    try:
        blob_service_client = BlobServiceClient.from_connection_string(
            AZURE_CONNECTION_STRING
        )
        container_client = blob_service_client.get_container_client(CONTAINER_NAME)

        if not container_client.exists():
            return None

        blob_client = container_client.get_blob_client(blob_name)
        data = blob_client.download_blob().readall()
        return json.loads(data)
    except AzureError as e:
        print(f"Error fetching data from {blob_name}: {e}")
        return None


def fetch_from_json(file_name):
    try:
        with open("data/" + file_name, "r") as json_file:
            data = json.load(json_file)
        return data
    except Exception as e:
        print(f"Error fetching data from {file_name}: {e}")
        return None
