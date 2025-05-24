import React, { useMemo, useState } from "react";
import { Fixture } from "../Types/Fixture";
import {
    Paper,
    Text,
    Group,
    SimpleGrid,
    Badge,
    Tooltip,
    Title,
    ScrollArea,
    Stack,
    Modal,
    Table,
    Divider,
    Center,
    Box,
} from "@mantine/core";
import { GeneralInformation } from "../Types/GeneralInformation";

interface TeamFixtureCalendarProps {
    fixtures: Fixture[];
    getTeamName: (id: number) => string;
    selectedTeam: number | null;
    colorScheme: string;
    generalInfo: GeneralInformation;
}

// Helper to group fixtures by gameweek
const groupFixturesByGameweek = (fixtures: Fixture[]) => {
    const grouped: Record<number, Fixture[]> = {};

    fixtures.forEach((fixture) => {
        if (fixture.event) {
            if (!grouped[fixture.event]) {
                grouped[fixture.event] = [];
            }
            grouped[fixture.event].push(fixture);
        }
    });

    return grouped;
};

// Helper to get difficulty color
const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "green";
    if (difficulty === 3) return "yellow";
    if (difficulty === 4) return "orange";
    return "red";
};

export const TeamFixtureCalendar: React.FC<TeamFixtureCalendarProps> = ({
    fixtures,
    getTeamName,
    selectedTeam,
    colorScheme,
    generalInfo,
}) => {
    const players = generalInfo.elements;
    // State for match stats modal
    const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(
        null,
    );
    const [statsModalOpen, setStatsModalOpen] = useState(false);

    // Group fixtures by gameweek
    const fixturesByGameweek = useMemo(
        () => groupFixturesByGameweek(fixtures),
        [fixtures],
    );

    // Get all gameweeks in order
    const gameweeks = useMemo(
        () =>
            Object.keys(fixturesByGameweek)
                .map(Number)
                .sort((a, b) => a - b),
        [fixturesByGameweek],
    );

    // Handle fixture click to show match stats
    const handleFixtureClick = (fixture: Fixture) => {
        setSelectedFixture(fixture);
        setStatsModalOpen(true);
    };

    // Helper to format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Render a fixture card
    const renderFixtureCard = (fixture: Fixture) => {
        const isHome = selectedTeam === fixture.team_h;
        const isAway = selectedTeam === fixture.team_a;
        const isSelected = isHome || isAway;

        // Determine which difficulty to show based on the selected team
        let difficultyToShow = 0;
        if (isHome) {
            difficultyToShow = fixture.team_h_difficulty;
        } else if (isAway) {
            difficultyToShow = fixture.team_a_difficulty;
        }

        return (
            <Paper
                p="xs"
                radius="md"
                withBorder
                style={{
                    borderLeft: isSelected
                        ? `4px solid ${getDifficultyColor(difficultyToShow)}`
                        : undefined,
                    backgroundColor:
                        colorScheme === "dark"
                            ? undefined
                            : isSelected
                              ? "#f8f9fa"
                              : undefined,
                    cursor: "pointer",
                }}
                onClick={() => handleFixtureClick(fixture)}
            >
                <Tooltip
                    label="Click for match details"
                    position="top"
                    withArrow
                >
                    <div>
                        <Group style={{ justifyContent: "space-between" }}>
                            <Text size="sm" fw={isHome ? 700 : 400}>
                                {getTeamName(fixture.team_h).substring(0, 15)}
                                {getTeamName(fixture.team_h).length > 15
                                    ? "..."
                                    : ""}
                            </Text>
                            {fixture.finished && (
                                <Text size="sm" fw={600}>
                                    {fixture.team_h_score}
                                </Text>
                            )}
                        </Group>

                        <Group style={{ justifyContent: "space-between" }}>
                            <Text size="sm" fw={isAway ? 700 : 400}>
                                {getTeamName(fixture.team_a).substring(0, 15)}
                                {getTeamName(fixture.team_a).length > 15
                                    ? "..."
                                    : ""}
                            </Text>
                            {fixture.finished && (
                                <Text size="sm" fw={600}>
                                    {fixture.team_a_score}
                                </Text>
                            )}
                        </Group>

                        <Group
                            mt={5}
                            align="center"
                            style={{ justifyContent: "space-between" }}
                        >
                            <Text size="xs" c="dimmed">
                                {fixture.kickoff_time
                                    ? new Date(
                                          fixture.kickoff_time,
                                      ).toLocaleDateString(undefined, {
                                          month: "short",
                                          day: "numeric",
                                      })
                                    : "TBD"}
                            </Text>

                            {isSelected && (
                                <Badge
                                    color={getDifficultyColor(difficultyToShow)}
                                    size="xs"
                                >
                                    {difficultyToShow}
                                </Badge>
                            )}

                            {fixture.finished && (
                                <Badge color="green" size="xs">
                                    FT
                                </Badge>
                            )}
                            {fixture.started && !fixture.finished && (
                                <Badge color="blue" size="xs">
                                    Live
                                </Badge>
                            )}
                        </Group>
                    </div>
                </Tooltip>
            </Paper>
        );
    };

    // Render a gameweek column
    const renderGameweekColumn = (gameweek: number) => {
        const gameweekFixtures = fixturesByGameweek[gameweek] || [];

        return (
            <div key={gameweek}>
                <Badge size="lg" variant="filled" mb="xs">
                    GW {gameweek}
                </Badge>

                <Stack>
                    {gameweekFixtures.map((fixture) => (
                        <div key={fixture.id}>{renderFixtureCard(fixture)}</div>
                    ))}

                    {gameweekFixtures.length === 0 && (
                        <Paper p="xs" withBorder radius="md">
                            <Text size="xs" c="dimmed" ta="center">
                                No fixtures
                            </Text>
                        </Paper>
                    )}
                </Stack>
            </div>
        );
    };

    // Render match stats modal content
    const renderMatchStatsModal = () => {
        if (!selectedFixture) return null;

        const homeTeamName = getTeamName(selectedFixture.team_h);
        const awayTeamName = getTeamName(selectedFixture.team_a);

        return (
            <Modal
                opened={statsModalOpen}
                onClose={() => setStatsModalOpen(false)}
                title={
                    <Title
                        order={3}
                        style={{ textAlign: "center", width: "100%" }}
                    >
                        {homeTeamName} vs {awayTeamName}
                    </Title>
                }
                size="lg"
                styles={{
                    header: {
                        justifyContent: "center",
                        width: "100%",
                    },
                    title: {
                        width: "100%",
                    },
                }}
            >
                <Stack>
                    {/* Match info */}
                    <Group style={{ justifyContent: "center" }}>
                        <div style={{ textAlign: "center" }}>
                            <Text size="sm" fw={500} c="dimmed">
                                Gameweek {selectedFixture.event}
                            </Text>
                            {selectedFixture.kickoff_time && (
                                <Text size="sm" style={{ textAlign: "center" }}>
                                    {formatDate(selectedFixture.kickoff_time)}
                                </Text>
                            )}
                        </div>

                        {selectedFixture.finished ? (
                            <Badge color="green" size="lg">
                                Full Time
                            </Badge>
                        ) : selectedFixture.started ? (
                            <Badge color="blue" size="lg">
                                In Progress
                            </Badge>
                        ) : (
                            <Badge color="gray" size="lg">
                                Upcoming
                            </Badge>
                        )}
                    </Group>

                    {/* Score display for finished or in-progress matches */}
                    {(selectedFixture.finished || selectedFixture.started) && (
                        <Paper p="md" withBorder radius="md">
                            <Group
                                align="center"
                                style={{ justifyContent: "center" }}
                            >
                                <Stack
                                    align="center"
                                    style={{ textAlign: "center" }}
                                >
                                    <Text fw={700} size="xl">
                                        {homeTeamName}
                                    </Text>
                                    <Text c="dimmed" size="sm">
                                        (Home)
                                    </Text>
                                </Stack>

                                <Group style={{ justifyContent: "center" }}>
                                    <Text size="xl" fw={700}>
                                        {selectedFixture.team_h_score}
                                    </Text>
                                    <Text size="xl">-</Text>
                                    <Text size="xl" fw={700}>
                                        {selectedFixture.team_a_score}
                                    </Text>
                                </Group>

                                <Stack
                                    align="center"
                                    style={{ textAlign: "center" }}
                                >
                                    <Text fw={700} size="xl">
                                        {awayTeamName}
                                    </Text>
                                    <Text c="dimmed" size="sm">
                                        (Away)
                                    </Text>
                                </Stack>
                            </Group>
                        </Paper>
                    )}

                    {/* Match stats */}
                    {selectedFixture.finished && selectedFixture.stats && (
                        <>
                            <Divider
                                label="Match Statistics"
                                labelPosition="center"
                            />

                            {/* Goals */}
                            {selectedFixture.stats.find(
                                (s) => s.identifier === "goals_scored",
                            ) && (
                                <Box>
                                    <Text
                                        fw={500}
                                        mb="xs"
                                        style={{ textAlign: "center" }}
                                    >
                                        Goals
                                    </Text>
                                    <Table style={{ margin: "0 auto" }}>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {homeTeamName}
                                                </Table.Th>
                                                <Table.Th
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {awayTeamName}
                                                </Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            <Table.Tr>
                                                <Table.Td
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {selectedFixture.stats
                                                        .find(
                                                            (s) =>
                                                                s.identifier ===
                                                                "goals_scored",
                                                        )
                                                        ?.h.map(
                                                            (player, idx) => (
                                                                <Text
                                                                    key={idx}
                                                                    size="sm"
                                                                    style={{
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {
                                                                        players.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.id ===
                                                                                player.element,
                                                                        )
                                                                            ?.web_name
                                                                    }{" "}
                                                                    ×{" "}
                                                                    {
                                                                        player.value
                                                                    }
                                                                </Text>
                                                            ),
                                                        )}
                                                    {selectedFixture.stats.find(
                                                        (s) =>
                                                            s.identifier ===
                                                            "goals_scored",
                                                    )?.h.length === 0 && (
                                                        <Text
                                                            size="sm"
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            -
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                                <Table.Td
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {selectedFixture.stats
                                                        .find(
                                                            (s) =>
                                                                s.identifier ===
                                                                "goals_scored",
                                                        )
                                                        ?.a.map(
                                                            (player, idx) => (
                                                                <Text
                                                                    key={idx}
                                                                    size="sm"
                                                                    style={{
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {
                                                                        players.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.id ===
                                                                                player.element,
                                                                        )
                                                                            ?.web_name
                                                                    }{" "}
                                                                    ×{" "}
                                                                    {
                                                                        player.value
                                                                    }
                                                                </Text>
                                                            ),
                                                        )}
                                                    {selectedFixture.stats.find(
                                                        (s) =>
                                                            s.identifier ===
                                                            "goals_scored",
                                                    )?.a.length === 0 && (
                                                        <Text
                                                            size="sm"
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            -
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        </Table.Tbody>
                                    </Table>
                                </Box>
                            )}

                            {/* Assists */}
                            {selectedFixture.stats.find(
                                (s) => s.identifier === "assists",
                            ) && (
                                <Box>
                                    <Text
                                        fw={500}
                                        mb="xs"
                                        style={{ textAlign: "center" }}
                                    >
                                        Assists
                                    </Text>
                                    <Table style={{ margin: "0 auto" }}>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {homeTeamName}
                                                </Table.Th>
                                                <Table.Th
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {awayTeamName}
                                                </Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            <Table.Tr>
                                                <Table.Td
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {selectedFixture.stats
                                                        .find(
                                                            (s) =>
                                                                s.identifier ===
                                                                "assists",
                                                        )
                                                        ?.h.map(
                                                            (player, idx) => (
                                                                <Text
                                                                    key={idx}
                                                                    size="sm"
                                                                    style={{
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {
                                                                        players.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.id ===
                                                                                player.element,
                                                                        )
                                                                            ?.web_name
                                                                    }{" "}
                                                                    ×{" "}
                                                                    {
                                                                        player.value
                                                                    }
                                                                </Text>
                                                            ),
                                                        )}
                                                    {selectedFixture.stats.find(
                                                        (s) =>
                                                            s.identifier ===
                                                            "assists",
                                                    )?.h.length === 0 && (
                                                        <Text
                                                            size="sm"
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            -
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                                <Table.Td
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {selectedFixture.stats
                                                        .find(
                                                            (s) =>
                                                                s.identifier ===
                                                                "assists",
                                                        )
                                                        ?.a.map(
                                                            (player, idx) => (
                                                                <Text
                                                                    key={idx}
                                                                    size="sm"
                                                                    style={{
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {
                                                                        players.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.id ===
                                                                                player.element,
                                                                        )
                                                                            ?.web_name
                                                                    }{" "}
                                                                    ×{" "}
                                                                    {
                                                                        player.value
                                                                    }
                                                                </Text>
                                                            ),
                                                        )}
                                                    {selectedFixture.stats.find(
                                                        (s) =>
                                                            s.identifier ===
                                                            "assists",
                                                    )?.a.length === 0 && (
                                                        <Text
                                                            size="sm"
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            -
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        </Table.Tbody>
                                    </Table>
                                </Box>
                            )}

                            {/* Yellow cards */}
                            {selectedFixture.stats.find(
                                (s) => s.identifier === "yellow_cards",
                            ) && (
                                <Box>
                                    <Text
                                        fw={500}
                                        mb="xs"
                                        style={{ textAlign: "center" }}
                                    >
                                        Yellow Cards
                                    </Text>
                                    <Table style={{ margin: "0 auto" }}>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {homeTeamName}
                                                </Table.Th>
                                                <Table.Th
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {awayTeamName}
                                                </Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            <Table.Tr>
                                                <Table.Td
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {selectedFixture.stats
                                                        .find(
                                                            (s) =>
                                                                s.identifier ===
                                                                "yellow_cards",
                                                        )
                                                        ?.h.map(
                                                            (player, idx) => (
                                                                <Text
                                                                    key={idx}
                                                                    size="sm"
                                                                    style={{
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {
                                                                        players.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.id ===
                                                                                player.element,
                                                                        )
                                                                            ?.web_name
                                                                    }
                                                                </Text>
                                                            ),
                                                        )}
                                                    {selectedFixture.stats.find(
                                                        (s) =>
                                                            s.identifier ===
                                                            "yellow_cards",
                                                    )?.h.length === 0 && (
                                                        <Text
                                                            size="sm"
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            -
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                                <Table.Td
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {selectedFixture.stats
                                                        .find(
                                                            (s) =>
                                                                s.identifier ===
                                                                "yellow_cards",
                                                        )
                                                        ?.a.map(
                                                            (player, idx) => (
                                                                <Text
                                                                    key={idx}
                                                                    size="sm"
                                                                    style={{
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {
                                                                        players.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.id ===
                                                                                player.element,
                                                                        )
                                                                            ?.web_name
                                                                    }
                                                                </Text>
                                                            ),
                                                        )}
                                                    {selectedFixture.stats.find(
                                                        (s) =>
                                                            s.identifier ===
                                                            "yellow_cards",
                                                    )?.a.length === 0 && (
                                                        <Text
                                                            size="sm"
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            -
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        </Table.Tbody>
                                    </Table>
                                </Box>
                            )}

                            {/* Red cards */}
                            {selectedFixture.stats.find(
                                (s) => s.identifier === "red_cards",
                            ) && (
                                <Box>
                                    <Text
                                        fw={500}
                                        mb="xs"
                                        style={{ textAlign: "center" }}
                                    >
                                        Red Cards
                                    </Text>
                                    <Table style={{ margin: "0 auto" }}>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {homeTeamName}
                                                </Table.Th>
                                                <Table.Th
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {awayTeamName}
                                                </Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            <Table.Tr>
                                                <Table.Td
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {selectedFixture.stats
                                                        .find(
                                                            (s) =>
                                                                s.identifier ===
                                                                "red_cards",
                                                        )
                                                        ?.h.map(
                                                            (player, idx) => (
                                                                <Text
                                                                    key={idx}
                                                                    size="sm"
                                                                    style={{
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {
                                                                        players.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.id ===
                                                                                player.element,
                                                                        )
                                                                            ?.web_name
                                                                    }
                                                                </Text>
                                                            ),
                                                        )}
                                                    {selectedFixture.stats.find(
                                                        (s) =>
                                                            s.identifier ===
                                                            "red_cards",
                                                    )?.h.length === 0 && (
                                                        <Text
                                                            size="sm"
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            -
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                                <Table.Td
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {selectedFixture.stats
                                                        .find(
                                                            (s) =>
                                                                s.identifier ===
                                                                "red_cards",
                                                        )
                                                        ?.a.map(
                                                            (player, idx) => (
                                                                <Text
                                                                    key={idx}
                                                                    size="sm"
                                                                    style={{
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {
                                                                        players.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.id ===
                                                                                player.element,
                                                                        )
                                                                            ?.web_name
                                                                    }
                                                                </Text>
                                                            ),
                                                        )}
                                                    {selectedFixture.stats.find(
                                                        (s) =>
                                                            s.identifier ===
                                                            "red_cards",
                                                    )?.a.length === 0 && (
                                                        <Text
                                                            size="sm"
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            -
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        </Table.Tbody>
                                    </Table>
                                </Box>
                            )}

                            {/* Bonus points */}
                            {selectedFixture.stats.find(
                                (s) => s.identifier === "bonus",
                            ) && (
                                <Box>
                                    <Text
                                        fw={500}
                                        mb="xs"
                                        style={{ textAlign: "center" }}
                                    >
                                        Bonus Points
                                    </Text>
                                    <Table style={{ margin: "0 auto" }}>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {homeTeamName}
                                                </Table.Th>
                                                <Table.Th
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {awayTeamName}
                                                </Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            <Table.Tr>
                                                <Table.Td
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {selectedFixture.stats
                                                        .find(
                                                            (s) =>
                                                                s.identifier ===
                                                                "bonus",
                                                        )
                                                        ?.h.map(
                                                            (player, idx) => (
                                                                <Text
                                                                    key={idx}
                                                                    size="sm"
                                                                    style={{
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {
                                                                        players.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.id ===
                                                                                player.element,
                                                                        )
                                                                            ?.web_name
                                                                    }
                                                                    :{" "}
                                                                    {
                                                                        player.value
                                                                    }{" "}
                                                                    pts
                                                                </Text>
                                                            ),
                                                        )}
                                                    {selectedFixture.stats.find(
                                                        (s) =>
                                                            s.identifier ===
                                                            "bonus",
                                                    )?.h.length === 0 && (
                                                        <Text
                                                            size="sm"
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            -
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                                <Table.Td
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {selectedFixture.stats
                                                        .find(
                                                            (s) =>
                                                                s.identifier ===
                                                                "bonus",
                                                        )
                                                        ?.a.map(
                                                            (player, idx) => (
                                                                <Text
                                                                    key={idx}
                                                                    size="sm"
                                                                    style={{
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {
                                                                        players.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.id ===
                                                                                player.element,
                                                                        )
                                                                            ?.web_name
                                                                    }
                                                                    :{" "}
                                                                    {
                                                                        player.value
                                                                    }{" "}
                                                                    pts
                                                                </Text>
                                                            ),
                                                        )}
                                                    {selectedFixture.stats.find(
                                                        (s) =>
                                                            s.identifier ===
                                                            "bonus",
                                                    )?.a.length === 0 && (
                                                        <Text
                                                            size="sm"
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            -
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        </Table.Tbody>
                                    </Table>
                                </Box>
                            )}

                            {/* Saves */}
                            {/* Saves */}
                            {selectedFixture.stats.find(
                                (s) => s.identifier === "saves",
                            ) && (
                                <Box>
                                    <Text
                                        fw={500}
                                        mb="xs"
                                        style={{ textAlign: "center" }}
                                    >
                                        Saves
                                    </Text>
                                    <Table style={{ margin: "0 auto" }}>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {homeTeamName}
                                                </Table.Th>
                                                <Table.Th
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {awayTeamName}
                                                </Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            <Table.Tr>
                                                <Table.Td
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {selectedFixture.stats
                                                        .find(
                                                            (s) =>
                                                                s.identifier ===
                                                                "saves",
                                                        )
                                                        ?.h.map(
                                                            (player, idx) => (
                                                                <Text
                                                                    key={idx}
                                                                    size="sm"
                                                                    style={{
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {
                                                                        players.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.id ===
                                                                                player.element,
                                                                        )
                                                                            ?.web_name
                                                                    }
                                                                    :{" "}
                                                                    {
                                                                        player.value
                                                                    }{" "}
                                                                    saves
                                                                </Text>
                                                            ),
                                                        )}
                                                    {selectedFixture.stats.find(
                                                        (s) =>
                                                            s.identifier ===
                                                            "saves",
                                                    )?.h.length === 0 && (
                                                        <Text
                                                            size="sm"
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            -
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                                <Table.Td
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {selectedFixture.stats
                                                        .find(
                                                            (s) =>
                                                                s.identifier ===
                                                                "saves",
                                                        )
                                                        ?.a.map(
                                                            (player, idx) => (
                                                                <Text
                                                                    key={idx}
                                                                    size="sm"
                                                                    style={{
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {
                                                                        players.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.id ===
                                                                                player.element,
                                                                        )
                                                                            ?.web_name
                                                                    }
                                                                    :{" "}
                                                                    {
                                                                        player.value
                                                                    }{" "}
                                                                    saves
                                                                </Text>
                                                            ),
                                                        )}
                                                    {selectedFixture.stats.find(
                                                        (s) =>
                                                            s.identifier ===
                                                            "saves",
                                                    )?.a.length === 0 && (
                                                        <Text
                                                            size="sm"
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            -
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        </Table.Tbody>
                                    </Table>
                                </Box>
                            )}
                        </>
                    )}

                    {/* Fixture Difficulty */}
                    <Divider
                        label="Fixture Difficulty"
                        labelPosition="center"
                    />
                    <Group grow>
                        <Paper p="md" withBorder>
                            <Center>
                                <Stack align="center">
                                    <Text fw={500}>{homeTeamName}</Text>
                                    <Badge
                                        size="xl"
                                        color={getDifficultyColor(
                                            selectedFixture.team_h_difficulty,
                                        )}
                                    >
                                        {selectedFixture.team_h_difficulty}
                                    </Badge>
                                    <Text size="sm" c="dimmed">
                                        Difficulty Rating
                                    </Text>
                                </Stack>
                            </Center>
                        </Paper>

                        <Paper p="md" withBorder>
                            <Center>
                                <Stack align="center">
                                    <Text fw={500}>{awayTeamName}</Text>
                                    <Badge
                                        size="xl"
                                        color={getDifficultyColor(
                                            selectedFixture.team_a_difficulty,
                                        )}
                                    >
                                        {selectedFixture.team_a_difficulty}
                                    </Badge>
                                    <Text size="sm" c="dimmed">
                                        Difficulty Rating
                                    </Text>
                                </Stack>
                            </Center>
                        </Paper>
                    </Group>
                </Stack>
            </Modal>
        );
    };

    return (
        <div>
            <Title order={4} mb="md">
                Fixture Calendar
            </Title>
            <Text size="sm" c="dimmed" mb="lg">
                Color-coded by difficulty.{" "}
                {selectedTeam
                    ? `${getTeamName(selectedTeam)}'s games are highlighted.`
                    : "Select a team to highlight their fixtures."}
                Click on any fixture card to view detailed match statistics.
            </Text>

            <Paper p="md" withBorder radius="md">
                {fixtures.length > 0 ? (
                    <ScrollArea>
                        <div style={{ minWidth: gameweeks.length * 180 }}>
                            <SimpleGrid cols={gameweeks.length} spacing="md">
                                {gameweeks.map((gw) =>
                                    renderGameweekColumn(gw),
                                )}
                            </SimpleGrid>
                        </div>
                    </ScrollArea>
                ) : (
                    <Text ta="center" c="dimmed">
                        No fixtures found matching the current filters
                    </Text>
                )}
            </Paper>

            <Group mt="md" spacing="xs">
                {selectedTeam && (
                    <>
                        <Text size="sm">Difficulty rating:</Text>
                        <Badge color="green">Easy</Badge>
                        <Badge color="yellow">Medium</Badge>
                        <Badge color="orange">Hard</Badge>
                        <Badge color="red">Very Hard</Badge>
                    </>
                )}
                <Text size="sm">Match status:</Text>
                <Badge color="green" size="sm">
                    FT
                </Badge>
                <Text size="xs">Finished</Text>
                <Badge color="blue" size="sm">
                    Live
                </Badge>
                <Text size="xs">In Progress</Text>
            </Group>

            {/* Render the match stats modal */}
            {renderMatchStatsModal()}
        </div>
    );
};
