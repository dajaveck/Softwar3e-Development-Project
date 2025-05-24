import json
import logging
from typing import List
import pandas as pd


def get_targets():

    return [
        "goals_scored",
        "assists",
        "saves",
        "minutes_60+",
        "minutes_1+",
        "clean_sheets",
        "bonus",
    ]


def get_current_gameweek(bootstrap_data):
    current_gameweek = None
    for event in bootstrap_data["events"]:
        if event["is_current"]:
            current_gameweek = event["id"]
            break
    return current_gameweek


def get_next_fixtures_for_player(
    playerID: int, fixturesData: pd.DataFrame, currentGameweek: int
) -> list:
    """
    Get the next fixtures for a given player based on the current gameweek.
    Args:
        playerID: The ID of the player.
        fixturesData: DataFrame containing fixture data.
        currentGameweek: The current gameweek.
    Returns:
        List of next fixtures for the player.
    """

    # Get the team ID of the player
    teamID = playerID

    # Get the next fixtures for the player's team
    nextFixtures = fixturesData[
        ((fixturesData["team_a"] == teamID) | (fixturesData["team_h"] == teamID))
        & (fixturesData["event"] > currentGameweek)
    ][["team_h", "team_a"]].values.tolist()

    return nextFixtures


def add_rolling_averages(
    df: pd.DataFrame,
    next_round_df: pd.DataFrame,
    metrics: List[str],
    windows: List[int] = [3, 5],
) -> pd.DataFrame:
    """
    Calculate fresh rolling averages for next round based on most recent games from df.

    Parameters:
    - df: Complete historical DataFrame with all rounds
    - next_round_df: Template DataFrame for next round
    - metrics: List of metrics to calculate rolling averages for
    - windows: List of window sizes (e.g., [3,5] for last 3 and 5 games)

    Returns:
    - next_round_df with rolling averages added
    """
    # Sort the historical data by player and round
    df = df.sort_values(["element", "round"])

    # For each player in next_round_df
    for _, row in next_round_df.iterrows():
        player_id = row["element"]

        # Get this player's historical data
        player_history = df[df["element"] == player_id]

        # For each window size
        for window in windows:
            # Get the last 'window' games (excluding current round if needed)
            recent_games = player_history.iloc[-window:]

            # For each metric
            for metric in metrics:
                col_name = f"{metric}_rolling_{window}"
                # Calculate average and assign to next_round_df
                next_round_df.loc[next_round_df["element"] == player_id, col_name] = (
                    recent_games[metric].mean()
                )

    return next_round_df


def add_season_totals(
    df: pd.DataFrame, next_round_df: pd.DataFrame, metrics: List[str]
):
    """
    Calculate FINAL season totals for given metrics per player and add to next_round_df.

    Parameters:
    - df: Historical DataFrame with player match data
    - next_round_df: Next round DataFrame to receive season totals
    - metrics: list of column names to compute season totals for

    Returns:
    - Updated next_round_df with season total columns
    """
    for metric in metrics:
        next_round_df[f"{metric}_season_total"] = next_round_df["element"].map(
            df.groupby("element")[metric].sum()
        )
    return next_round_df


def create_next_round_df(
    df: pd.DataFrame,
    fixtures_df: pd.DataFrame,
    categorical_features: list,
    numerical_features: list,
    engineering_features: list,
    round,
) -> pd.DataFrame:
    """
    Create a DataFrame for the next round of fixtures with null or zero values for all statistics,
    and use upcoming fixtures (from fixtures_df) to populate opponent and home/away status.

    Parameters:
    - df: The original DataFrame containing player match data
    - categorical_features: List of categorical features like element, team, was_home, element_type
    - numerical_features: List of numerical features like goals_scored_rolling_3, assists_rolling_5, etc.
    - fixtures_df: DataFrame of upcoming fixture data for the next round

    Returns:
    - DataFrame with the same elements for the next round, with null or zero values for statistics,
      and populated opponent_team and was_home based on upcoming fixtures.
    """

    logging.info(f"All event values: {fixtures_df['event'].unique().tolist()}")
    logging.info(f"Event column type: {fixtures_df['event'].dtype}")

    # Get the last round from the current DataFrame
    # Get the last round from the current DataFrame
    last_round = df["round"].max()

    logging.info(
        "LAST ROUNUD ###########################################################################"
    )

    # Determine the next round
    next_round = last_round + 1

    # Create a list to store new rows for the next round
    new_rows = []

    # Iterate over each element (player) in the current dataset
    for player in df["element"].unique():
        # Get the player's data for the next round
        player_data = df[df["element"] == player].iloc[
            0
        ]  # Take the first row for the player
        player_team = player_data["team"]

        # Get all upcoming fixtures for this team in the next round
        team_fixtures = fixtures_df[
            (fixtures_df["event"] == next_round)
            & (
                (fixtures_df["team_h"] == player_team)
                | (fixtures_df["team_a"] == player_team)
            )
        ]

        # Skip players whose team has no fixtures in this round (blank GW)
        if team_fixtures.empty:
            continue

        # For each fixture this team has in the next round (handles single and double GWs)
        for _, fixture in team_fixtures.iterrows():
            # Prepare the row for the next round with the necessary columns
            new_row = {
                col: None for col in categorical_features
            }  # Set categorical features to None
            new_row.update(
                {col: 0 for col in numerical_features}
            )  # Set numerical features to 0

            # Add player-specific information (element, team, etc.)
            new_row["element"] = player_data["element"]
            new_row["team"] = player_team
            new_row["element_type"] = player_data["element_type"]
            new_row["web_name"] = player_data["web_name"]
            new_row["photo"] = player_data["photo"]
            new_row["value"] = player_data["value"]

            # Set the round value for the next round
            new_row["round"] = next_round

            # Set opponent and home/away status
            new_row["opponent_team"] = (
                fixture["team_a"]
                if fixture["team_h"] == player_team
                else fixture["team_h"]
            )
            new_row["was_home"] = fixture["team_h"] == player_team

            # Add any engineering features (set to 0 or appropriate default)
            for feat in engineering_features:
                new_row[feat] = 0

            # Add this new row to the list
            new_rows.append(new_row)

    # Create a DataFrame from the new rows
    next_round_df = pd.DataFrame(new_rows)

    next_round_df = add_rolling_averages(
        df=df,
        next_round_df=next_round_df,
        metrics=engineering_features,  # Your metrics
        windows=[3, 5],  # Your window sizes
    )
    next_round_df = add_season_totals(
        df=df, next_round_df=next_round_df, metrics=engineering_features
    )

    info_dict = next_round_df.to_dict(orient="records")

    # Save the information to a JSON file
    with open("next_round_df.json", "w") as json_file:
        json.dump(info_dict, json_file, indent=2)
    return next_round_df
