import {
    Button,
    Card,
    Paper,
    Slider,
    Stack,
    Title,
    Text,
    Group,
    rem,
    useMantineTheme,
    useMantineColorScheme,
} from "@mantine/core";
import { ModelSelectionPane } from "./ModelSelectionPane";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";
import { IconCalendar, IconExchange, IconRobot } from "@tabler/icons-react";

interface TeamFiltersProps {
    gameweek?: number;
    handleOptimizeTransfers: () => void;
    handleOptimizeTeam: () => void;
    handleMakePredictions: () => void;
    predicted: boolean}

export const TeamFilters: React.FC<TeamFiltersProps> = ({
    gameweek,
    handleOptimizeTransfers,
    handleOptimizeTeam,
    handleMakePredictions,
    predicted
}) => {
    const theme = useMantineTheme();
    const scheme = useMantineColorScheme();
    const filters = useSelector((state: DefaultRootState) => state.filters);
    const dispatch = useDispatch();
    const user = useSelector((state: DefaultRootState) => state.user);

    if (!user) {
        return <> </>
    }





    const [horizon, setHorizon] = React.useState<number>(filters.horizon || 1);
    const [transfers, setTransfers] = React.useState<number>(
        filters.transfers || 1,
    );

    const onChangeHorizon = (value: number) => {
        setHorizon(value);
        dispatch({
            type: "SetFilters",
            filters: { ...filters, horizon: value },
        });
    };

    const onChangeTransfers = (value: number) => {
        setTransfers(value);
        dispatch({
            type: "SetFilters",
            filters: { ...filters, transfers: value },
        });
    };

    const isDark = scheme.colorScheme === "dark";
    const primary = theme.colors.primary;
    const secondary = theme.colors.secondary;

    const primaryColor = primary[isDark ? 2 : 6];
    const secondaryColor = secondary[isDark ? 3 : 6];
    const borderColor = primary[isDark ? 4 : 2];

    return (
        <Paper
            p="lg"
            radius="md"
            withBorder
            style={{
                position: "sticky",
                top: rem(16),
                height: "fit-content",
                borderColor,
            }}
        >
            <Stack gap="xl">
                {/* Model Selection */}
                <div>
                    <Group gap="sm" mb="md">
                        <IconRobot size={20} color={primaryColor} />
                        <Title order={4} c={primaryColor}>
                            Prediction Model
                        </Title>
                    </Group>
                    <ModelSelectionPane />
                </div>

                {/* Horizon Control */}
                <div>
                    <Group gap="sm" mb="sm">
                        <IconCalendar size={20} color={primaryColor} />
                        <Title order={4} c={primaryColor}>
                            Planning Horizon
                        </Title>
                    </Group>
                    <Slider
                        value={horizon}
                        onChange={onChangeHorizon}
                        min={1}
                        max={39 - (gameweek ?? 0)}
                        step={1}
                        color="primary"
                        marks={[
                            { value: 1, label: "1" },
                            { value: 39 - (gameweek ?? 0), label: 39 - (gameweek ?? 0) },
                        ]}
                        radius="xl"
                    />
                    <Text style={{marginTop: "1em"}}mt="xs" c="dimmed" size="sm">
                        {horizon} week{horizon > 1 ? "s" : ""} ahead
                    </Text>
                </div>

                {/* Transfers Control */}
                <div>
                    <Group gap="sm" mb="sm">
                        <IconExchange size={20} color={secondaryColor} />
                        <Title order={4} c={secondaryColor}>
                            Free Transfers
                        </Title>
                    </Group>
                    <Slider
                        value={transfers}
                        onChange={onChangeTransfers}
                        min={1}
                        max={5}
                        step={1}
                        color="secondary"
                        marks={[
                            { value: 1, label: "1" },
                            { value: 3, label: "3" },
                            { value: 5, label: "5" },
                        ]}
                        radius="xl"
                    />
                    <Text mt="xs" c="dimmed" size="sm">
                        Using {transfers} transfer{transfers > 1 ? "s" : ""}
                    </Text>
                </div>
                <Button
                    onClick={handleMakePredictions}
                    disabled={!user}
                    size="md"
                    radius="xl"
                    variant="gradient"
                    gradient={theme.defaultGradient}
                    leftSection={<IconRobot size={18} />}
                    fullWidth
                >
                    Make Predictions
                </Button>

                {/* Optimize Buttons */}
                <Button
                    onClick={handleOptimizeTransfers}
                    disabled={!predicted}
                    size="md"
                    radius="xl"
                    variant="gradient"
                    gradient={theme.defaultGradient}
                    leftSection={<IconRobot size={18} />}
                    fullWidth
                >
                    Optimize Transfers
                </Button>
                <Button
                    onClick={handleOptimizeTeam}
                    disabled={!predicted}
                    size="md"
                    radius="xl"
                    variant="gradient"
                    gradient={theme.defaultGradient}
                    leftSection={<IconRobot size={18} />}
                    fullWidth
                >
                    Optimize Starting XI
                </Button>
            </Stack>
        </Paper>
    );
};
