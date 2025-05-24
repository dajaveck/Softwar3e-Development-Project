import {
    ActionIcon,
    Badge,
    Button,
    Container,
    Grid,
    Group,
    Paper,
    SegmentedControl,
    Select,
    Stack,
    Table,
    Text,
    Title,
    useMantineColorScheme,
    useMantineTheme,
} from "@mantine/core";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";
import { useDataService } from "../Hooks/useDataService";
import { LoadingModal } from "./LoadingModal";

import {
    IconCalendar,
    IconChartLine,
    IconChevronLeft,
    IconChevronRight,
    IconLayoutSidebarLeftCollapse,
    IconLayoutSidebarRightCollapse,
    IconTrophy,
} from "@tabler/icons-react";
import { Fixture } from "../Types/Fixture";
import { TeamFixtureCalendar } from "./TeamFixtureCalendar";

// Type definitions based on your provided fixture type

interface Team {
    id: number;
    name: string;
    short_name: string;
    strength: number;
}

type HomeAway = "all" | "home" | "away";

export const FixtureAnalysisPage: React.FC = () => {
    const theme = useMantineTheme();
    const dispatch = useDispatch();
    const dataService = useDataService();

    const { colorScheme } = useMantineColorScheme();

    // Redux selectors
    const { generalInformation, gameweek, fixtures } = useSelector(
        (state: DefaultRootState) => ({
            generalInformation: state.generalInformation,
            gameweek: state.gameweek,
            fixtures: state.fixtures as Fixture[],
        }),
    );

    // Component state
    const [loading, setLoading] = useState(false);
    const [activeView, setActiveView] = useState<
        "table" | "calendar" | "difficulty"
    >("table");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
    const [filteredFixtures, setFilteredFixtures] = useState<Fixture[]>([]);
    const [fixtureHorizon, setFixtureHorizon] = useState<number>(5);
    const [difficulty, setDifficulty] = useState<number | null>(null);
    const [homeAway, setHomeAway] = useState<HomeAway>("all");

    // Sidebar toggle
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Filter fixtures based on selected team and horizon
    useEffect(() => {
        if (!fixtures) return;

        let filtered = [...fixtures];

        // Filter by gameweek range if we have a gameweek
        if (gameweek) {
            filtered = filtered.filter(
                (fixture) =>
                    fixture.event &&
                    fixture.event >= gameweek &&
                    fixture.event <= gameweek + fixtureHorizon,
            );
        }

        if (difficulty) {
            filtered = filtered.filter(
                (fixture) =>
                    fixture.team_a_difficulty === difficulty ||
                    fixture.team_h_difficulty === difficulty,
            );

            if (homeAway === "home") {
                filtered = filtered.filter(
                    (fixture) => fixture.team_h_difficulty === difficulty,
                );
            } else if (homeAway === "away") {
                filtered = filtered.filter(
                    (fixture) => fixture.team_a_difficulty === difficulty,
                );
            }
        }

        // Filter by selected team if one is selected
        if (selectedTeam) {
            filtered = filtered.filter(
                (fixture) =>
                    fixture.team_h === selectedTeam ||
                    fixture.team_a === selectedTeam,
            );

            // Add home/away filter
            if (homeAway === "home") {
                filtered = filtered.filter(
                    (fixture) =>
                        fixture.team_h === selectedTeam 

                );
            } else if (homeAway === "away") {
                filtered = filtered.filter(
                    (fixture) =>
                        fixture.team_a === selectedTeam 
              
                );
            }
        }

        setFilteredFixtures(filtered);
    }, [
        fixtures,
        selectedTeam,
        gameweek,
        fixtureHorizon,
        difficulty,
        homeAway,
    ]);

    // Get team name by ID helper
    const getTeamName = (teamId: number): string => {
        const team = generalInformation.teams?.find((t) => t.id === teamId);
        return team ? team.name : `Team ${teamId}`;
    };

    // Render difficulty badge based on difficulty value
    const renderDifficultyBadge = (difficulty: number) => {
        console.log(difficulty);
        let color = "blue";
        if (difficulty <= 2) color = "green";
        else if (difficulty === 3) color = "yellow";
        else if (difficulty === 4) color = "orange";
        else if (difficulty >= 5) color = "red";

        return (
            <Badge color={color} variant="filled" size="md">
                {difficulty}
            </Badge>
        );
    };

    // Fixtures Table View
    const renderFixturesTable = () => (
        <Table striped highlightOnHover>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>GW</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Home Team</Table.Th>
                    <Table.Th>Difficulty</Table.Th>
                    <Table.Th>Away Team</Table.Th>
                    <Table.Th>Difficulty</Table.Th>
                    <Table.Th>Status</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {filteredFixtures.length > 0 ? (
                    filteredFixtures.map((fixture) => (
                        <Table.Tr key={fixture.id}>
                            <Table.Td>{fixture.event || "-"}</Table.Td>
                            <Table.Td>
                                {fixture.kickoff_time
                                    ? new Date(
                                          fixture.kickoff_time,
                                      ).toLocaleDateString()
                                    : "TBD"}
                            </Table.Td>
                            <Table.Td>
                                <Text
                                    fw={
                                        selectedTeam === fixture.team_h
                                            ? 700
                                            : 400
                                    }
                                >
                                    {getTeamName(fixture.team_h)}
                                </Text>
                            </Table.Td>
                            <Table.Td>
                                {renderDifficultyBadge(
                                    fixture.team_h_difficulty,
                                )}
                            </Table.Td>
                            <Table.Td>
                                <Text
                                    fw={
                                        selectedTeam === fixture.team_a
                                            ? 700
                                            : 400
                                    }
                                >
                                    {getTeamName(fixture.team_a)}
                                </Text>
                            </Table.Td>
                            <Table.Td>
                                {renderDifficultyBadge(
                                    fixture.team_a_difficulty,
                                )}
                            </Table.Td>
                            <Table.Td>
                                {fixture.finished ? (
                                    <Badge color="green">Finished</Badge>
                                ) : fixture.started ? (
                                    <Badge color="blue">In Progress</Badge>
                                ) : (
                                    <Badge color="gray">Upcoming</Badge>
                                )}
                            </Table.Td>
                        </Table.Tr>
                    ))
                ) : (
                    <Table.Tr>
                        <Table.Td colSpan={7}>
                            <Text ta="center" fz="sm" c="dimmed">
                                No fixtures found matching the current filters
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );

    // Placeholder for TeamFixtureCalendar component
  const renderFixtureCalendar = () => (
      <div>
          <TeamFixtureCalendar
              fixtures={filteredFixtures}
              getTeamName={getTeamName}
              selectedTeam={selectedTeam}
              colorScheme={colorScheme}
              generalInfo={generalInformation}
          />
      </div>
  );

    // Placeholder for FixtureDifficultyChart component

    return (
        <Container
            fluid
            p="md"
            bg={
                colorScheme === "dark"
                    ? theme.colors.dark[8]
                    : theme.colors.gray[0]
            }
        >
            <Stack gap="xl">
                {/* Header Section */}
                <Paper p="md" radius="md" withBorder>
                    <Grid align="center">
                        <Grid.Col span="content">
                            <Group gap="xs">
                                <ActionIcon
                                    variant="subtle"
                                    color={theme.primaryColor}
                                    onClick={() =>
                                        dispatch({
                                            type: "SetGameweek",
                                            gameweek: Math.max(
                                                1,
                                                gameweek! - 1,
                                            ),
                                        })
                                    }
                                    disabled={gameweek === 1}
                                >
                                    <IconChevronLeft size={20} />
                                </ActionIcon>
                                <Title order={2} c={theme.primaryColor}>
                                    Fixture Analysis - Gameweek {gameweek}
                                </Title>
                                <ActionIcon
                                    variant="subtle"
                                    color={theme.primaryColor}
                                    onClick={() =>
                                        dispatch({
                                            type: "SetGameweek",
                                            gameweek: gameweek! + 1,
                                        })
                                    }
                                >
                                    <IconChevronRight size={20} />
                                </ActionIcon>
                            </Group>
                        </Grid.Col>

                        <Grid.Col span="auto">
                            <Group justify="flex-end">
                                <Button
                                    variant="light"
                                    onClick={toggleSidebar}
                                    leftSection={
                                        sidebarOpen ? (
                                            <IconLayoutSidebarLeftCollapse
                                                size={18}
                                            />
                                        ) : (
                                            <IconLayoutSidebarRightCollapse
                                                size={18}
                                            />
                                        )
                                    }
                                    radius="xl"
                                >
                                    {sidebarOpen
                                        ? "Hide Filters"
                                        : "Show Filters"}
                                </Button>
                            </Group>
                        </Grid.Col>
                    </Grid>
                </Paper>

                {/* Team Selector */}
                <Paper p="md" radius="md" withBorder>
                    <Group align="center">
                        <Select
                            label="Filter by Team"
                            placeholder="Select a team"
                            value={selectedTeam?.toString() || null}
                            onChange={(value) =>
                                setSelectedTeam(value ? parseInt(value) : null)
                            }
                            data={
                                generalInformation.teams?.map((team) => ({
                                    value: team.id.toString(),
                                    label: team.name,
                                })) || []
                            }
                            clearable
                            style={{ width: "300px" }}
                        />
                        <Button
                            variant="gradient"
                            gradient={theme.defaultGradient}
                            onClick={() => setSelectedTeam(null)}
                            radius="md"
                            disabled={!selectedTeam}
                        >
                            Show All Teams
                        </Button>
                    </Group>
                </Paper>

                {/* Main Content */}
                <Grid gutter="xl">
                    <Grid.Col span={sidebarOpen ? 9 : 12}>
                        <Stack gap="md">
                            <SegmentedControl
                                value={activeView}
                                onChange={(value) =>
                                    setActiveView(
                                        value as
                                            | "table"
                                            | "calendar"
                                     
                                    )
                                }
                                data={[
                                    {
                                        label: (
                                            <Group gap="xs">
                                                <IconTrophy size={16} />
                                                <span>Fixture Table</span>
                                            </Group>
                                        ),
                                        value: "table",
                                    },
                                    {
                                        label: (
                                            <Group gap="xs">
                                                <IconCalendar size={16} />
                                                <span>Calendar View</span>
                                            </Group>
                                        ),
                                        value: "calendar",
                                    },
                           
                                ]}
                                fullWidth
                                radius="md"
                                color={theme.primaryColor}
                            />

                            <Paper
                                p="md"
                                radius="md"
                                withBorder
                                style={{ minHeight: "70vh" }}
                            >
                                {activeView === "table" &&
                                    renderFixturesTable()}
                                {activeView === "calendar" &&
                                    renderFixtureCalendar()}
                            
                            </Paper>
                        </Stack>
                    </Grid.Col>

                    {/* Filters Sidebar */}
                    {sidebarOpen && (
                        <Grid.Col span={3}>
                            <Paper p="md" radius="md" withBorder>
                                <Title order={4} mb="md" c={theme.primaryColor}>
                                    Fixture Filters
                                </Title>

                                <Stack gap="md">
                                    <Select
                                        label="Fixture Horizon"
                                        description="Number of gameweeks to display"
                                        value={fixtureHorizon.toString()}
                                        onChange={(value) =>
                                            setFixtureHorizon(Number(value))
                                        }
                                        data={Array.from(
                                            { length: 39 - gameweek! }, // includes 0 up to 38 - gameweek
                                            (_, i) => ({
                                                value: i.toString(),
                                                label:
                                                    i === 0
                                                        ? "Current GW only"
                                                        : `Next ${i + 1} GWs`,
                                            }),
                                        )}
                                    />

                                    <Select
                                        label="Difficulty Rating"
                                        placeholder="Filter by difficulty"
                                        clearable
                                        onChange={(value) =>
                                            setDifficulty(Number(value))
                                        }
                                        data={[
                                            {
                                                value: "1",
                                                label: "Very Easy (1)",
                                            },
                                            { value: "2", label: "Easy (2)" },
                                            { value: "3", label: "Medium (3)" },
                                            { value: "4", label: "Hard (4)" },
                                            {
                                                value: "5",
                                                label: "Very Hard (5)",
                                            },
                                        ]}
                                    />

                                    <SegmentedControl
                                        //label="Home/Away"
                                        fullWidth
                                        onChange={(value) =>
                                            setHomeAway(value as HomeAway)
                                        }
                                        data={[
                                            { value: "all", label: "All" },
                                            { value: "home", label: "Home" },
                                            { value: "away", label: "Away" },
                                        ]}
                                        defaultValue="all"
                                    />

                                    <Button
                                        fullWidth
                                        variant="gradient"
                                        gradient={theme.defaultGradient}
                                    >
                                        Apply Filters
                                    </Button>
                                </Stack>
                            </Paper>

                            <Paper p="md" radius="md" withBorder mt="md">
                                <Title order={4} mb="md" c={theme.primaryColor}>
                                    Team Stats
                                </Title>

                                {selectedTeam ? (
                                    <Stack gap="xs">
                                        {/* Team info */}
                                        <Group>
                                            <Text fw={500}>Team:</Text>
                                            <Text>
                                                {getTeamName(selectedTeam)}
                                            </Text>
                                            <Badge>
                                                {
                                                    generalInformation.teams?.find(
                                                        (t) =>
                                                            t.id ===
                                                            selectedTeam,
                                                    )?.short_name
                                                }
                                            </Badge>
                                        </Group>

                                        {/* Standings info */}
                                        <Group>
                                            <Text fw={500}>Position:</Text>
                                            <Text>
                                                {
                                                    generalInformation.teams?.find(
                                                        (t) =>
                                                            t.id ===
                                                            selectedTeam,
                                                    )?.position
                                                }
                                            </Text>
                                        </Group>

                                        {/* Strength ratings */}
                                        <Text fw={500} mt="xs">
                                            Strength Ratings:
                                        </Text>
                                        <Group grow>
                                            <Paper
                                                withBorder
                                                p="xs"
                                                radius="md"
                                            >
                                                <Text
                                                    ta="center"
                                                    size="sm"
                                                    fw={500}
                                                    mb={5}
                                                >
                                                    Home
                                                </Text>
                                                <Group justify="space-around">
                                                    <Stack
                                                        gap={2}
                                                        align="center"
                                                    >
                                                        <Text
                                                            size="xs"
                                                            c="dimmed"
                                                        >
                                                            Overall
                                                        </Text>
                                                        <Badge
                                                            size="lg"
                                                            color="blue"
                                                        >
                                                            {
                                                                generalInformation.teams?.find(
                                                                    (t) =>
                                                                        t.id ===
                                                                        selectedTeam,
                                                                )
                                                                    ?.strength_overall_home
                                                            }
                                                        </Badge>
                                                    </Stack>
                                                    <Stack
                                                        gap={2}
                                                        align="center"
                                                    >
                                                        <Text
                                                            size="xs"
                                                            c="dimmed"
                                                        >
                                                            Attack
                                                        </Text>
                                                        <Badge
                                                            size="lg"
                                                            color="green"
                                                        >
                                                            {
                                                                generalInformation.teams?.find(
                                                                    (t) =>
                                                                        t.id ===
                                                                        selectedTeam,
                                                                )
                                                                    ?.strength_attack_home
                                                            }
                                                        </Badge>
                                                    </Stack>
                                                    <Stack
                                                        gap={2}
                                                        align="center"
                                                    >
                                                        <Text
                                                            size="xs"
                                                            c="dimmed"
                                                        >
                                                            Defense
                                                        </Text>
                                                        <Badge
                                                            size="lg"
                                                            color="orange"
                                                        >
                                                            {
                                                                generalInformation.teams?.find(
                                                                    (t) =>
                                                                        t.id ===
                                                                        selectedTeam,
                                                                )
                                                                    ?.strength_defence_home
                                                            }
                                                        </Badge>
                                                    </Stack>
                                                </Group>
                                            </Paper>
                                        </Group>

                                        <Group grow>
                                            <Paper
                                                withBorder
                                                p="xs"
                                                radius="md"
                                            >
                                                <Text
                                                    ta="center"
                                                    size="sm"
                                                    fw={500}
                                                    mb={5}
                                                >
                                                    Away
                                                </Text>
                                                <Group justify="space-around">
                                                    <Stack
                                                        gap={2}
                                                        align="center"
                                                    >
                                                        <Text
                                                            size="xs"
                                                            c="dimmed"
                                                        >
                                                            Overall
                                                        </Text>
                                                        <Badge
                                                            size="lg"
                                                            color="blue"
                                                        >
                                                            {
                                                                generalInformation.teams?.find(
                                                                    (t) =>
                                                                        t.id ===
                                                                        selectedTeam,
                                                                )
                                                                    ?.strength_overall_away
                                                            }
                                                        </Badge>
                                                    </Stack>
                                                    <Stack
                                                        gap={2}
                                                        align="center"
                                                    >
                                                        <Text
                                                            size="xs"
                                                            c="dimmed"
                                                        >
                                                            Attack
                                                        </Text>
                                                        <Badge
                                                            size="lg"
                                                            color="green"
                                                        >
                                                            {
                                                                generalInformation.teams?.find(
                                                                    (t) =>
                                                                        t.id ===
                                                                        selectedTeam,
                                                                )
                                                                    ?.strength_attack_away
                                                            }
                                                        </Badge>
                                                    </Stack>
                                                    <Stack
                                                        gap={2}
                                                        align="center"
                                                    >
                                                        <Text
                                                            size="xs"
                                                            c="dimmed"
                                                        >
                                                            Defense
                                                        </Text>
                                                        <Badge
                                                            size="lg"
                                                            color="orange"
                                                        >
                                                            {
                                                                generalInformation.teams?.find(
                                                                    (t) =>
                                                                        t.id ===
                                                                        selectedTeam,
                                                                )
                                                                    ?.strength_defence_away
                                                            }
                                                        </Badge>
                                                    </Stack>
                                                </Group>
                                            </Paper>
                                        </Group>
                                    </Stack>
                                ) : (
                                    <Text c="dimmed" ta="center">
                                        Select a team to view detailed stats
                                    </Text>
                                )}
                            </Paper>
                        </Grid.Col>
                    )}
                </Grid>
            </Stack>

            {loading && <LoadingModal />}
        </Container>
    );
};
