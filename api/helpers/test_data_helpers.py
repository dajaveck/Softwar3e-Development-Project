import pandas as pd

from helpers.data_helpers import (
    get_current_gameweek,
    get_next_fixtures_for_player,
    get_targets,
)


def test_get_targets():
    expected_targets = [
        "goals_scored",
        "assists",
        "saves",
        "minutes_60+",
        "minutes_1+",
        "clean_sheets",
        "bonus",
    ]
    assert get_targets() == expected_targets


def test_get_current_gameweek():
    bootstrap_data = {
        "events": [
            {"id": 1, "is_current": False},
            {"id": 2, "is_current": True},
            {"id": 3, "is_current": False},
        ]
    }
    assert get_current_gameweek(bootstrap_data) == 2

    bootstrap_data_no_current = {
        "events": [
            {"id": 1, "is_current": False},
            {"id": 2, "is_current": False},
        ]
    }
    assert get_current_gameweek(bootstrap_data_no_current) is None
