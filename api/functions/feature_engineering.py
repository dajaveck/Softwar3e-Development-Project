import logging
import numpy as np
import pandas as pd


def create_features(
    element_gw_df: pd.DataFrame,
    teams_df: pd.DataFrame,
    fixtures_df: pd.DataFrame,
    players_df: pd.DataFrame,
    horizon: int,
):
    """Create final feature set"""
    # Merge core data

    merged = element_gw_df.merge(
        players_df, left_on="element", right_on="element_id", how="left"
    ).merge(teams_df, left_on="element_team", right_on="team_id", how="left")

    # Add rolling features
    merged = merged.sort_values(["element", "round"])

    cumulative_features = {
        # basic
        # goals
        "cumulative_goals": "goals_scored",
        "cumulative_xG": "expected_goals",
        # assists
        "cumulative_assists": "assists",
        "cumulative_xA": "expected_assists",
        # saves
        "cumulative_saves": "saves",
        # minutes
        "cumulative_minutes": "minutes",
        # clean sheets
        "cumulative_clean_sheets": "clean_sheets",
        # bonus
        "cumulative_bonus": "bonus",
    }

    for new_col, source_col in cumulative_features.items():
        merged[new_col] = merged.groupby("element")[source_col].cumsum()

    # get number of goals by teammates in the last 3 and 5 gameweeks
    merged["team_goals_per_gw"] = merged.groupby(["element_team", "round"])[
        "goals_scored"
    ].transform("sum")

    # Step 2: Subtract player's own goals to get teammate goals
    merged["teammate_goals"] = merged["team_goals_per_gw"] - merged["goals_scored"]

    merged["team_assists_per_gw"] = merged.groupby(["element_team", "round"])[
        "assists"
    ].transform("sum")
    merged["teammate_assists"] = merged["team_assists_per_gw"] - merged["assists"]

    merged["team_expected_assists_per_gw"] = merged.groupby(["element_team", "round"])[
        "expected_assists"
    ].transform("sum")
    merged["teammate_expected_assists"] = (
        merged["team_assists_per_gw"] - merged["expected_assists"]
    )

    merged["team_expected_goals_per_gw"] = merged.groupby(["element_team", "round"])[
        "expected_goals"
    ].transform("sum")
    merged["teammate_expected_goals"] = (
        merged["team_expected_goals_per_gw"] - merged["expected_goals"]
    )

    for col in [
        "goals_scored",
        "expected_goals",
        "assists",
        "expected_assists",
        "saves",
        "minutes",
        "clean_sheets",
        "bonus",
        "teammate_goals",
        "teammate_assists",
        "teammate_expected_assists",
        "teammate_expected_goals",
        "threat",
        "creativity",
        "influence",
        "ict_index",
    ]:
        merged[f"rolling_3gw_{col}"] = merged.groupby("element")[col].transform(
            lambda x: x.rolling(3, min_periods=1).mean()
        )
        merged[f"rolling_5gw_{col}"] = merged.groupby("element")[col].transform(
            lambda x: x.rolling(5, min_periods=1).mean()
        )

    # next+{horizon}_average_goals_conceded

    # add features based on

    def get_fixture_difficulty(row, fixtures_df, window=3):
        """Get average difficulty for next N fixtures for this team"""
        team_id = row["element_team"]
        current_gw = row["round"]

        # Get future fixtures for this team
        future_fixtures = fixtures_df[
            (fixtures_df["fixture_event"] >= current_gw)
            & (
                (fixtures_df["fixture_team_h"] == team_id)
                | (fixtures_df["fixture_team_a"] == team_id)
            )
        ]

        # Get next N fixtures and calculate difficulty
        difficulties = []
        for _, fixture in future_fixtures.head(window).iterrows():
            if fixture["fixture_team_h"] == team_id:
                difficulties.append(fixture["fixture_team_h_difficulty"])
            else:
                difficulties.append(fixture["fixture_team_a_difficulty"])

        return (
            np.mean(difficulties) if difficulties else 3.0
        )  # Default to medium difficulty

    merged[f"next_{horizon}_difficulty"] = merged.apply(
        lambda row: get_fixture_difficulty(row, fixtures_df), axis=1
    )

    # Add team strength features

    merged["team_attack_strength"] = np.where(
        merged["was_home"],
        merged["team_strength_attack_home"],
        merged["team_strength_attack_away"],
    )

    merged["team_defence_strength"] = np.where(
        merged["was_home"],
        merged["team_strength_defence_home"],
        merged["team_strength_defence_away"],
    )

    # Add injury features
    # merged["injury_flag"] = (merged["element_status"] != "a").astype(int)

    return merged
