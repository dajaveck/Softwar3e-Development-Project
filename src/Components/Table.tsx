import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "mantine-react-table/styles.css";
import { useMemo } from "react";
import {
    MantineReactTable,
    useMantineReactTable,
    type MRT_ColumnDef,
    MRT_GlobalFilterTextInput,
    MRT_ToggleFiltersButton,
} from "mantine-react-table";
import { Box, Button, Flex, Menu, Text, Title, Progress } from "@mantine/core";
import { IconUserCircle, IconChartLine } from "@tabler/icons-react";
import { useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";
import { getPlayerImageUrl } from "../Helpers/ImageHelper";

export type Element = {
    id: number;
    web_name: string;
    team: number;
    element_type: number;
    now_cost: number;
    selected_by_percent: string;
    total_points: number;
    event_points: number;
    form: string;
    points_per_game: string;
    ict_index: string;
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    saves: number;
    bonus: number;
    status: string;
    chance_of_playing_next_round?: number;
    photo: string;
    news: string;
};

const positionMap: { [key: number]: string } = {
    1: "Goalkeeper",
    2: "Defender",
    3: "Midfielder",
    4: "Forward",
};

const DataTable = () => {

  const user = useSelector(
        (state: DefaultRootState) => state.user
    )

   
    const generalInformation = useSelector(
        (state: DefaultRootState) => state.generalInformation
    )

    const data = generalInformation?.elements
    const teams = generalInformation?.teams

    if (!data || !teams) {
        // Handle loading state or error
        return <div>Loading...</div>;
    }

    const columns = useMemo<MRT_ColumnDef<Element>[]>(
        () => [
            {
                id: "player_info",
                header: "Player Info",
                columns: [
                    {
                        accessorFn: (row) => row.web_name,
                        id: "name",
                        header: "Name",
                        size: 200,
                        Cell: ({ row }) => (
                            <Box
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                }}
                            >
                             
                                <span>{row.original.web_name}</span>
                            </Box>
                        ),
                    },
                    {
                        accessorFn  : (row) => teams.filter((team) => team.id === row.team)[0].name,
                        header: "Team",
                        filterVariant: "multi-select",
                        size: 150,
                    },
                    {
                        accessorKey: "element_type",
                        header: "Position",
                        filterVariant: "multi-select",
                        Cell: ({ cell }) =>
                            positionMap[cell.getValue<number>()],
                        mantineFilterSelectProps: {
                            data: Object.entries(positionMap).map(
                                ([value, label]) => ({ value, label }),
                            ),
                        },
                    },
                ],
            },
            {
                id: "performance",
                header: "Performance",
                columns: [
                    {
                        accessorKey: "total_points",
                        header: "Total Points",
                        size: 150,
                        filterVariant: "range-slider",
                        mantineFilterRangeSliderProps: {
                            min: 0,
                            max: data.reduce(
                                (max, player) =>
                                    Math.max(max, player.total_points),
                                0,
                            ),
                            step: 5,
                        },
                    },
                    {
                        accessorKey: "event_points",
                        header: "GW Points",
                        size: 150,
                    },
                    {
                        accessorKey: "form",
                        header: "Form",
                        size: 100,
                        filterVariant: "range",
                    },
                    {
                        accessorKey: "ict_index",
                        header: "ICT Index",
                        size: 150,
                        filterVariant: "range",
                    },
                ],
            },
            {
                id: "status",
                header: "Status",
                columns: [
                    {
                        accessorKey: "now_cost",
                        header: "Price",
                        Cell: ({ cell }) =>
                            `£${(cell.getValue<number>() / 10).toFixed(1)}m`,
                        filterVariant: "range-slider",
                        mantineFilterRangeSliderProps: {
                            min: 40,
                            max: 130,
                            step: 5,
                        },
                    },
                    {
                        accessorKey: "selected_by_percent",
                        header: "Ownership %",
                        Cell: ({ cell }) => (
                            <Box>
                                <Text size="sm" mb={4}>{cell.getValue<string>()}%</Text>
                                <Progress
                                    value={parseFloat(cell.getValue<string>())}
                                    size="xl"
                                />
                            </Box>
                        ),
                    },
                    {
                        accessorKey: "status",
                        header: "Availability",
                        filterVariant: "multi-select",
                        Cell: ({ cell }) => (
                            <Text
                                color={
                                    cell.getValue() === "a" ? "green" : "red"
                                }
                            >
                                {cell.getValue() === "a"
                                    ? "Available"
                                    : "Injured/Doubtful"}
                            </Text>
                        ),
                    },
                ],
            },
        ],
        [],
    );

    const table = useMantineReactTable({
        columns,
        data,
        enableColumnFilterModes: true,
        enableColumnOrdering: true,
        enableGrouping: true,
        enableRowActions: true,
        initialState: {
            showColumnFilters: true,
            showGlobalFilter: true,
        },
        paginationDisplayMode: "pages",
        mantinePaginationProps: {
            radius: "xl",
            size: "lg",
        },
        mantineSearchTextInputProps: {
            placeholder: "Search FPL Players",
        },
        renderDetailPanel: ({ row }) => (
            <Box p="md">
                <Title order={4}>Detailed Stats</Title>
                <Flex gap="md" wrap="wrap">
                    <StatCard title="Goals" value={row.original.goals_scored} />
                    <StatCard title="Assists" value={row.original.assists} />
                    <StatCard
                        title="Clean Sheets"
                        value={row.original.clean_sheets}
                    />
                    <StatCard title="Bonus Points" value={row.original.bonus} />
                    <StatCard title="Minutes" value={row.original.minutes} />
                    <StatCard title="Saves" value={row.original.saves} />
                </Flex>
                {row.original.news && (
                    <Box mt="md">
                        <Title order={5}>News</Title>
                        <Text>{row.original.news}</Text>
                    </Box>
                )}
            </Box>
        ),
        renderRowActionMenuItems: () => [
            <Menu.Item key="profile" leftSection={<IconUserCircle />}>
                View Player Profile
            </Menu.Item>,
            <Menu.Item key="stats" leftSection={<IconChartLine />}>
                View Detailed Stats
            </Menu.Item>,
        ],
        renderTopToolbar: ({ table }) => {
            const handleComparePlayers = () => {
                table.getSelectedRowModel().flatRows.map((row) => {
                    // Handle player comparison logic
                });
            };

            return (
                <Flex p="md" justify="space-between">
                    <Flex gap="xs">
                        <MRT_GlobalFilterTextInput table={table} />
                        <MRT_ToggleFiltersButton table={table} />
                    </Flex>
                    <Flex gap="xs">
                        <Button
                            color="blue"
                            disabled={!table.getIsSomeRowsSelected()}
                            onClick={handleComparePlayers}
                        >
                            Compare Players
                        </Button>
                    </Flex>
                </Flex>
            );
        },
    });

    return <MantineReactTable table={table} />;
};

const StatCard = ({ title, value }: { title: string; value: number }) => (
    <Box style={{ flex: "1 1 160px", textAlign: "center", padding: "8px" }}>
        <Title order={5}>{title}</Title>
        <Text size="xl" fw={700}>
            {value}
        </Text>
    </Box>
);

export default DataTable;
