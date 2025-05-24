import {
    ActionIcon,
    Container,
    Title,
    Text,
    Flex,
    Grid,
    Card,
    Box,
    rem,
    useMantineTheme,
    LoadingOverlay,
    Notification,
    NumberInput,
    Stack,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState, useEffect } from "react";
import {
    RiArrowRightLine,
    RiFireFill,
    RiLineChartLine,
    RiShieldStarFill,
    RiTeamFill,
} from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";
import { motion, useScroll, useTransform } from "motion/react";
import { useDataService } from "../Hooks/useDataService";
import { useMediaQuery } from "@mantine/hooks";
import { IconX } from "@tabler/icons-react";
import { PageType } from "./FantasyFootball";

export const LandingPage: React.FC = () => {
    const theme = useMantineTheme();
    const dispatch = useDispatch();
    const isTablet = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const user = useSelector((state: DefaultRootState) => state.user);

    const form = useForm({
        initialValues: { teamID: "" },
        validate: {
            teamID: (value) =>
                !value || isNaN(Number(value)) ? "Invalid Team ID" : null,
        },
    });

    const handleSubmit = async (values: { teamID: string }) => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));
            dispatch({
                type: "SetUser",
                user: { ...user, teamID: Number(values.teamID) },
            });
        } catch (err) {
            setError("Failed to load team. Please check your Team ID");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box pos="relative">
            {/* Animated Background Elements */}
            <motion.div style={{ opacity }} className="hero-gradient" />

            <Container
                size="xl"
                pt={isMobile ? rem(60) : rem(100)}
                pb={rem(60)}
            >
                {/* Hero Section */}
                <Flex
                    direction="column"
                    align="center"
                    gap={isMobile ? "md" : "xl"}
                    style={{ position: "relative", zIndex: 2 }}
                >
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        style={{ width: "100%", textAlign: "center" }}
                    >
                        <Flex
                            align="center"
                            gap="sm"
                            c={theme.primaryColor}
                            justify="center"
                        >
                            <RiShieldStarFill size={isMobile ? 24 : 32} />
                            <Text fw={600} size={isMobile ? "md" : "lg"}>
                                2024 Premier League Fantasy
                            </Text>
                        </Flex>

                        <Title
                            order={1}
                            style={{
                                fontSize: isMobile
                                    ? rem(32)
                                    : isTablet
                                      ? rem(48)
                                      : rem(64),
                                lineHeight: 1.1,
                                margin: `${rem(16)} 0`,
                                textAlign: "center",
                            }}
                        >
                            Dominate Your{" "}
                            <span
                                style={{
                                    color: theme.colors[theme.primaryColor][6],
                                }}
                            >
                                Fantasy
                            </span>{" "}
                            League
                        </Title>

                        <Text
                            size={isMobile ? "md" : "xl"}
                            maw={rem(600)}
                            mx="auto"
                            c="dimmed"
                            px={isMobile ? rem(16) : 0}
                        >
                            Advanced analytics, live tracking, and AI-powered
                            insights to elevate your fantasy football strategy
                            to championship levels
                        </Text>
                    </motion.div>

                    {/* Team ID Input */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{ width: "100%", maxWidth: rem(600) }}
                    >
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Flex
                                gap="sm"
                                justify="center"
                                direction={isMobile ? "column" : "row"}
                                align="center"
                                px={isMobile ? rem(16) : 0}
                            >
                                <NumberInput
                                    placeholder="Enter your Team ID"
                                    size={isMobile ? "md" : "lg"}
                                    radius="xl"
                                    variant="filled"
                                    hideControls
                                    {...form.getInputProps("teamID")}
                                    styles={{
                                        input: {
                                            border: `2px solid ${theme.colors.gray[2]}`,
                                            fontSize: isMobile
                                                ? rem(16)
                                                : rem(18),
                                            "&:focus": {
                                                borderColor:
                                                    theme.colors[
                                                        theme.primaryColor
                                                    ][6],
                                            },
                                        },
                                        root: {
                                            width: isMobile ? "100%" : "auto",
                                            flexGrow: isMobile ? 0 : 1,
                                        },
                                    }}
                                />

                                <ActionIcon
                                    type="submit"
                                    size={isMobile ? "lg" : "xl"}
                                    radius="xl"
                                    variant="gradient"
                                    gradient={theme.defaultGradient}
                                    style={
                                        isMobile
                                            ? {}
                                            : { transform: "scale(1.2)" }
                                    }
                                    loading={loading}
                                >
                                    <RiArrowRightLine size={24} />
                                </ActionIcon>
                            </Flex>

                            {error && (
                                <Notification
                                    title="Error"
                                    color="red"
                                    mt="md"
                                    withBorder
                                    icon={<IconX />}
                                    onClose={() => setError(null)}
                                >
                                    {error}
                                </Notification>
                            )}
                        </form>
                        <Text
                            style={{
                                cursor: "pointer",
                                marginTop: "1em"
                            }}
                            td="underline"
                            onClick={() =>
                                dispatch({
                                    type: "SetCurrentPage",
                                    currentPage: "info" as PageType,
                                })
                            }
                        >
                            Where to find Team ID?
                        </Text>
                    </motion.div>

                    {/* Feature Highlights */}
                    <Grid
                        gutter={isMobile ? "md" : "xl"}
                        mt={isMobile ? rem(40) : rem(80)}
                        w="100%"
                    >
                        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                            <motion.div whileHover={{ y: -10 }}>
                                <Card
                                    padding={isMobile ? "sm" : "lg"}
                                    radius="lg"
                                    shadow="sm"
                                    withBorder
                                    style={{
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <RiLineChartLine
                                        size={32}
                                        color={theme.colors.orange[6]}
                                    />
                                    <Title
                                        order={3}
                                        mt="sm"
                                        mb="xs"
                                        size={isMobile ? "h4" : "h3"}
                                    >
                                        Performance Predictions
                                    </Title>
                                    <Text
                                        c="dimmed"
                                        size={isMobile ? "sm" : "md"}
                                    >
                                        Machine learning models to predict
                                        player performance for upcoming
                                        gameweeks
                                    </Text>
                                </Card>
                            </motion.div>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                            <motion.div whileHover={{ y: -10 }}>
                                <Card
                                    padding={isMobile ? "sm" : "lg"}
                                    radius="lg"
                                    shadow="sm"
                                    withBorder
                                    style={{
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <RiTeamFill
                                        size={32}
                                        color={theme.colors.blue[6]}
                                    />
                                    <Title
                                        order={3}
                                        mt="sm"
                                        mb="xs"
                                        size={isMobile ? "h4" : "h3"}
                                    >
                                        Team Optimization
                                    </Title>
                                    <Text
                                        c="dimmed"
                                        size={isMobile ? "sm" : "md"}
                                    >
                                        Algorithms to suggest optimal starting
                                        XI and captain choices based on fixture
                                        difficulty
                                    </Text>
                                </Card>
                            </motion.div>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                            <motion.div whileHover={{ y: -10 }}>
                                <Card
                                    padding={isMobile ? "sm" : "lg"}
                                    radius="lg"
                                    shadow="sm"
                                    withBorder
                                    style={{
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <RiFireFill
                                        size={32}
                                        color={theme.colors.indigo[6]}
                                    />
                                    <Title
                                        order={3}
                                        mt="sm"
                                        mb="xs"
                                        size={isMobile ? "h4" : "h3"}
                                    >
                                        Fixture Analysis
                                    </Title>
                                    <Text
                                        c="dimmed"
                                        size={isMobile ? "sm" : "md"}
                                    >
                                        Visualize upcoming fixtures and their
                                        difficulty to help plan your strategy
                                        for multiple gameweeks
                                    </Text>
                                </Card>
                            </motion.div>
                        </Grid.Col>
                    </Grid>
                </Flex>

                {/* Stats Banner */}
                <Flex
                    justify="space-around"
                    p={isMobile ? "md" : "xl"}
                    mt={isMobile ? rem(60) : rem(100)}
                    style={{
                        background: theme.primaryColor[6],
                        borderRadius: rem(20),
                    }}
                    direction={isMobile ? "column" : "row"}
                    gap={isMobile ? "md" : 0}
                    align="center"
                >
                    <StatItem value="Free" label="No Cost" />
                    <StatItem value="Data-Driven" label="Decision Making" />
                    <StatItem value="Open Source" label="Algorithms" />
                </Flex>
            </Container>

            <LoadingOverlay
                visible={loading}
                zIndex={1000}
                overlayProps={{ blur: 2 }}
                loaderProps={{
                    type: "bars",
                    color: theme.primaryColor,
                }}
            />
        </Box>
    );
};

const StatItem = ({ value, label }: { value: string; label: string }) => {
    const isMobile = useMediaQuery(`(max-width: ${rem(576)})`);

    return (
        <Stack align="center" c="white">
            <Text size={isMobile ? "xl" : "32px"} fw={700}>
                {value}
            </Text>
            <Text size={isMobile ? "xs" : "sm"} opacity={0.9}>
                {label}
            </Text>
        </Stack>
    );
};
