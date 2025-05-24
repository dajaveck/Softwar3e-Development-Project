import time
import requests


def send_request(url: str) -> dict:
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"HTTP error occurred: {e}")
        return None


def fetch_bootstrap_data() -> dict:
    url = "https://fantasy.premierleague.com/api/bootstrap-static/"
    print(f"Fetching data from {url}")

    data = send_request(url)
    return data


def fetch_managers_team(manager_id: int, gameweek_id: str) -> dict:
    url = f"https://fantasy.premierleague.com/api/entry/{manager_id}/event/{gameweek_id}/picks/"
    print(f"Fetching data from {url}")

    data = send_request(url)
    return data


def fetch_managers_transfers(manager_id: int) -> dict:
    url = f"https://fantasy.premierleague.com/api/entry/{manager_id}/transfers/"
    print(f"Fetching data from {url}")

    data = send_request(url)
    return data


def fetch_fixtures_data() -> dict:
    url = "https://fantasy.premierleague.com/api/fixtures/"
    print(f"Fetching data from {url}")

    data = send_request(url)
    return data


def fetch_element_summary(element_id: int) -> dict:
    url = f"https://fantasy.premierleague.com/api/element-summary/{element_id}/"
    print(f"Fetching data from {url}")

    data = send_request(url)
    return data


def fetch_element_gameweek_data(bootstrap_data: dict) -> dict:
    elements = bootstrap_data["elements"]
    all_element_data = []

    for element in elements:

        element_id = element["id"]
        element_data = fetch_element_summary(element_id)
        all_element_data += element_data["history"]
        time.sleep(0.5)

    return all_element_data
