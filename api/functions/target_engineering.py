import helpers.data_helpers as dh


def create_shifted_targets(df, target_col, horizon):
    # Create shifted columns for the target
    for i in range(1, horizon + 1):
        df[f"{target_col}_gw+{i}"] = df.groupby("element")[target_col].shift(-i)

    # Sum the shifted columns to create the target
    target_cols = [f"{target_col}_gw+{i}" for i in range(1, horizon + 1)]
    df[f"target_{target_col}"] = df[target_cols].sum(axis=1)

    return df


def create_targets(df, horizon):
    df = df.sort_values(["element", "round"])

    # List of target columns to process
    target_columns = dh.get_targets()

    # create a target for the number of times a player has player 60+ minutes in a horizion
    df["minutes_60+"] = (df["minutes"] >= 60).astype(int)
    target_columns.append("minutes_60+")

    df["minutes_1+"] = (df["minutes"] > 0).astype(int)
    target_columns.append("minutes_1+")

    # Create targets for each column
    for target_col in target_columns:
        df = create_shifted_targets(df, target_col, horizon)

    # Drop intermediate columns (optional)
    intermediate_cols = [
        f"{target_col}_gw+{i}"
        for target_col in target_columns
        for i in range(1, horizon + 1)
    ]
    df = df.drop(columns=intermediate_cols)

    # Drop rows with missing target values
    target_cols = [f"target_{target_col}" for target_col in target_columns]
    df = df.dropna(subset=target_cols)

    return df
