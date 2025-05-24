import json
import logging

import helpers.azure_helpers as ah
import functions.feature_engineering as fe
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import functions.target_engineering as te
from typing import List, Dict, Any, Optional


def process_teams(teams_data: dict):
    df = pd.DataFrame(teams_data)

    return df.add_prefix("team_")


def process_elements(element_data: dict):
    keep_cols = [
        "id",
        "web_name",
        "element_type",
        "team",
    ]

    df = pd.DataFrame(element_data)[keep_cols]

    return df.add_prefix("element_")


def process_fixtures(fixtures_data: dict):
    df = pd.DataFrame(fixtures_data)
    df["kickoff_time"] = pd.to_datetime(df["kickoff_time"])

    return df.add_prefix("fixture_")


def process_element_gameweek(element_gameweek_data: dict, fixtures_df: pd.DataFrame):
    """Process per-gameweek player performance data"""
    df = pd.DataFrame(element_gameweek_data)

    # Convert to datetime
    df["kickoff_time"] = pd.to_datetime(df["kickoff_time"])

    numeric_cols = [
        "minutes",
        "goals_scored",
        "expected_goals",
        "assists",
        "value",
        "expected_assists",
        "saves",
        "clean_sheets",
        "bonus",
        "threat",
        "creativity",
        "influence",
        "ict_index",
        "total_points",
    ]
    df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric, errors="coerce")

    # turn boolean to int
    bool_cols = ["was_home"]
    df[bool_cols] = df[bool_cols].astype(int)

    # 1. Get actual event/gameweek numbers from fixtures
    fixture_event_map = fixtures_df.set_index("fixture_id")["fixture_event"].to_dict()
    df["actual_round"] = df["fixture"].map(fixture_event_map)

    # Handle DGWs (aggregate multiple entries per player-GW)
    agg_rules = {
        # basic
        "minutes": "sum",
        "opponent_team": "first",
        "value": "last",
        "was_home": "first",
        "threat": "first",
        "creativity": "first",
        "influence": "first",
        "ict_index": "first",
        # count fixtures to identify DGWs
        "fixture": "count",
        # goals
        "goals_scored": "sum",
        "expected_goals": "sum",
        # assists
        "assists": "sum",
        "expected_assists": "sum",
        # saves
        "saves": "sum",
        # clean sheets
        "clean_sheets": "sum",
        # bonus points
        "bonus": "sum",
        "total_points": "sum",
    }

    dgw_df = df.groupby(["element", "actual_round"]).agg(agg_rules).reset_index()
    dgw_df["is_double_gw"] = (dgw_df["fixture"] > 1).astype(int)

    # 3. Create complete GW grid (1-38) using ACTUAL rounds
    all_gws = pd.DataFrame(
        [
            (p, gw)
            for p in dgw_df["element"].unique()
            for gw in dgw_df["actual_round"].unique()
        ],
        columns=["element", "actual_round"],
    )

    merged = all_gws.merge(dgw_df, how="left", on=["element", "actual_round"])

    # 4. Fill blanks and mark BGWs
    merged["is_blank_gw"] = merged["minutes"].isna().astype(int)
    merged = merged.fillna(
        {
            # basic
            "value": merged.groupby("element")["value"].ffill(),
            "minutes": 0,
            # goals
            "goals_scored": 0,
            "expected_goals": 0,
            # assists
            "assists": 0,
            "expected_assists": 0,
            # saves
            "saves": 0,
            # clean sheets
            "clean_sheets": 0,
            # bonus points
            "bonus": 0,
        }
    )

    return merged.rename(columns={"actual_round": "round"})


def add_element_history(history_data: List[Dict[str, Any]]) -> pd.DataFrame:
    logging.info("Adding element history")
    df = pd.DataFrame(history_data)

    if "kickoff_time" in df.columns:
        df["kickoff_time"] = pd.to_datetime(df["kickoff_time"])

    float_cols = [
        "influence",
        "creativity",
        "threat",
        "ict_index",
        "expected_goals",
        "expected_assists",
        "expected_goal_involvements",
        "expected_goals_conceded",
    ]

    for col in float_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    with open("column_names_element_history.txt", "w") as file:
        for column in df.columns:
            file.write(column + "\n")
            # logging.info(column)

    return df


def add_player_static_info(
    df: pd.DataFrame, elements: List[Dict[str, Any]]
) -> pd.DataFrame:
    logging.info("Adding player static info")
    # Convert elements to a DataFrame
    elements_df = pd.DataFrame(elements)

    elements_df["team_join_date"] = pd.to_datetime(elements_df["team_join_date"])
    elements_df["birth_date"] = pd.to_datetime(elements_df["birth_date"])

    # Rename 'id' to 'element' for merging
    elements_df = elements_df.rename(columns={"id": "element"})

    keep_cols = [
        "element",
        "element_type",
        "first_name",
        "second_name",
        "web_name",
        "team",
        "region",
        "team_join_date",
        "birth_date",
        "photo",
    ]

    elements_df = elements_df[keep_cols]

    # Merge on element (player ID)
    merged_df = df.merge(elements_df, on="element", how="left")

    with open("column_names_static.txt", "w") as file:
        for column in merged_df.columns:
            file.write(column + "\n")
            # logging.info(column)

    return merged_df


def add_missing_player_data(df: pd.DataFrame) -> pd.DataFrame:
    # Columns that should be preserved from player metadata
    static_cols = [
        "element",
        "element_type",
        "first_name",
        "second_name",
        "web_name",
        "team",
        "region",
        "team_join_date",
        "birth_date",
    ]

    # Columns that should be zeroed out for missing fixtures
    zero_cols = [
        "total_points",
        "minutes",
        "goals_scored",
        "assists",
        "clean_sheets",
        "goals_conceded",
        "own_goals",
        "penalties_saved",
        "penalties_missed",
        "yellow_cards",
        "red_cards",
        "saves",
        "bonus",
        "bps",
        "influence",
        "creativity",
        "threat",
        "ict_index",
        "starts",
        "expected_goals",
        "expected_assists",
        "expected_goal_involvements",
        "expected_goals_conceded",
        "mng_win",
        "mng_draw",
        "mng_loss",
        "mng_underdog_win",
        "mng_underdog_draw",
        "mng_clean_sheets",
        "mng_goals_scored",
        "transfers_balance",
        "selected",
        "transfers_in",
        "transfers_out",
    ]

    # Columns that should be filled from fixture data
    fixture_cols = [
        "fixture",
        "opponent_team",
        "was_home",
        "kickoff_time",
        "team_h_score",
        "team_a_score",
        "round",
    ]

    # Get all unique teams
    teams = df["team"].unique()

    logging.info(teams)

    new_rows = []

    for team in teams:
        # Get all players in this team
        team_players = df[df["team"] == team]["element"].unique()

        # Get all fixtures for this team
        team_fixtures = df[df["team"] == team]["fixture"].unique()

        for player in team_players:
            player_data = df[df["element"] == player]
            existing_fixtures = player_data["fixture"].unique()

            missing_fixtures = set(team_fixtures) - set(existing_fixtures)

            if not missing_fixtures:
                continue

            player_meta = player_data.iloc[0][static_cols].to_dict()

            for fixture in missing_fixtures:
                # Get fixture data (take first row for this fixture)
                fixture_data = (
                    df[(df["team"] == team) & (df["fixture"] == fixture)]
                    .iloc[0][fixture_cols]
                    .to_dict()
                )

                # Create new row
                new_row = {**player_meta, **fixture_data}

                # Add zero values
                for col in zero_cols:
                    new_row[col] = 0

                # Set some specific fields
                new_row["modified"] = True  # Mark as artificially added
                new_row["was_home"] = fixture_data["was_home"]

                new_rows.append(new_row)

    # Create DataFrame from new rows and concatenate with original
    if new_rows:
        new_df = pd.DataFrame(new_rows)
        df = pd.concat([df, new_df], ignore_index=True)

    return df


def add_fixtures(df: pd.DataFrame, fixtures: List[Dict[str, Any]]) -> pd.DataFrame:
    logging.info("adding fixtures")
    fixtures_df = pd.DataFrame(fixtures)

    # Filter for only finished games
    fixtures_df = fixtures_df[fixtures_df["finished"] == True]

    fixtures_df = fixtures_df.rename(columns={"id": "fixture"})

    keep_columns = [
        "fixture",
        "code",
        "event",
        "team_h",
        "team_a",
    ]

    fixtures_df = fixtures_df[keep_columns]

    merged_df = df.merge(fixtures_df, on="fixture", how="left")

    with open("column_names_fixtures.txt", "w") as file:
        for column in merged_df.columns:
            file.write(column + "\n")
            # logging.info(column)

    return merged_df


def add_rolling_averages(
    df: pd.DataFrame,
    metrics: List[str],
    windows: List[int] = [3, 5],  # Add a list of windows for last 3 and last 5 games
):
    """
    Calculate rolling averages for given metrics per player, excluding the current match.

    Parameters:
    - df: DataFrame with player match data (must include 'element' and 'round')
    - metrics: list of column names to compute rolling averages for
    - windows: list of window sizes (e.g., [3, 5] for last 3 and last 5 games)

    Returns:
    - DataFrame with added rolling average columns (e.g., 'goals_scored_rolling_3', 'goals_scored_rolling_5')
    """
    df = df.sort_values(by=["element", "round"])

    # Ensure the metrics are float for rolling mean calculation
    df[metrics] = df[metrics].astype(float)

    # Loop over the different window sizes (3 and 5 games)
    for window in windows:
        for metric in metrics:
            rolling_col = (
                f"{metric}_rolling_{window}"  # Add window size to the column name
            )
            # Apply rolling average within each group (player) and shift
            df[rolling_col] = (
                df.groupby("element")[metric]
                .apply(
                    lambda x: x.shift(1).rolling(window=window, min_periods=1).mean()
                )
                .reset_index(level=0, drop=True)  # Reset index at group level
            )

    return df


def add_season_totals(df: pd.DataFrame, metrics: List[str]):
    """
    Calculate season totals (cumulative sum) for given metrics per player.

    Parameters:
    - df: DataFrame with player match data (must include 'element' and 'round')
    - metrics: list of column names to compute season totals for

    Returns:
    - DataFrame with added season total columns (e.g., 'goals_scored_season_total')
    """
    df = df.sort_values(by=["element", "round"])

    # Ensure the metrics are float for cumulative sum calculation
    df[metrics] = df[metrics].astype(float)

    for metric in metrics:
        season_total_col = f"{metric}_season_total"

        # Calculate cumulative sum (season total) for each player ('element')
        df[season_total_col] = df.groupby("element")[metric].cumsum()

    return df


def create_dataset(fixtures, targets):
    # Agreegate team stats accross the whole season and add them in
    # regressor__min_samples_leaf: 7
    # [2025-04-26T01:29:55.408Z] regressor__max_depth: 6
    # [2025-04-26T01:29:55.408Z] regressor__learning_rate: 0.03930163420191516
    # [2025-04-26T01:29:55.409Z] regressor__n_estimators: 57
    # [2025-04-26T01:29:55.408Z] regressor__min_samples_split: 13

    # ] Time Series MSE: 0.0357
    # [2025-04-26T01:29:55.431Z] Time Series rmse: 0.2570
    # [2025-04-26T01:29:55.431Z] Time Series r2: 0.0490
    bootstrap = ah.fetch_from_json("bootstrap_data.json")
    teams = bootstrap["teams"]
    elements = bootstrap["elements"]
    element_history = ah.fetch_from_json("element_gameweek_data.json")

    # Start the dataFrame with the Element History
    df = add_element_history(element_history)

    # Add Player static info the DataFrame
    df = add_player_static_info(df, elements)

    df = add_missing_player_data(df)

    df = add_fixtures(df, fixtures)

    df = add_rolling_averages(df, metrics=targets)

    df = add_season_totals(df, metrics=targets)

    df.fillna(0, inplace=True)

    df = df.sort_values(by=["kickoff_time", "fixture"], ascending=[True, True])

    df_element_328 = df[df["element"] == 328]

    # Select and print the head of relevant columns

    info = df_element_328[
        [
            "round",
            "minutes",
            "minutes_season_total",
            "minutes_rolling_3",
            "goals_scored",
            "goals_scored_rolling_3",
        ]
    ]

    info_dict = info.to_dict(orient="records")

    # Save the information to a JSON file
    with open("element_328_info.json", "w") as json_file:
        json.dump(info_dict, json_file, indent=2)

    with open("column_names.txt", "w") as file:
        for column in df.columns:
            file.write(column + "\n")
            # logging.info(column)

    df.to_json("data/merged_players_with_fixtures.json", orient="records", indent=2)
    return df
