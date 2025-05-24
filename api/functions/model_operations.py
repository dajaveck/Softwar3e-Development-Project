import json
import logging
from scipy.stats import randint, uniform
from typing import Dict, List

from sklearn.pipeline import Pipeline

import helpers.data_helpers as dh
import functions.data_ingestion as di
import numpy as np
import pandas as pd
import pulp
from pulp import LpMaximize, LpProblem, LpStatus, LpVariable, lpSum
from sklearn.compose import ColumnTransformer
from sklearn.discriminant_analysis import StandardScaler
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV, train_test_split
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor

position_multipliers = {1: 6, 2: 6, 3: 5, 4: 4}

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


def plot_linear_regression(y_true, y_pred, target_name, model_name="Model"):
    """
    Linear regression plot with perfect prediction line, integer ticks, and 1.5:1 aspect ratio

    Parameters:
    y_true (array-like): Actual target values
    y_pred (array-like): Model predictions
    target_name (str): Target variable name
    model_name (str): Model name for title
    """
    plt.figure(figsize=(12, 8))  # Wider figure for 1.5:1 aspect

    # Convert to numpy arrays
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    # Calculate axis limits
    max_val = max(y_true.max(), y_pred.max())
    axis_limit = int(np.ceil(max_val))
    padding = 0.5

    # Scatter plot with custom markers
    plt.scatter(
        y_true + np.random.normal(0, 0.05, size=len(y_true)),
        y_pred,
        alpha=0.7,
        s=60,
        edgecolor="k",
        linewidth=0.5,
        c="#1f77b4",
        label="Predictions",
    )

    # Regression line
    m, b = np.polyfit(y_true, y_pred, 1)
    plt.plot(
        y_true,
        m * y_true + b,
        "r-",
        linewidth=2,
        label=f"Regression Line (y = {m:.2f}x + {b:.2f})",
    )

    # Calculate metrics
    r2 = r2_score(y_true, y_pred)
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))

    # Metrics box
    textstr = "\n".join((f"R² = {r2:.3f}", f"MAE = {mae:.3f}", f"RMSE = {rmse:.3f}"))

    props = dict(boxstyle="round", facecolor="white", alpha=0.9)
    plt.text(
        0.95,
        0.95,
        textstr,
        transform=plt.gca().transAxes,
        fontsize=12,
        verticalalignment="top",
        horizontalalignment="right",
        bbox=props,
    )

    # Formatting with 1.5:1 aspect ratio
    plt.xlim(-padding, axis_limit + padding)
    plt.ylim(-padding, axis_limit + padding)
    plt.xticks(np.arange(0, axis_limit + 1, 1))
    plt.yticks(np.arange(0, axis_limit + 1, 1))

    plt.xlabel(f"Actual goals_scored", fontsize=12)
    plt.ylabel(f"Predicted goals_scored", fontsize=12)
    plt.title(f"{model_name} Performance: goals_scored", fontsize=14, pad=20)

    # Configure grid and aspect ratio
    plt.grid(True, linestyle="--", alpha=0.3)
    plt.gca().set_aspect(1 / 1.5)  # 1.5:1 width:height ratio
    plt.legend(loc="upper left", framealpha=1)

    # Adjust layout with more padding
    plt.tight_layout(pad=3)

    return plt.gcf()


def plot_svr_single_feature(
    X_train,
    y_train,
    X_val,
    y_val,
    preprocessor,
    target_name,
    feature_name="rolling_5gw_goals_scored",
):
    """
    Properly plots SVR relationship between actual and predicted goals
    """
    plt.figure(figsize=(12, 8))
    # Get feature index
    transformed_name = feature_name
    feature_names = preprocessor.get_feature_names_out()
    matches = np.where(feature_names == transformed_name)[0]
    if len(matches) == 0:
        available_features = "\n".join(feature_names)
        raise ValueError(
            f"Feature '{transformed_name}' not found. Available features:\n{available_features}"
        )
    feat_idx = matches[0]

    # Extract and prepare data
    X_train_feat = X_train[:, feat_idx].reshape(-1, 1)
    X_val_feat = X_val[:, feat_idx].reshape(-1, 1)

    # Train LINEAR SVR on single feature
    svr = SVR(kernel="linear", C=0.1, epsilon=0.1)
    svr.fit(X_train_feat, y_train)

    # Generate predictions
    y_pred = svr.predict(X_val_feat)

    # Create grid for plotting boundaries
    x_min, x_max = 0, max(np.max(y_val), np.max(y_pred)) + 1
    xx = np.linspace(x_min, x_max, 100).reshape(-1, 1)
    yy = svr.predict(xx)

    # Plot actual vs predicted
    plt.scatter(
        y_val, y_pred, c="#ff7f0e", alpha=0.7, s=80, edgecolor="k", label="Predictions"
    )

    # Plot hyperplane and boundaries
    plt.plot(xx, yy, "r-", lw=3, label="SVR Hyperplane")
    plt.plot(xx, yy + svr.epsilon, "r--", lw=1.5, label="+ε boundary")
    plt.plot(xx, yy - svr.epsilon, "r--", lw=1.5, label="-ε boundary")
    plt.plot([x_min, x_max], [x_min, x_max], "k--", label="Perfect Prediction")

    # Formatting
    plt.xticks(np.arange(x_min, x_max + 1))
    plt.yticks(np.arange(x_min, x_max + 1))
    plt.xlabel(f"Actual {target_name}")
    plt.ylabel(f"Predicted {target_name}")
    plt.title(f"SVR: {target_name} Prediction", fontsize=14, pad=20)
    plt.grid(True, alpha=0.2)
    plt.legend(loc="upper left")

    return plt.gcf()


def create_preprocessor(
    categorical_features: List[str], numerical_features: List[str]
) -> ColumnTransformer:
    """Create the preprocessing pipeline for categorical and numerical features."""
    return ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", drop="first"),
                categorical_features,
            ),
            ("num", StandardScaler(), numerical_features),
        ],
        remainder="drop",
    )


def create_model(model: Pipeline, preprocessor: ColumnTransformer) -> Pipeline:
    """Create a regression pipeline with preprocessor and regressor."""
    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", model),
        ]
    )


def train_test_split(
    df: pd.DataFrame, features: pd.DataFrame, target: pd.Series
) -> tuple:
    """Split the dataset into train and test sets."""
    split_idx = int(len(df) * 0.8)
    X_train, X_test = features.iloc[:split_idx], features.iloc[split_idx:]
    y_train, y_test = target.iloc[:split_idx], target.iloc[split_idx:]
    return X_train, X_test, y_train, y_test


def evaluate_model(y_test: pd.Series, y_pred: np.ndarray) -> None:
    """Evaluate the model performance and log the results."""
    mse = round(mean_absolute_error(y_test, y_pred), 4)
    r2 = round(r2_score(y_test, y_pred), 4)
    rmse = round(np.sqrt(mean_absolute_error(y_test, y_pred)), 4)

    logging.info(f"Time Series MSE: {mse:.4f}")
    logging.info(f"Time Series r2: {r2:.4f}")
    logging.info(f"Time Series rmse: {rmse:.4f}")

    return {
        "mae": mse,
        "rmse": rmse,
        "r2": r2,
    }


def get_feature_importance(
    model: Pipeline, categorical_features: List[str], numerical_features: List[str]
) -> pd.Series:
    """Extract and log feature importances."""
    ohe = model.named_steps["preprocessor"].named_transformers_["cat"]
    encoded_feature_names = ohe.get_feature_names_out(categorical_features)
    final_feature_names = list(encoded_feature_names) + numerical_features

    coefs = model.named_steps["regressor"].coef_

    if len(coefs) != len(final_feature_names):
        logging.warning(
            f"Length mismatch: {len(coefs)} coefficients vs {len(final_feature_names)} features"
        )

    feature_importance = pd.Series(coefs, index=final_feature_names).sort_values(
        key=abs, ascending=False
    )

    logging.info("Feature Importances:")
    for name, importance in feature_importance.items():
        logging.info(f"{name}: {importance:.4f}")


def get_feature_importance_gb(
    model: Pipeline, categorical_features: List[str], numerical_features: List[str]
) -> pd.Series:
    """Extract and log feature importances for Gradient Boosting model."""

    # Extract the one-hot encoded categorical features
    ohe = model.named_steps["preprocessor"].named_transformers_["cat"]
    encoded_feature_names = ohe.get_feature_names_out(categorical_features)
    final_feature_names = list(encoded_feature_names) + numerical_features

    # Get feature importances from the GradientBoostingRegressor
    gb_model = model.named_steps["regressor"]

    # Ensure the model is a Gradient Boosting model
    if isinstance(gb_model, GradientBoostingRegressor):
        feature_importance = pd.Series(
            gb_model.feature_importances_, index=final_feature_names
        ).sort_values(key=abs, ascending=False)
    else:
        logging.warning(
            "The model is not a GradientBoostingRegressor. Cannot extract feature importances."
        )

    # Log the feature importances
    logging.info("Feature Importances:")
    for name, importance in feature_importance.items():
        logging.info(f"{name}: {importance:.4f}")

    return feature_importance


def tune_hyperparameters(
    model: Pipeline,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    model_type: str,
    target: str,
):
    """Quick hyperparameter tuning with a reduced search space and iterations, excluding Linear Regression."""

    if model_type == "Gradient Boosting":
        param_dist = {
            "regressor__n_estimators": randint(50, 200),  # Number of estimators
            "regressor__learning_rate": uniform(0.01, 0.2),  # Learning rate
            "regressor__max_depth": randint(3, 15),  # Depth of trees
            "regressor__min_samples_split": randint(2, 10),  # Min samples to split
            "regressor__min_samples_leaf": randint(1, 5),  # Min samples in leaf
        }
    elif model_type == "Decision Tree":
        param_dist = {
            "regressor__max_depth": randint(3, 15),  # Max depth of tree
            "regressor__min_samples_split": randint(2, 10),  # Min samples to split
            "regressor__min_samples_leaf": randint(1, 5),  # Min samples in leaf
            "regressor__criterion": [
                "squared_error",
                "friedman_mse",
            ],  # Tree split criteria
        }
    elif model_type == "Support Vector Machine":
        param_dist = {
            "regressor__C": uniform(0.1, 5),  # Regularization parameter
            "regressor__epsilon": uniform(0.01, 0.5),  # Epsilon in loss function
            "regressor__gamma": ["scale", "auto"],  # Kernel coefficient
        }

    # Linear Regression does not have hyperparameters to tune in this context
    elif model_type == "Linear Regression" or model_type == "Random Forest":
        # No tuning needed for Linear Regression
        return model, {"best_hyperparameters": None, "metrics": None}

    # Perform Randomized Search for models with tunable hyperparameters
    search = RandomizedSearchCV(
        model,
        param_distributions=param_dist,
        n_iter=10,  # Number of combinations to try
        cv=2,  # 3-fold cross-validation
        scoring="neg_mean_squared_error",  # Using MSE for regression
        random_state=42,
        n_jobs=-1,
        verbose=1,
    )

    search.fit(X_train, y_train)

    logging.info("Best hyperparameters:")
    for param, value in search.best_params_.items():
        logging.info(f"{param}: {value}")

    # Save the best hyperparameters and metrics to a JSON file
    filename = f"best_hyperparameters_and_metrics_{model_type}_{target}.json"

    # Create a dictionary to save both hyperparameters and metrics
    result_data = {
        "best_hyperparameters": search.best_params_,
        "metrics": None,  # We will fill this in later after evaluation
    }

    return search.best_estimator_, result_data


def train_model(
    model_type, df: pd.DataFrame, categorical_features, numerical_features, target
) -> Pipeline:
    logging.info(f"Training for {target}")
    features = categorical_features + numerical_features

    goalkeeper_targets = [
        "saves",
        "penalties_saved",
    ]

    if target in goalkeeper_targets:
        # Only include goalkeepers for goalkeeper-specific targets
        df = df[df["element_type"] == 1]

    X = df[features]
    y = df[target]

    if model_type == "Linear Regression":
        algorithmn = (
            LinearRegression()
        )  # For Linear Regression (no hyperparameter tuning)
    elif model_type == "Decision Tree":
        algorithmn = DecisionTreeRegressor(random_state=42)
    elif model_type == "Random Forest":
        algorithmn = RandomForestRegressor(
            bootstrap=True,
            max_depth=12,
            min_samples_leaf=4,
            min_samples_split=5,
            n_estimators=64,
            random_state=42,
        )

    elif model_type == "Gradient Boosting":
        algorithmn = GradientBoostingRegressor(random_state=42)
    elif model_type == "Support Vector Machine":
        algorithmn = SVR(kernel="rbf")
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    preprocessor = create_preprocessor(categorical_features, numerical_features)
    model = create_model(algorithmn, preprocessor)

    # Split the data into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(df, X, y)

    model, result_data = tune_hyperparameters(
        model, X_train, y_train, model_type, target
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    # Evaluate the model
    metrics = evaluate_model(y_test, y_pred)

    # Add the metrics to the result_data dictionary
    result_data["metrics"] = metrics

    # Save the hyperparameters and metrics to a JSON file
    filename = f"metrics/best_hyperparameters_and_metrics_{model_type}_{target}.json"
    with open(filename, "w") as f:
        json.dump(result_data, f, indent=4)

    return model

    # Train the model

    # model = tune_hyperparameters(model, X_train, y_train)

    # Make predictions

    # Evaluate the model
    # evaluate_model(y_test, y_pred)

    # if target == "minutes":
    # get_feature_importance(model, categorical_features, numerical_features)

    return model


def optimizeMultiGwTransfers(
    currentSquad: pd.DataFrame,
    pointPredictions: pd.Series,  # Predicted goals (indexed by player ID)
    playerData: pd.DataFrame,  # All players (must include 'element', 'position', 'team_id', 'value')
    budget: float,
    team_id: int,
    transfersNumber: int,
) -> tuple[list, list, float]:
    """
    Optimizes transfers to maximize predicted goals over a horizon.
    Args:
        currentSquad: DataFrame of the current squad.
        goalPredictions: Predicted goals for each player.
        playerData: DataFrame of all players with their attributes.
        budget: Available budget for transfers.
        horizon: Number of future gameweeks to optimize for.
    Returns:
        Tuple of (transfersIn, transfersOut, predictedGoalGain).
    """

    transfersNumber = int(transfersNumber)
    # Ensure playerData is indexed by player ID
    logging.info(f"Transfers Number: {transfersNumber}")
    playerData = playerData.set_index("element", drop=False)

    managersTransfers = di.fetch_managers_transfers(team_id)
    managersTransfersDF = pd.DataFrame(managersTransfers)

    # Collect all player IDs and current squad IDs
    # converted to a list sincre we are using pulp
    allPlayers = playerData.index.tolist()
    currentSquadIds = currentSquad["element"].tolist()

    # Caluclate the sale price for each player
    salePrices = {
        p: calculate_sale_price(p, managersTransfersDF, playerData)
        for p in currentSquad["element"]
    }

    # Initialize problem
    prob = LpProblem("FPL_Transfer_Optimizer", LpMaximize)

    # Decision variables - 1 if player is in squad after transfers
    squadVars = LpVariable.dicts("Squad", allPlayers, cat="Binary")

    # Objective: Maximize total weighted predicted goals based on position
    prob += lpSum(
        squadVars[p] * pointPredictions.get(p, 0)  # Added closing bracket
        for p in allPlayers
    )

    # --- Constraints ---
    # Squad must have exactly 15 players
    prob += lpSum(squadVars[p] for p in allPlayers) == 15

    # Transfer constraints (1-5 transfers)
    transfersIn = lpSum(squadVars[p] for p in allPlayers if p not in currentSquadIds)
    transfersOut = lpSum(1 - squadVars[p] for p in currentSquadIds)
    prob += transfersIn == transfersOut  # Must have equal in/out
    prob += transfersIn >= 1
    prob += transfersIn <= transfersNumber

    totalCost = lpSum(
        squadVars[p] * playerData.loc[p, "value"]
        for p in allPlayers
        if p not in currentSquadIds
    )

    totalSale = lpSum(
        (1 - squadVars[p]) * salePrices[p]  # Sell using calculated sale price
        for p in currentSquadIds
    )
    prob += (totalCost - totalSale) <= budget

    # Position constraints
    posRequirements = {1: 2, 2: 5, 3: 5, 4: 3}  # GK, DEF, MID, FWD
    for pos, req in posRequirements.items():
        playersInPos = playerData[
            playerData["element_element_type"] == pos
        ].index.tolist()
        prob += lpSum(squadVars[p] for p in playersInPos) == req

    # Team constraints (max 3 players per team)
    for teamId in playerData["element_team"].unique():
        teamPlayers = playerData[playerData["element_team"] == teamId].index.tolist()
        prob += lpSum(squadVars[p] for p in teamPlayers) <= 3

    # Solve problem in silent mode
    prob.solve(pulp.PULP_CBC_CMD(msg=False))
    # logging.info(f"Solver Status: {LpStatus[prob.status]}")

    if LpStatus[prob.status] != "Optimal":
        raise ValueError("No optimal solution found")

    # Extract results
    newSquad = [p for p in allPlayers if squadVars[p].value() == 1]
    transfersIn = [p for p in newSquad if p not in currentSquadIds]
    transfersOut = [p for p in currentSquadIds if p not in newSquad]

    # Calculate predicted goal gain
    gain = sum(pointPredictions.get(p, 0) for p in transfersIn) - sum(
        pointPredictions.get(p, 0) for p in transfersOut
    )
    # logging.info(f"Predicted Goal Gain: {gain}")

    totalCost = pulp.value(totalCost)
    totalSale = pulp.value(totalSale)
    logging.info(f"Total Cost: {totalCost:.2f}")
    logging.info(f"Total Sale: {totalSale:.2f}")
    logging.info(f"Remaining Budget: {totalSale - totalCost + budget:.2f}")

    # Debug: logging.info transfers in/out
    newSquad = [p for p in allPlayers if squadVars[p].value() == 1]
    transfersIn = sorted(
        [p for p in newSquad if p not in currentSquadIds],
        key=lambda x: playerData.loc[x, "element_element_type"],
    )
    transfersOut = sorted(
        [p for p in currentSquadIds if p not in newSquad],
        key=lambda x: playerData.loc[x, "element_element_type"],
    )

    # Create an array of transfer pairs with their respective gain
    transferPairs: list = [
        {
            "transferIn": inPlayer,
            "transferOut": outPlayer,
            "gain": pointPredictions.get(inPlayer, 0)
            - pointPredictions.get(outPlayer, 0),
        }
        for inPlayer, outPlayer in zip(transfersIn, transfersOut)
    ]

    logging.info("\nTransfers:")
    for transfer in transferPairs:
        logging.info(
            f"Transfer In: {playerData.loc[transfer['transferIn'], 'element_web_name']} | "
            f"Transfer Out: {playerData.loc[transfer['transferOut'], 'element_web_name']} | "
            f"Gain: {transfer['gain']:.2f}"
        )

    # Find kept players (in both current squad and new squad)
    keptPlayers = [p for p in currentSquadIds if p in newSquad]

    # logging.info the players with the highest predicted goals
    logging.info("\nTop Players:")
    topPlayers = pointPredictions.sort_values(ascending=False).head(10)
    for p, points in topPlayers.items():
        player = playerData.loc[p]
        logging.info(
            f"{player['element_web_name']} ({player['element_team']}) - "
            f"Position: {player['element_element_type']}, "
            f"Predicted points: {points:.2f}"
        )

    logging.info("\nPlayers Being Kept:")
    for p in keptPlayers:
        player = playerData.loc[p]
        logging.info(
            f"{player['element_web_name']} ({player['element_team']}) - "
            f"Position: {player['element_element_type']}, "
            f"Value: £{salePrices[p]/10:.1f}m"
        )

    # logging.info transfers in
    logging.info("\nTransfers In:")
    for p in transfersIn:
        player = playerData.loc[p]
        logging.info(
            f"{player['element_web_name']} ({player['element_team']}) - "
            f"Position: {player['element_element_type']}, "
            f"Cost: £{player['value']/10:.1f}m"
        )

    # logging.info transfers out
    logging.info("\nTransfers Out:")
    for p in transfersOut:
        player = playerData.loc[p]
        logging.info(
            f"{player['element_web_name']} ({player['element_team']}) - "
            f"Sale Price: £{salePrices[p]/10:.1f}m"
        )

    logging.info("help")

    logging.info(f"returning")

    return transfersIn, transfersOut, gain, transferPairs


def optimise_team(df: pd.DataFrame, element_ids):
    logging.info("Optimising Team")

    df = df[df["element"].isin(element_ids)].copy()

    if len(df) != 15:
        raise ValueError(f"Expected 15 players, got {len(df)}")

    df["is_captain"] = False
    df["is_vicecaptain"] = False
    df["starting_xi"] = False

    prob = pulp.LpProblem("StartingXIOptimisation", pulp.LpMaximize)

    x = {i: pulp.LpVariable(f"x_{i}", cat="Binary") for i in df.index}
    c = {i: pulp.LpVariable(f"c_{i}", cat="Binary") for i in df.index}

    # Maximize points + double captain's points
    prob += pulp.lpSum(
        x[i] * df.loc[i, "total_points"] + c[i] * df.loc[i, "total_points"]
        for i in df.index
    )

    # Constraints
    prob += pulp.lpSum(x[i] for i in df.index) == 11, "Starting11Constraint"
    prob += pulp.lpSum(c[i] for i in df.index) == 1, "OneCaptainConstraint"

    for i in df.index:
        prob += c[i] <= x[i], f"CaptainInXI_{i}"

    # Positional constraints
    gk = df[df["element_type"] == 1].index
    def_ = df[df["element_type"] == 2].index
    mid = df[df["element_type"] == 3].index
    fwd = df[df["element_type"] == 4].index

    prob += pulp.lpSum(x[i] for i in gk) == 1, "OneGK"
    prob += pulp.lpSum(x[i] for i in def_) >= 3, "MinThreeDEF"
    prob += pulp.lpSum(x[i] for i in mid) >= 2, "MinTwoMID"
    prob += pulp.lpSum(x[i] for i in fwd) >= 1, "MinOneFWD"

    prob.solve()

    # Fill in the DataFrame
    for i in df.index:
        if pulp.value(x[i]) == 1:
            df.at[i, "starting_xi"] = True
        if pulp.value(c[i]) == 1:
            df.at[i, "is_captain"] = True

    # Vice captain selection: second highest scorer in starting XI (excluding captain)
    starting_players = df[df["starting_xi"]]
    captain_id = starting_players[starting_players["is_captain"]].index[0]

    vice_candidates = starting_players.drop(index=captain_id)
    vice_captain_id = vice_candidates.sort_values(
        "total_points", ascending=False
    ).index[0]

    df.at[vice_captain_id, "is_vicecaptain"] = True

    # Bench order
    bench_players = df[~df["starting_xi"]].sort_values("total_points", ascending=False)
    df["bench_order"] = 0
    for order, i in enumerate(bench_players.index, 1):
        df.at[i, "bench_order"] = order

    logging.info(f"Starting XI selected: {starting_players.index.tolist()}")
    logging.info(f"Captain: {captain_id}")
    logging.info(f"Vice Captain: {vice_captain_id}")
    logging.info(f"Bench order: {bench_players.index.tolist()}")

    return df


def optimize_transfers(
    df: pd.DataFrame,
    current_squad_ids: list,
    budget: float,
    max_transfers: int,
    managers_transfers: pd.DataFrame,
    targets: list,
) -> Dict:
    """
    Optimize transfers to maximize predicted points while respecting constraints.

    Args:
        df: DataFrame containing all players with columns:
            - 'element': player ID
            - 'element_type': position (1=GK, 2=DEF, 3=MID, 4=FWD)
            - 'team': team ID
            - 'total_points': predicted points
            - 'now_cost': current price (in FPL units, e.g., 52 = £5.2m)
            - 'value': current price (same as now_cost)
        current_squad_ids: list of player IDs in current squad
        budget: available budget in millions (e.g., 1.0 = £1.0m)
        free_transfers: number of free transfers available
        max_transfers: maximum allowed transfers (usually free_transfers + potential hits)
        managers_transfers: DataFrame of manager's transfer history with columns:
            - 'element_in': player ID bought
            - 'element_in_cost': purchase price
            - 'time': transfer timestamp

    Returns:
        Dictionary containing:
        - 'transfer_pairs': list of transfer pairs with gain calculations
        - 'optimized_squad': DataFrame with optimization results
        - 'net_cost': net cost of transfers
        - 'points_gain': total points gain from transfers
        - 'num_transfers': number of transfers made
    """
    logging.info("Optimizing transfers")

    # Convert budget to FPL units (e.g., £1.0m → 10)
    budget *= 10

    # Create binary indicators for current squad
    df["in_current_squad"] = df["element"].isin(current_squad_ids)

    players_not_in_squad = df[~df["in_current_squad"]]

    players_details = []

    # If you want to see the players' details (e.g., their names, IDs, etc.):
    for _, p in players_not_in_squad.iterrows():

        # Append the player details to the list
        players_details.append(
            {
                "player_id": p["element"],
                "player_name": p["web_name"],
                "position": p["element_type"],
                "price": p["now_cost"]
                / 10,  # Convert back to FPL price units (e.g., £6.5m → 6.5)
            }
        )

    # Save the player details to a JSON file
    with open("players_not_in_squad.json", "w") as f:
        json.dump(players_details, f, indent=4)

    if len(df[df["in_current_squad"]]) != 15:
        raise ValueError("Current squad must contain exactly 15 players")

    # Calculate sale prices for current squad players
    def get_sale_price(row):
        return calculate_sale_price(
            playerId=row["element"], managersTransfers=managers_transfers, playerData=df
        )

    df["sell_price"] = df[df["in_current_squad"]].apply(get_sale_price, axis=1)
    # For players not in current squad, sale price is irrelevant (set to 0)
    df.loc[~df["in_current_squad"], "sell_price"] = 0

    # Initialize the problem
    prob = pulp.LpProblem("TransferOptimization", pulp.LpMaximize)

    # Decision variables
    players = df.index
    x = pulp.LpVariable.dicts(
        "select", players, cat="Binary"
    )  # 1 if selected in final squad

    # Objective function: maximize net points gain
    prob += pulp.lpSum(x[i] * df.loc[i, "total_points"] for i in players)

    # Constraints

    # 1. Squad size must be 15
    prob += pulp.lpSum(x[i] for i in players) == 15, "SquadSizeConstraint"

    # 2. Transfer balance (transfers in = transfers out)
    transfers_in = pulp.lpSum(
        x[i] for i in players if not df.loc[i, "in_current_squad"]
    )
    transfers_out = pulp.lpSum(
        1 - x[i] for i in players if df.loc[i, "in_current_squad"]
    )

    # Number of transfers must be between 1 and max_transfers
    prob += transfers_in == transfers_out, "TransferBalance"
    prob += transfers_in >= 1, "MinOneTransfer"
    prob += transfers_in <= max_transfers, "MaxTransfers"

    # 3. Budget constraint
    prob += (
        pulp.lpSum(
            x[i] * df.loc[i, "value"]
            for i in players
            if not df.loc[i, "in_current_squad"]
        )
        - pulp.lpSum(
            (1 - x[i]) * df.loc[i, "sell_price"]
            for i in players
            if df.loc[i, "in_current_squad"]
        )
    ) <= budget, "BudgetConstraint"

    # 4. Position requirements
    # 2 GKs, 5 DEFs, 5 MIDs, 3 FWDs
    prob += (
        pulp.lpSum(x[i] for i in players if df.loc[i, "element_type"] == 1) == 2,
        "GKRequirement",
    )
    prob += (
        pulp.lpSum(x[i] for i in players if df.loc[i, "element_type"] == 2) == 5,
        "DEFRequirement",
    )
    prob += (
        pulp.lpSum(x[i] for i in players if df.loc[i, "element_type"] == 3) == 5,
        "MIDRequirement",
    )
    prob += (
        pulp.lpSum(x[i] for i in players if df.loc[i, "element_type"] == 4) == 3,
        "FWDRequirement",
    )

    # 5. Team limit (max 3 players per team)
    teams = df["team"].unique()
    for team in teams:
        team_players = df[df["team"] == team].index
        prob += pulp.lpSum(x[i] for i in team_players) <= 3, f"TeamLimit_{team}"

    # Solve the problem
    prob.solve(pulp.PULP_CBC_CMD(msg=False))

    if prob.status != pulp.LpStatusOptimal:
        raise ValueError("Optimization failed to find an optimal solution")

    # Process results
    df["in_final_squad"] = [pulp.value(x[i]) == 1 for i in players]

    # Identify transfers
    df["transfer_in"] = df["in_final_squad"] & ~df["in_current_squad"]
    df["transfer_out"] = ~df["in_final_squad"] & df["in_current_squad"]

    # Get transfer players
    transfers_in = df[df["transfer_in"]]["element"].tolist()
    transfers_out = df[df["transfer_out"]]["element"].tolist()

    # Create transfer pairs with point gains and costs
    transfer_pairs: List[Dict] = []
    for in_player, out_player in zip(transfers_in, transfers_out):
        in_data = df[df["element"] == in_player].iloc[0]
        out_data = df[df["element"] == out_player].iloc[0]

        transfer_pairs.append(
            {
                "transferIn": in_player,
                "transferOut": out_player,
                "gain": float(in_data["total_points"] - out_data["total_points"]),
                "cost": float(in_data["value"] - out_data["value"]),  # Convert to £m
                "playerIn_name": in_data.get("web_name", str(in_player)),
                "playerOut_name": out_data.get("web_name", str(out_player)),
                "transferIn_metrics": {
                    target: in_data.get(f"{target}_points", 0) for target in targets
                },
                "transferOut_metrics": {
                    target: out_data.get(f"{target}_points", 0) for target in targets
                },
            }
        )

    # Calculate transfer costs and points
    transfer_in_cost = df[df["transfer_in"]]["value"].sum()
    transfer_out_value = df[df["transfer_out"]]["value"].sum()
    net_cost = (transfer_in_cost - transfer_out_value) / 10  # Convert to £m

    # Calculate points gain
    original_points = df[df["in_current_squad"]]["total_points"].sum()
    new_points = df[df["in_final_squad"]]["total_points"].sum()
    points_gain = new_points - original_points

    # Prepare return dictionary
    result = {
        "transfer_pairs": transfer_pairs,
        "optimized_squad": df,
        "net_cost": net_cost,
        "points_gain": points_gain,
        "num_transfers": len(transfer_pairs),
        "total_cost": transfer_in_cost / 10,
        "total_sale_value": transfer_out_value / 10,
    }

    # Log results
    logging.info(f"Optimal transfers found with {len(transfer_pairs)} transfers")
    logging.info(f"Net cost: £{net_cost:.1f}m")
    logging.info(f"Points gain: {points_gain:.1f}")
    logging.info("Transfer pairs:")
    for pair in transfer_pairs:
        logging.info(
            f"  {pair['playerIn_name']} (IN) for {pair['playerOut_name']} (OUT): "
            f"+{pair['gain']:.1f} pts, £{pair['cost']:.1f}m"
        )

    return result


def calculate_sale_price(
    playerId: int, managersTransfers: pd.DataFrame, playerData: pd.DataFrame
) -> int:
    """Calculate sale price using FPL's 10x scaled values and profit rules."""
    # Get current price in FPL units (e.g., 52 = £5.2m)
    currentPrice = playerData.loc[playerId, "value"]

    # Filter and sort transfers for this player
    playerTransfers = managersTransfers[
        managersTransfers["element_in"] == playerId
    ].sort_values("time", ascending=False)

    if playerTransfers.empty:
        # No transfer history - assume bought at current price
        purchasePrice = currentPrice
    else:
        # Get most recent purchase price from first row
        mostRecentTransfer = playerTransfers.iloc[0]
        purchasePrice = mostRecentTransfer["element_in_cost"]

    # Calculate price difference in FPL units
    priceDiff = currentPrice - purchasePrice

    if priceDiff <= 0:
        # No profit if price has not risen
        return currentPrice

    # Calculate profit using FPL's "£0.1m profit per £0.2m rise" rule
    profit = priceDiff // 2  # Integer division for FPL units
    salePrice = purchasePrice + profit

    return salePrice
