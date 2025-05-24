import json
import logging

import azure.functions as func
import numpy as np
import helpers.azure_helpers as ah
import helpers.data_helpers as dh
import functions.data_ingestion as di
import functions.data_processing as dp
import functions.model_operations as mo
import pandas as pd
import helpers.response_helper as rh

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)


@app.route("injest_data")
def injest_data(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Python HTTP trigger function processed a request.")

    print("Fetching bootstrap data")
    bootstrap_data = di.fetch_bootstrap_data()
    ah.save_to_json(bootstrap_data, "data/bootstrap_data.json")

    print("Fetching fixtures data")
    fixtures_data = di.fetch_fixtures_data()
    ah.save_to_json(fixtures_data, "data/fixtures_data.json")

    print("Fetching element gameweek data")
    element_gameweek_data = di.fetch_element_gameweek_data(bootstrap_data)
    ah.save_to_json(element_gameweek_data, "data/element_gameweek_data.json")

    fixtures = di.fetch_fixtures_data()

    df = dp.create_dataset(fixtures, targets)

    return func.HttpResponse("Data injested successfully")


# 12
targets = [
    "minutes",
    "goals_scored",
    "assists",
    "clean_sheets",
    "saves",
    "penalties_saved",
    "penalties_missed",
    "bonus",
    "goals_conceded",
    "yellow_cards",
    "red_cards",
    "own_goals",
]

# 6
combined_targets = [
    "minutes",
    "clean_sheets",
    "bonus",
    "yellow_cards",
    "red_cards",
    "own_goals" "assists",
]

outfield_targets = ["goals_scored", "assists", "penalties_missed"]

goalkeeper_targets = [
    "saves",
    "penalties_saved",
]


categorical_features = ["element", "team", "was_home", "element_type"]

# Special features that aren't just simple rollings/totals of targets
base_features = ["selected"]

extra_featuires = ["expected_goals", "expected_assists", "starts"]

engineering_features = targets

# Automatically create rolling and season total features
numerical_features = base_features.copy()

for stat in engineering_features:
    numerical_features.extend(
        [
            f"{stat}_rolling_3",
            f"{stat}_rolling_5",
            f"{stat}_season_total",
        ]
    )

features = categorical_features + numerical_features


def calculate_minutes_points(row):
    if row["minutes"] == 0:
        return 0
    elif row["minutes"] < 60:
        return row["minutes"] / 60
    else:
        return 2


def calculate_points(df: pd.DataFrame, target: str) -> pd.Series:
    goals_scored_multipliers = {1: 10, 2: 6, 3: 5, 4: 4}
    clean_sheets_multipliers = {1: 4, 2: 4, 3: 1, 4: 0}

    if target == "minutes":
        return df.apply(calculate_minutes_points, axis=1)

    elif target == "goals_scored":
        return df.apply(
            lambda row: row["goals_scored"]
            * goals_scored_multipliers.get(row["element_type"], 0),
            axis=1,
        )

    elif target == "assists":
        return df["assists"] * 3

    elif target == "clean_sheets":
        return df.apply(
            lambda row: row["clean_sheets"]
            * clean_sheets_multipliers.get(row["element_type"], 0),
            axis=1,
        )

    elif target == "saves":
        return df["saves"] * (1 / 3)

    elif target == "penalties_saved":
        return df["penalties_saved"] * 5

    elif target == "penalties_missed":
        return df["penalties_missed"] * -2

    elif target == "bonus":
        return df["bonus"]

    elif target == "goals_conceded":
        return df["goals_conceded"] * -0.5

    elif target == "yellow_cards":
        return df["yellow_cards"] * -1

    elif target == "red_cards":
        return df["red_cards"] * -3

    elif target == "own_goals":
        return df["own_goals"] * -2

    else:
        raise ValueError(f"Unknown target '{target}' provided to calculate_points")


def save_prediction_distribution(predictions: np.ndarray, target: str):
    """Save the distribution of rounded predictions to a JSON file."""
    rounded_predictions = np.round(predictions, 1)
    counts = pd.Series(rounded_predictions).value_counts().sort_index()
    counts_dict = counts.to_dict()

    filename = f"{target}_distribution.json"
    with open(filename, "w") as f:
        json.dump(counts_dict, f, indent=2)

    logging.info(f"Saved prediction distribution for '{target}' to {filename}")


@app.route("make_predictions")
def make_predictions(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Received request to make predictions")

    model_type = req.params.get("model")
    horizon = int(req.params.get("horizon", 1))
    bootstrap_data = di.fetch_bootstrap_data()
    gameweek = dh.get_current_gameweek(bootstrap_data)
    # Default to 1 if not provided

    if not model_type:
        return func.HttpResponse("Missing 'model' parameter", status_code=400)

    try:
        fixtures = di.fetch_fixtures_data()
        df = pd.DataFrame(ah.fetch_from_json("merged_players_with_fixtures.json"))

        current_round = df["round"].max()
        max_round = 38  # Maximum round in a season

        # Cap horizon to avoid going past the end of the season
        horizon = min(horizon, max_round - current_round)

        if horizon <= 0:
            return func.HttpResponse("Season is already complete", status_code=400)

        future_fixtures_df = pd.DataFrame(
            [f for f in fixtures if not f.get("finished", False)]
        )

        all_predictions = []
        prediction_rounds = []

        # Create a copy of the original dataframe to add predictions to
        cumulative_df = df.copy()

        # For each round in the horizon
        for round_offset in range(1, horizon + 1):
            target_round = current_round + round_offset
            logging.info(f"Predicting round {target_round} ({round_offset}/{horizon})")

            # Get fixtures for this specific round
            round_fixtures = future_fixtures_df[
                future_fixtures_df["event"] == target_round
            ]

            if round_fixtures.empty:
                logging.warning(f"No fixtures found for round {target_round}")
                continue

            # Create next round dataframe on first target
            next_round_df = dh.create_next_round_df(
                cumulative_df,
                round_fixtures,
                categorical_features,
                numerical_features,
                engineering_features,
                target_round - 1,  # Current round we're building from
            )

            if next_round_df.empty:
                logging.warning(
                    f"Next round DataFrame for round {target_round} is empty. No predictions made."
                )
                continue

            # Process each target
            for target in targets:
                model = mo.train_model(
                    model_type,
                    cumulative_df,
                    categorical_features,
                    numerical_features,
                    target,
                )
                predictions = model.predict(next_round_df)

                # Clamp predictions at 0
                next_round_df[target] = np.maximum(predictions, 0)
                next_round_df[f"{target}_points"] = calculate_points(
                    next_round_df, target
                )

                # Save prediction distribution for analysis
                # save_prediction_distribution(predictions, f"{target}_round_{target_round}")

            # Calculate total points for this round
            point_columns = [f"{t}_points" for t in targets]
            next_round_df["total_points"] = next_round_df[point_columns].sum(axis=1)

            # Add round number explicitly
            next_round_df["round"] = target_round

            # Save this round's predictions
            round_data = next_round_df.to_dict("records")
            prediction_rounds.append({"round": target_round, "predictions": round_data})

            # Add this round's predictions to our cumulative dataframe for next round's predictions
            cumulative_df = pd.concat(
                [cumulative_df, next_round_df],
                ignore_index=True,
            )

            # Save the prediction dataframe for this round
            output_path = f"data/predicted_round_{target_round}.json"
            next_round_df.to_json(output_path, orient="records", indent=2)
            logging.info(f"Saved round {target_round} predictions to {output_path}")

        # Save the complete prediction set

        cumulative_df_js = cumulative_df[next_round_df.columns.tolist()]

        cumulative_df_js.to_json(
            "data/horizon_predictions.json", orient="records", indent=2
        )
        logging.info(f"Saved complete horizon predictions ")

        # Generate response with all predictions
        cumulative_df = cumulative_df[
            (cumulative_df["round"] > gameweek)
            & (cumulative_df["round"] <= gameweek + horizon)
        ].copy()

        summed_df = cumulative_df.groupby("element", as_index=False).sum(
            numeric_only=True
        )
        summed_df["element"] = df.groupby("element")["element"].first().values
        summed_df["team"] = df.groupby("element")["team"].first().values
        summed_df["element_type"] = df.groupby("element")["element_type"].first().values
        summed_df["value"] = df.groupby("element")["value"].first().values
        summed_df["now_cost"] = df.groupby("element")["value"].first().values
        summed_df["web_name"] = df.groupby("element")["web_name"].first().values

        response = rh.generate_predictions_response(
            "hello",
            summed_df,
        )

        json_response = json.dumps(response, ensure_ascii=False)
        return func.HttpResponse(json_response, status_code=200)

    except Exception as e:
        logging.error(f"Error making predictions: {str(e)}", exc_info=True)
        return func.HttpResponse("Internal Server Error", status_code=500)


@app.route("optimise_team")
def optimise_team(req: func.HttpRequest) -> func.HttpResponse:
    elements = req.params.get("elements")

    if not elements:
        return func.HttpResponse("Please provide team_id", status_code=400)

    try:
        element_ids = [int(x) for x in elements.split(",")]
    except ValueError:
        return func.HttpResponse(
            "Invalid elements list; all IDs must be integers", status_code=400
        )

    bootstrap_data = di.fetch_bootstrap_data()

    gameweek = dh.get_current_gameweek(bootstrap_data)

    df = pd.DataFrame(ah.fetch_from_json("horizon_predictions.json"))

    df = df[df["round"] == (gameweek + 1)].copy()

    optimised_team = mo.optimise_team(df, element_ids)

    response = rh.generate_starting_xi_response(optimised_team)

    json_response = json.dumps(response, ensure_ascii=False)

    return func.HttpResponse(json_response, status_code=200)


@app.route("optimise_transfers")
def optimise_tranfers(req: func.HttpRequest) -> func.HttpResponse:
    horizon = int(req.params.get("horizon", 1))
    free_transfers = int(req.params.get("transfers"))
    elements = req.params.get("elements")
    team_id = req.params.get("team_id")

    bootstrap_data = di.fetch_bootstrap_data()

    gameweek = dh.get_current_gameweek(bootstrap_data)

    managers_transfers = di.fetch_managers_transfers(team_id)

    sadsa = pd.DataFrame(managers_transfers)

    for c in sadsa.columns:
        logging.info(c)

    if not team_id:
        return func.HttpResponse("Please provide team_id", status_code=400)
    if not elements:
        return func.HttpResponse("Please provide team_id", status_code=400)

    try:
        element_ids = [int(x) for x in elements.split(",")]
    except ValueError:
        return func.HttpResponse(
            "Invalid elements list; all IDs must be integers", status_code=400
        )

    managers_team = di.fetch_managers_team(int(team_id), gameweek)

    logging.info(managers_team)

    logging.info("Getting manager's bank value")
    managers_bank_value: float = managers_team["entry_history"]["bank"]

    df = pd.DataFrame(ah.fetch_from_json("horizon_predictions.json"))
    df = df[(df["round"] > gameweek) & (df["round"] <= gameweek + horizon)].copy()

    # Set 'element' and 'team' aside
    summed_df = df.groupby("element", as_index=False).sum(numeric_only=True)
    summed_df["team"] = df.groupby("element")["team"].first().values
    summed_df["element_type"] = df.groupby("element")["element_type"].first().values
    summed_df["value"] = df.groupby("element")["value"].first().values
    summed_df["now_cost"] = df.groupby("element")["value"].first().values
    summed_df["web_name"] = df.groupby("element")["web_name"].first().values

    summed_df.to_json("data/summed.json", orient="records", indent=2)

    result = mo.optimize_transfers(
        summed_df, element_ids, managers_bank_value, free_transfers, sadsa, targets
    )

    response = rh.generate_transfer_response(result)

    json_response = json.dumps(response, ensure_ascii=False)

    return func.HttpResponse(json_response, status_code=200)


def optimise_starting_xi(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Starting XI optimization request received")

    # Get parameters from request
    team_id = req.params.get("team_id")
    model_type = req.params.get("model")

    # Validate required parameters
    if not team_id:
        return func.HttpResponse("Please provide team_id", status_code=400)
    if not model_type:
        return func.HttpResponse("Please provide model parameter", status_code=400)

    try:
        # Load required data
        logging.info("1")
        bootstrap_data = ah.fetch_from_json("bootstrap_data.json")
        current_gameweek = dh.get_current_gameweek(bootstrap_data)

        logging.info("2")
        # Fetch manager's current team
        managers_team = di.fetch_managers_team(int(team_id), current_gameweek)
        managers_players_ids = [player["element"] for player in managers_team["picks"]]

        logging.info("3")
        # Process data and filter for current gameweek
        df = dp.process_data(horizon=1)  # Only need current gameweek for starting XI
        current_gw_df = df[df["round"] == current_gameweek]
        current_gw_df = current_gw_df[
            current_gw_df["element"].isin(managers_players_ids)
        ]

        logging.info("4")
        # Get point predictions (using existing model operations)
        point_predictions = mo.calculate_player_points(
            current_gw_df, model_type=model_type, gameweek=current_gameweek
        )

        logging.info("5")
        # Get optimized starting XI
        optimized_xi, captain, vice_captain = mo.get_optimized_starting_xi(
            point_predictions=point_predictions,
            current_squad=managers_team["picks"],
            bootstrap_data=bootstrap_data,
        )

        logging.info("6")
        # Prepare response
        response = rh.generate_starting_xi_response(
            starting_xi=optimized_xi,
            captain=captain,
            vice_captain=vice_captain,
            bootstrap_data=bootstrap_data,
            gameweek=current_gameweek,
        )

        return func.HttpResponse(
            json.dumps(response), status_code=200, mimetype="application/json"
        )

    except Exception as e:
        logging.error(f"Error optimizing starting XI: {str(e)}")
        return func.HttpResponse(f"Error processing request: {str(e)}", status_code=500)


def optimise_xi(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Optimising team")
    team_id = req.params.get("team_id")
    model_type = req.params.get("model")
    horizon = 1

    if not model_type:
        return func.HttpResponse("Please provide model parameter", status_code=400)

    if not team_id:
        return func.HttpResponse("Please provide team_ids", status_code=400)

    logging.info("Fetching bootstrap data")
    bootstrap_data = ah.fetch_from_json("bootstrap_data.json")
    bootstrap_elements_df = pd.DataFrame(bootstrap_data["elements"])
    bootstrap_elements_df = bootstrap_elements_df[
        bootstrap_elements_df["element_type"] != 5
    ]

    logging.info("Getting current gameweek")
    current_gameweek = dh.get_current_gameweek(bootstrap_data)

    logging.info(current_gameweek)

    logging.info("Fetching manager's transfers")
    managers_transfers = di.fetch_managers_transfers(int(team_id))

    logging.info("Loading fixtures data")
    fixtures_data = ah.fetch_from_json("fixtures_data.json")
    fixtures_df = pd.DataFrame(fixtures_data)

    logging.info("Loading manager's data")
    managers_team = di.fetch_managers_team(int(team_id), current_gameweek)

    logging.info(managers_team)

    logging.info("Getting manager's bank value")
    managers_bank_value = managers_team["entry_history"]["bank"]

    df = dp.process_data(int(horizon))

    df = df[df["element_element_type"] != 5]

    current_gw_df: pd.DataFrame = df[df["round"] == current_gameweek]

    targets = dh.get_targets()

    targets = [f"target_{target}" for target in targets]

    r2_scores = {}

    for target in targets:
        model, preprocessor, r2 = mo.trainMultiGwModel(
            model_type, df, int(horizon), current_gameweek, target
        )

        r2_scores[target] = r2

        logging.info(f"R2 score for {target}: {r2:.4f}")

        current_gw_dfProcessed = preprocessor.transform(current_gw_df)

        current_gw_df[f"predicted_{target}"] = np.clip(
            model.predict(current_gw_dfProcessed), 0, None
        )

        if target == "target_goals_scored":
            positionMultipliers = {1: 10, 2: 6, 3: 5, 4: 4}
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"]
                * positionMultipliers[row["element_element_type"]],
                axis=1,
            )
        elif target == "target_assists":
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"] * 3,
                axis=1,
            )

        elif target == "target_minutes":
            # for each gameweek, a player will get 2 points for playing more than 60 minutes, 1 point for playing at least 1 minute
            # bare in mind when doing this its prediciting the minutes for the next horizon gameweeks so the predicted minutes will be alot higher than 60
            current_gw_df[f"predicted_{target}"] = current_gw_df.apply(
                lambda row: (
                    horizon * 2
                    if (row[f"predicted_{target}"] / horizon) > 60
                    else horizon
                ),
                axis=1,
            )

        elif target == "target_saves":
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"] * (1 / 3),
                axis=1,
            )

        elif target == "target_minutes_60+":
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"],
                axis=1,
            )

        elif target == "target_minutes_1+":
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"],
                axis=1,
            )

        elif target == "target_clean_sheets":
            positionMultipliers = {1: 4, 2: 4, 3: 1, 4: 0}
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"]
                * positionMultipliers[row["element_element_type"]],
                axis=1,
            )

        elif target == "target_bonus":
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"],
                axis=1,
            )

        # print the predicted targets for the top 10 players
        logging.info(
            current_gw_df[
                [
                    "element_web_name",
                    f"predicted_{target}",
                    f"predicted_{target}_points",
                ]
            ]
            .sort_values(by=f"predicted_{target}", ascending=False)
            .head(10)
        )

    print(
        "###################################################################################################################"
    )

    logging.info("\n" + "=" * 80)
    logging.info("MODEL PERFORMANCE METRICS".center(80))
    logging.info("=" * 80)
    logging.info(f"{'Target':<25} | {'R² Score':<10}")
    logging.info("-" * 80)

    for target, score in r2_scores.items():
        score_display = f"{score:.4f}" if score is not None else "FAILED"
        logging.info(f"{target:<25} | {score_display:<10}")
    logging.info("=" * 80 + "\n")
    valid_r2_scores = [score for score in r2_scores.values() if score is not None]
    total_r2 = sum(valid_r2_scores)
    avg_r2 = total_r2 / len(valid_r2_scores) if valid_r2_scores else 0

    logging.info("##############################")
    logging.info("Total R² Score:")
    logging.info(f"TOTAL R2 SCORE {total_r2:.4f}")
    logging.info("Average R² Score:")
    logging.info(f"AVERAGE R2 SCORE {avg_r2:.4f}")
    logging.info("##############################")

    logging.info("\nR2 Scores for Each Target:")
    for target, score in r2_scores.items():
        logging.info(f"{target}: {score:.4f}")

    current_gw_df["predicted_points"] = current_gw_df[
        [f"predicted_{target}_points" for target in targets]
    ].sum(axis=1)

    logging.info(
        current_gw_df[
            ["element_web_name", "predicted_points"]
            + [f"predicted_{target}" for target in targets]
        ]
        .sort_values(by="predicted_points", ascending=False)
        .head(10)
    )

    managers_players_ids = [player["element"] for player in managers_team["picks"]]

    managers_players_df = df[df["element"].isin(managers_players_ids)]
    managers_players_df = managers_players_df[
        managers_players_df["round"] == current_gameweek
    ]

    optimized_xi, captain, vice_captain = mo.get_optimized_starting_xi(
        currentSquad=managers_players_df,
        pointPredictions=current_gw_df.set_index("element")["predicted_points"],
        playerData=current_gw_df,
    )

    logging.info(captain)

    logging.info(current_gw_df.columns)
    logging.info("sdsd")

    for column in current_gw_df.columns:
        logging.info(column)

    formatted_xi = [
        {
            "player": {
                "id": p,
                "name": bootstrap_elements_df[bootstrap_elements_df["id"] == p][
                    "web_name"
                ].values[0],
            },
            "is_captain": p == captain,
            "is_vice_captain": p == vice_captain,
        }
        for p in optimized_xi
    ]

    for i in optimized_xi:
        logging.info(i)

    return func.HttpResponse(
        json.dumps(formatted_xi), status_code=200, mimetype="application/json"
    )


# @app.route("optimise_transfers")
def optimi(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Python HTTP trigger function processed a request.")
    team_id = req.params.get("team_id")
    horizon = req.params.get("horizon")
    model_type = req.params.get("model")
    transfers_amount: int = req.params.get("transfers")

    if not transfers_amount:
        return func.HttpResponse("Please provide transfers parameter", status_code=400)

    if not model_type:
        return func.HttpResponse("Please provide model parameter", status_code=400)

    if not team_id:
        return func.HttpResponse("Please provide team_ids", status_code=400)

    if not horizon:
        return func.HttpResponse("Please provide horizon", status_code=400)

    logging.info("Fetching bootstrap data")
    bootstrap_data = ah.fetch_from_json("bootstrap_data.json")
    bootstrap_elements_df = pd.DataFrame(bootstrap_data["elements"])
    bootstrap_elements_df = bootstrap_elements_df[
        bootstrap_elements_df["element_type"] != 5
    ]

    logging.info("Getting current gameweek")
    current_gameweek = dh.get_current_gameweek(bootstrap_data)

    logging.info(current_gameweek)

    logging.info("Fetching manager's transfers")
    managers_transfers = di.fetch_managers_transfers(int(team_id))

    logging.info("Loading fixtures data")
    fixtures_data = ah.fetch_from_json("fixtures_data.json")
    fixtures_df = pd.DataFrame(fixtures_data)

    logging.info("Loading manager's data")
    managers_team = di.fetch_managers_team(int(team_id), current_gameweek)

    logging.info(managers_team)

    logging.info("Getting manager's bank value")
    managers_bank_value = managers_team["entry_history"]["bank"]

    df = dp.process_data(int(horizon))

    df = df[df["element_element_type"] != 5]

    current_gw_df: pd.DataFrame = df[df["round"] == current_gameweek]

    targets = dh.get_targets()

    targets = [f"target_{target}" for target in targets]

    r2_scores = {}

    for target in targets:
        model, preprocessor, r2 = mo.trainMultiGwModel(
            model_type, df, int(horizon), current_gameweek, target
        )

        r2_scores[target] = r2

        logging.info(f"R2 score for {target}: {r2:.4f}")

        current_gw_dfProcessed = preprocessor.transform(current_gw_df)

        current_gw_df[f"predicted_{target}"] = np.clip(
            model.predict(current_gw_dfProcessed), 0, None
        )

        if target == "target_goals_scored":
            positionMultipliers = {1: 10, 2: 6, 3: 5, 4: 4}
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"]
                * positionMultipliers[row["element_element_type"]],
                axis=1,
            )
        elif target == "target_assists":
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"] * 3,
                axis=1,
            )

        elif target == "target_minutes":
            # for each gameweek, a player will get 2 points for playing more than 60 minutes, 1 point for playing at least 1 minute
            # bare in mind when doing this its prediciting the minutes for the next horizon gameweeks so the predicted minutes will be alot higher than 60
            current_gw_df[f"predicted_{target}"] = current_gw_df.apply(
                lambda row: (
                    horizon * 2
                    if (row[f"predicted_{target}"] / horizon) > 60
                    else horizon
                ),
                axis=1,
            )

        elif target == "target_saves":
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"] * (1 / 3),
                axis=1,
            )

        elif target == "target_minutes_60+":
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"],
                axis=1,
            )

        elif target == "target_minutes_1+":
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"],
                axis=1,
            )

        elif target == "target_clean_sheets":
            positionMultipliers = {1: 4, 2: 4, 3: 1, 4: 0}
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"]
                * positionMultipliers[row["element_element_type"]],
                axis=1,
            )

        elif target == "target_bonus":
            current_gw_df[f"predicted_{target}_points"] = current_gw_df.apply(
                lambda row: row[f"predicted_{target}"],
                axis=1,
            )

        # print the predicted targets for the top 10 players
        logging.info(
            current_gw_df[
                [
                    "element_web_name",
                    f"predicted_{target}",
                    f"predicted_{target}_points",
                ]
            ]
            .sort_values(by=f"predicted_{target}", ascending=False)
            .head(10)
        )

    print(
        "###################################################################################################################"
    )

    logging.info("\n" + "=" * 80)
    logging.info("MODEL PERFORMANCE METRICS".center(80))
    logging.info("=" * 80)
    logging.info(f"{'Target':<25} | {'R² Score':<10}")
    logging.info("-" * 80)

    for target, score in r2_scores.items():
        score_display = f"{score:.4f}" if score is not None else "FAILED"
        logging.info(f"{target:<25} | {score_display:<10}")
    logging.info("=" * 80 + "\n")
    valid_r2_scores = [score for score in r2_scores.values() if score is not None]
    total_r2 = sum(valid_r2_scores)
    avg_r2 = total_r2 / len(valid_r2_scores) if valid_r2_scores else 0

    logging.info("##############################")
    logging.info("Total R² Score:")
    logging.info(f"TOTAL R2 SCORE {total_r2:.4f}")
    logging.info("Average R² Score:")
    logging.info(f"AVERAGE R2 SCORE {avg_r2:.4f}")
    logging.info("##############################")

    logging.info("\nR2 Scores for Each Target:")
    for target, score in r2_scores.items():
        logging.info(f"{target}: {score:.4f}")

    current_gw_df["predicted_points"] = current_gw_df[
        [f"predicted_{target}_points" for target in targets]
    ].sum(axis=1)

    logging.info(
        current_gw_df[
            ["element_web_name", "predicted_points"]
            + [f"predicted_{target}" for target in targets]
        ]
        .sort_values(by="predicted_points", ascending=False)
        .head(10)
    )

    managers_players_ids = [player["element"] for player in managers_team["picks"]]

    # get the players in the managers squad for the current gameweek
    maangers_players_df = df[df["element"].isin(managers_players_ids)]
    maangers_players_df = maangers_players_df[
        maangers_players_df["round"] == current_gameweek
    ]

    transfers_in, transfers_out, gain, transfer_pairs = mo.optimizeMultiGwTransfers(
        currentSquad=maangers_players_df,
        pointPredictions=current_gw_df.set_index("element")["predicted_points"],
        playerData=current_gw_df,
        budget=managers_bank_value,
        team_id=team_id,
        transfersNumber=transfers_amount,
    )

    response = rh.generate_transfer_response(
        transfer_pairs,
        gain,
        bootstrap_elements_df,
        fixtures_df,
        current_gameweek,
        current_gw_df,
    )

    json_response = json.dumps(response, ensure_ascii=False)

    logging.info(json_response)

    return func.HttpResponse(json_response, status_code=200)
