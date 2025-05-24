import {
    ActionIcon,
    Badge,
    Button,
    Container,
    Grid,
    Group,
    NumberInput,
    Paper,
    rem,
    SegmentedControl,
    Stack,
    Text,
    Title,
    useMantineColorScheme,
    useMantineTheme,
    Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";
import { useDataService } from "../Hooks/useDataService";
import { LoadingModal } from "./LoadingModal";
import { TeamDisplay } from "./TeamDisplay";
import { TeamFilters } from "./TeamFilters";
import { TransferSuggestion } from "./TransferSuggestion";

import {
    IconLayoutSidebarLeftCollapse,
    IconLayoutSidebarRightCollapse,
} from "@tabler/icons-react";
import DataTable from "./Table";
import { useMediaQuery } from "@mantine/hooks";
import { StartingResponse } from "../Types/StartingResponse";
import { TransferResponse } from "../Types/Transfer";
import { PredictionResponse } from "../Types/PredictionResponse";

// Type definitions for player data
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

export const TeamPage: React.FC = () => {
    const theme = useMantineTheme();
    const dispatch = useDispatch();
    const dataService = useDataService();
    const { colorScheme } = useMantineColorScheme();
    
    // Media queries for responsive design
    const isLargeScreen = useMediaQuery(`(min-width: ${theme.breakpoints.xl})`);
    const isMediumScreen = useMediaQuery(`(min-width: ${theme.breakpoints.md}) and (max-width: ${theme.breakpoints.xl})`);
    const isSmallScreen = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

    // Redux selectors
    const { generalInformation, gameweek, user, filters } = useSelector(
        (state: DefaultRootState) => ({
            generalInformation: state.generalInformation,
            gameweek: state.gameweek,
            user: state.user,
            filters: state.filters,
        }),
    );

    const elementIds = user?.team?.picks.map((e) => e.element);

    if (!gameweek) {
        return (
            <Container p="md">
                <Title order={2} c={theme.colors.primary[6]}>
                    Please log in to view your team.
                </Title>
            </Container>
        );
    }
    
    // Component state
    const [loading, setLoading] = useState(false);
    const [responseData, setResponseData] = useState<TransferResponse | null>(null);
    const [teamID, setTeamID] = useState<number | null>(user && user.teamID);
    const [activeView, setActiveView] = useState<"pitch" | "transfers">("pitch");
    const [sidebarOpen, setSidebarOpen] = useState(!isSmallScreen);
    const [optimizedStartingXI, setOptimizedStartingXI] = useState<StartingResponse | null>(null);
    const [predicted, setPredicted] = useState<PredictionResponse | null>(null);

    // Form handling
    const teamForm = useForm({
        initialValues: {
            teamID: teamID?.toString() || "",
        },
    });

    const optimizeTransfers = useCallback(async () => {
        if (!filters.horizon || filters.model === null) {
            console.error("Missing required filters");
            return;
        }

        if (!elementIds) {
            console.log("Missing element IDs");
            return;
        }

        try {
            setLoading(true);
            const data = await dataService.optimizeTransfers(teamID, filters, elementIds);
            setResponseData(data);
        } catch (error) {
            console.error("Optimization failed:", error);
        } finally {
            setLoading(false);
        }
    }, [teamID, filters, dataService, elementIds]);

    const optimiseTeam = useCallback(async () => {
        if (filters.model === null) {
            console.error("Missing required model");
            return;
        }

        if (!elementIds) {
            console.log("Missing element IDs");
            return;
        }

        try {
            setLoading(true);
            const data = await dataService.optimizeTeam(elementIds, null);
            setOptimizedStartingXI(data);
        } catch (error) {
            console.error("Optimizing team failed", error);
        } finally {
            setLoading(false);
        }
    }, [dataService, elementIds, filters.model]);

    const makePredictions = useCallback(async () => {
        if (filters.model === null) {
            console.error("Missing required model");
            return;
        }

        try {
            setLoading(true);
            const data = await dataService.makePredictions(filters.model, filters.horizon);

            setPredicted(data)
        } catch (error) {
            console.error("Making predictions failed", error);
        } finally {
            setLoading(false);
        }
    }, [dataService, filters.model, filters.horizon]);

    // Sidebar toggle
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <Container
            fluid
            p={isMobile ? "xs" : "md"}
            bg={
                colorScheme === "dark"
                    ? theme.colors.dark[8]
                    : theme.colors.gray[0]
            }
            style={{ minHeight: "calc(100vh - 60px)" }}
        >
            <Stack gap={isMobile ? "md" : "xl"}>
                {/* Header Section */}
                <Paper p={isMobile ? "xs" : "md"} radius="md" withBorder>
                    <Grid align="center">
                        <Grid.Col span={{ base: 6, sm: "content" }}>
                            <Title
                                order={2}
                                c={theme.primaryColor}
                                size={isMobile ? "h3" : "h2"}
                            >
                                Gameweek {gameweek}
                            </Title>
                        </Grid.Col>

                        <Grid.Col span={{ base: 6, sm: "auto" }}>
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
                                    size={isMobile ? "xs" : "sm"}
                                >
                                    {sidebarOpen
                                        ? isMobile
                                            ? "Hide"
                                            : "Hide Filters"
                                        : isMobile
                                          ? "Show"
                                          : "Show Filters"}
                                </Button>
                            </Group>
                        </Grid.Col>
                    </Grid>
                </Paper>

                {/* Team ID Form */}
                <Paper p={isMobile ? "xs" : "md"} radius="md" withBorder>
                    <form
                        onSubmit={teamForm.onSubmit(() => {
                            dispatch({
                                type: "SetUser",
                                user: { ...user, teamID: teamID },
                            });
                        })}
                    >
                        <Group
                            align="flex-end"
                            wrap={isMobile ? "wrap" : "nowrap"}
                        >
                            <NumberInput
                                label="Team ID"
                                placeholder="Enter your team ID"
                                {...teamForm.getInputProps("teamID")}
                                onChange={(e) =>
                                    setTeamID(e ? Number(e) : null)
                                }
                                min={1}
                                hideControls
                                style={{ width: isMobile ? "100%" : rem(200) }}
                                value={teamID ?? ""}
                                radius="md"
                                size={isMobile ? "xs" : "sm"}
                            />
                            <Button
                                type="submit"
                                loading={loading}
                                radius="md"
                                variant="gradient"
                                gradient={theme.defaultGradient}
                                size={isMobile ? "xs" : "sm"}
                                style={
                                    isMobile
                                        ? { width: "100%", marginTop: rem(8) }
                                        : {}
                                }
                            >
                                Load Team
                            </Button>
                        </Group>
                    </form>
                </Paper>

                {/* Main Content */}
                <Grid gutter={isMobile ? "xs" : "xl"}>
                    <Grid.Col span={sidebarOpen ? { base: 12, md: 9 } : 12}>
                        <Stack gap={isMobile ? "xs" : "md"}>
                            <SegmentedControl
                                value={activeView}
                                onChange={(value) =>
                                    setActiveView(value as typeof activeView)
                                }
                                data={[
                                    { label: "Pitch View", value: "pitch" },
                                    { label: "Transfers", value: "transfers" },
                                ]}
                                fullWidth
                                radius="md"
                                color={theme.primaryColor}
                                size={isMobile ? "xs" : "sm"}
                            />
                            <Paper
                                p={isMobile ? "xs" : "md"}
                                radius="md"
                                withBorder
                                style={{
                                    minHeight: isMobile ? "60vh" : "70vh",
                                }}
                            >
                                {activeView === "pitch" ? (
                                    <TeamDisplay
                                        optimise={optimizedStartingXI}
                                        predictionResponse={predicted}
                                    />
                                ) : (
                                    <DataTable />
                                )}
                            </Paper>
                        </Stack>
                    </Grid.Col>

                    {/* Filters Sidebar */}
                    {sidebarOpen && (
                        <Grid.Col span={{ base: 12, md: 3 }}>
                            <TeamFilters
                                gameweek={gameweek}
                                handleOptimizeTransfers={optimizeTransfers}
                                handleOptimizeTeam={optimiseTeam}
                                handleMakePredictions={makePredictions}
                                predicted={predicted != null}
                            />
                        </Grid.Col>
                    )}
                </Grid>

                {/* Transfer Suggestions */}
                {responseData && (
                    <Paper
                        p={isMobile ? "xs" : "md"}
                        radius="md"
                        withBorder
                        mt="xl"
                    >
                        <Title
                            order={3}
                            mb={isMobile ? "xs" : "md"}
                            c={theme.primaryColor}
                            size={isMobile ? "h4" : "h3"}
                        >
                            Suggested Transfers
                        </Title>

                        <Stack gap="sm">
                            <Box
                                style={{
                                    display: "flex",
                                    flexDirection: isMobile ? "column" : "row",
                                    flexWrap: "wrap",
                                    gap: rem(8),
                                }}
                            >
                                {responseData.pairs.map((transfer, index) => (
                                    <Box
                                        key={`transfer-${index}`}
                                        style={{
                                            width: isMobile ? "100%" : "49%",
                                            marginBottom: rem(8),
                                        }}
                                    >
                                        <TransferSuggestion
                                            transfer={transfer}
                                        />
                                    </Box>
                                ))}
                            </Box>
                            <Text>Total Cost: £{responseData.cost}M</Text>
                            <Text>Total Point Gain: {responseData.gain.toFixed(2)}</Text>
                           
                        </Stack>
                    </Paper>
                )}
            </Stack>

            {loading && <LoadingModal />}
        </Container>
    );
};