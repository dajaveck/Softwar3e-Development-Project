import logging
import helpers.data_helpers as dh
import pandas as pd
import numpy as np


def generate_predictions_response(target: str, df: pd.DataFrame):
    elements = []

    # Replace NaN with None (JSON serializable)
    df_clean = df.replace({np.nan: None})

    for _, row in df_clean.iterrows():
        element_info = row.to_dict()
        elements.append(element_info)

    return {"current_target": target, "elements": elements}


def generate_starting_xi_response(df: dict):
    """
    Generate a structured response for the starting XI from the optimisation result.

    Args:
        target (str): The current target (could be e.g., 'GW34', 'Wildcard', etc.)
        optimisation_result (dict): Output of optimise_team function

    Returns:
        dict: Formatted response with starting XI
    """
    elements = []
    for _, row in df.iterrows():
        element_info = row.to_dict()
        elements.append(element_info)
    return {"elements": elements}


def generate_transfer_response(data):

    transfer_pairs = data["transfer_pairs"]

    return {
        "pairs": transfer_pairs,  # keep as-is to preserve nested dicts
        "gain": data["points_gain"],
        "cost": data["net_cost"],
    }


def generate_transsddser_response(
    transfer_pairs: list,
    gain,
    bootstrap_elements_df,
    fixtures_df,
    current_gameweek,
    current_gw_df: pd.DataFrame,
):
    targets = dh.get_targets()

    all_players_data = {}
    for _, player in current_gw_df.iterrows():
        player_id = player["element"]
        player_data = {
            "id": player_id,
            "name": bootstrap_elements_df[bootstrap_elements_df["id"] == player_id][
                "web_name"
            ].values[0],
            "position": int(
                bootstrap_elements_df[bootstrap_elements_df["id"] == player_id][
                    "element_type"
                ].values[0]
            ),
            "team": int(
                bootstrap_elements_df[bootstrap_elements_df["id"] == player_id][
                    "team"
                ].values[0]
            ),
            "fixtures": dh.get_next_fixtures_for_player(
                int(
                    bootstrap_elements_df[bootstrap_elements_df["id"] == player_id][
                        "team"
                    ].values[0]
                ),
                fixtures_df,
                current_gameweek,
            ),
            "metrics": {},
        }

        # Add all target metrics
        for target in targets:
            player_data["metrics"][f"{target}_points"] = player[
                f"predicted_target_{target}_points"
            ]

        all_players_data[player_id] = player_data

    # Then process the transfer pairs
    transfer_data = []
    for transfer in transfer_pairs:
        transfer_in_id = transfer["transferIn"]
        transfer_out_id = transfer["transferOut"]

        # Create transfer pair data using the pre-computed player data
        transfer_data.append(
            {
                "transferIn": all_players_data[transfer_in_id],
                "transferOut": all_players_data[transfer_out_id],
                "gain": transfer["gain"],
            }
        )

    # Convert all_players_data from dict to list
    all_players_list = list(all_players_data.values())

    return {"transfers": transfer_data, "all_players": all_players_list}


def generate_startifddfdng_xi_response(
    starting_xi: list,
    captain: int,
    vice_captain: int,
    bootstrap_data: dict,
    gameweek: int,
    current_gw_df: pd.DataFrame,
) -> dict:
    """
    Generates a response for the optimized starting XI
    Returns:
        {
            "gameweek": int,
            "starting_xi": [
                {
                    "id": int,
                    "name": str,
                    "position": int,
                    "team_id": int,
                    "predicted_points": float,
                    "fixtures": list,
                    "is_captain": bool,
                    "is_vice_captain": bool
                },
                ...
            ],
            "captain": {
                "id": int,
                "name": str,
                "predicted_points": float
            },
            "vice_captain": {
                "id": int,
                "name": str,
                "predicted_points": float
            }
        }
    """
    # Convert bootstrap data to DataFrame
    elements_df = pd.DataFrame(bootstrap_data["elements"])
    fixtures_df = pd.DataFrame(bootstrap_data["fixtures"])

    # Build starting XI response
    starting_xi_players = []
    for player_id in starting_xi:
        player_data = elements_df[elements_df["id"] == player_id].iloc[0]
        team_id = player_data["team"]

        # Get predicted points from current gameweek data
        predicted_points = current_gw_df[current_gw_df["element"] == player_id][
            "predicted_points"
        ].values[0]

        starting_xi_players.append(
            {
                "id": int(player_id),
                "name": player_data["web_name"],
                "position": int(player_data["element_type"]),
                "team_id": int(team_id),
                "predicted_points": round(float(predicted_points), 2),
                "fixtures": dh.get_next_fixtures_for_player(
                    team_id, fixtures_df, gameweek
                ),
                "is_captain": player_id == captain,
                "is_vice_captain": player_id == vice_captain,
            }
        )

    # Get captain/vice details
    captain_data = elements_df[elements_df["id"] == captain].iloc[0]
    vice_data = elements_df[elements_df["id"] == vice_captain].iloc[0]

    return {
        "gameweek": gameweek,
        "starting_xi": sorted(
            starting_xi_players, key=lambda x: (-x["predicted_points"], x["position"])
        ),
        "captain": {
            "id": int(captain),
            "name": captain_data["web_name"],
            "predicted_points": round(
                float(
                    current_gw_df[current_gw_df["element"] == captain][
                        "predicted_points"
                    ].values[0]
                ),
                2,
            ),
        },
        "vice_captain": {
            "id": int(vice_captain),
            "name": vice_data["web_name"],
            "predicted_points": round(
                float(
                    current_gw_df[current_gw_df["element"] == vice_captain][
                        "predicted_points"
                    ].values[0]
                ),
                2,
            ),
        },
    }
