export type PlayerMetrics = {
    [metricName: string]: number;
};

export type Transfer = {
    cost: number;
    gain: number;
    playerIn_name: string;
    playerOut_name: string;
    transferIn: number;
    transferOut: number;
    transferIn_metrics: PlayerMetrics;
    transferOut_metrics: PlayerMetrics;
};

export type TransferResponse = {
    pairs: Transfer[];
    cost: number;
    gain: number;
};
