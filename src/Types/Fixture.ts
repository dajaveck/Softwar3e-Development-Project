type StatIdentifier =
    | "goals_scored"
    | "assists"
    | "own_goals"
    | "penalties_saved"
    | "penalties_missed"
    | "yellow_cards"
    | "red_cards"
    | "saves"
    | "bonus"
    | "bps"
    | "mng_underdog_win"
    | "mng_underdog_draw";

type MatchStat = {
    value: number;
    element: number;
};

type MatchStatsEntry = {
    identifier: StatIdentifier;
    a: MatchStat[];
    h: MatchStat[];
};

export type Fixture = {
    code: number;
    event: null;
    finished: boolean;
    finished_provisional: boolean;
    id: number;
    kickoff_time: null;
    minutes: number;
    provisional_start_time: boolean;
    started: null;
    team_a: number;
    team_a_score: null | number;
    team_h: number;
    stats: MatchStatsEntry[]
    team_h_score: null | number;
    team_h_difficulty: number;
    team_a_difficulty: number;
    pulse_id: number;
};
