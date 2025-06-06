export type PredictionResponseElement = {
    element: number;
    team: number;
    was_home: boolean;
    element_type: number;
    selected: number;
    minutes_rolling_3: number;
    minutes_rolling_5: number;
    minutes_season_total: number;
    assists: number;
    assists_points: number;
    assists_rolling_3: number;
    assists_rolling_5: number;
    assists_season_total: number;
    bonus: number;
    bonus_rolling_3: number;
    bonus_rolling_5: number;
    bonus_season_total: number;
    clean_sheets: number;
    clean_sheets_points: number;
    clean_sheets_rolling_3: number;
    clean_sheets_rolling_5: number;
    clean_sheets_season_total: number;
    expected_assists: number;
    expected_assists_rolling_3: number;
    expected_assists_rolling_5: number;
    expected_assists_season_total: number;
    expected_goals: number;
    expected_goals_rolling_3: number;
    expected_goals_rolling_5: number;
    expected_goals_season_total: number;
    goals_conceded: number;
    goals_conceded_rolling_3: number;
    goals_conceded_rolling_5: number;
    goals_conceded_season_total: number;
    goals_scored: number;
    goals_scored_points: number;
    goals_scored_rolling_3: number;
    goals_scored_rolling_5: number;
    goals_scored_season_total: number;
    minutes: number;
    minutes_points: number;
    opponent_team: number;
    own_goals: number;
    own_goals_rolling_3: number;
    own_goals_rolling_5: number;
    own_goals_season_total: number;
    penalties_missed: number;
    penalties_missed_rolling_3: number;
    penalties_missed_rolling_5: number;
    penalties_missed_season_total: number;
    penalties_saved: number;
    penalties_saved_rolling_3: number;
    penalties_saved_rolling_5: number;
    penalties_saved_season_total: number;
    red_cards: number;
    red_cards_rolling_3: number;
    red_cards_rolling_5: number;
    red_cards_season_total: number;
    round: number;
    saves: number;
    saves_rolling_3: number;
    saves_rolling_5: number;
    saves_season_total: number;
    starts: number;
    starts_rolling_3: number;
    starts_rolling_5: number;
    starts_season_total: number;
    web_name: string;
    yellow_cards: number;
    yellow_cards_rolling_3: number;
    yellow_cards_rolling_5: number;
    yellow_cards_season_total: number;
    photo:string
    total_points: number
};

export type PredictionResponse = {
    current_target: string;
    elements: PredictionResponseElement[];
};
