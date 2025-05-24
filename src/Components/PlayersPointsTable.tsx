import { Table, Text, Badge, Group, Box } from "@mantine/core";

import { IconChevronUp, IconChevronDown, IconArrowsSort } from "@tabler/icons-react";
import { useState } from "react";


 type PlayerMetrics = {
    [metricName: string]: number;
};

type PlayerData = {
    id: number;
    name: string;
    position: number;
    team: number;
    fixtures: any[];
    metrics: PlayerMetrics;
};

type TransferPair = {
    transferIn: PlayerData;
    transferOut: PlayerData;
    gain: number;
};

export const PlayersPointsTable: React.FC<{ players: PlayerData[] }> = ({
    players,
}) => {
    const [sortBy, setSortBy] = useState<keyof PlayerData | string>("name");
    const [reverseSort, setReverseSort] = useState(false);

    const metricKeys = Array.from(
        new Set(players.flatMap((player) => Object.keys(player.metrics))),
    );

    const sortData = (
        data: PlayerData[],
        payload: { sortBy: string; reverse: boolean },
    ) => {
        const sorted = [...data].sort((a, b) => {
            const aValue =
                payload.sortBy === "totalPoints"
                    ? Object.values(a.metrics).reduce((sum, v) => sum + v, 0)
                    : payload.sortBy in a.metrics
                      ? a.metrics[payload.sortBy]
                      : a[payload.sortBy as keyof PlayerData];

            const bValue =
                payload.sortBy === "totalPoints"
                    ? Object.values(b.metrics).reduce((sum, v) => sum + v, 0)
                    : payload.sortBy in b.metrics
                      ? b.metrics[payload.sortBy]
                      : b[payload.sortBy as keyof PlayerData];

            if (typeof aValue === "number" && typeof bValue === "number") {
                return aValue - bValue;
            }
            return String(aValue).localeCompare(String(bValue));
        });

        return payload.reverse ? sorted.reverse() : sorted;
    };

    const handleSort = (field: string) => {
        const reversed = field === sortBy ? !reverseSort : false;
        setReverseSort(reversed);
        setSortBy(field);
    };

    const sortedPlayers = sortData(players, { sortBy, reverse: reverseSort });

    return (
        <Box>
            <Table striped highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th
                            style={{ cursor: "pointer" }}
                            onClick={() => handleSort("name")}
                        >
                            <Group gap="xs">
                                Player
                                {sortBy === "name" &&
                                    (reverseSort ? (
                                        <IconChevronUp size={14} />
                                    ) : (
                                        <IconChevronDown size={14} />
                                    ))}
                                {sortBy !== "name" && (
                                    <IconArrowsSort size={14} />
                                )}
                            </Group>
                        </Table.Th>

                        <Table.Th
                            style={{ cursor: "pointer" }}
                            onClick={() => handleSort("totalPoints")}
                        >
                            <Group gap="xs">
                                Total Points
                                {sortBy === "totalPoints" &&
                                    (reverseSort ? (
                                        <IconChevronUp size={14} />
                                    ) : (
                                        <IconChevronDown size={14} />
                                    ))}
                                {sortBy !== "totalPoints" && (
                                    <IconArrowsSort size={14} />
                                )}
                            </Group>
                        </Table.Th>

                        {metricKeys.map((metric) => (
                            <Table.Th
                                key={metric}
                                style={{ cursor: "pointer" }}
                                onClick={() => handleSort(metric)}
                            >
                                <Group gap="xs">
                                    {metric.replace(/_/g, " ")}
                                    {sortBy === metric &&
                                        (reverseSort ? (
                                            <IconChevronUp size={14} />
                                        ) : (
                                            <IconChevronDown size={14} />
                                        ))}
                                    {sortBy !== metric && (
                                        <IconArrowsSort size={14} />
                                    )}
                                </Group>
                            </Table.Th>
                        ))}
                    </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                    {sortedPlayers.map((player) => (
                        <Table.Tr key={player.id}>
                            <Table.Td>{player.name}</Table.Td>
                            <Table.Td>
                                <Badge variant="filled" color="blue">
                                    {Object.values(player.metrics)
                                        .reduce((sum, v) => sum + v, 0)
                                        .toFixed(2)}
                                </Badge>
                            </Table.Td>
                            {metricKeys.map((metric) => (
                                <Table.Td key={metric}>
                                    {player.metrics[metric]?.toFixed(2) ||
                                        "0.00"}
                                </Table.Td>
                            ))}
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </Box>
    );
};