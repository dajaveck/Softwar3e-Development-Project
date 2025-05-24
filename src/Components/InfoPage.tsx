import {
    Container,
    Title,
    Text,
    Paper,
    Stack,
    List,
    ThemeIcon,
    rem,
    useMantineTheme,
    Grid,
    Badge,
    Accordion,
    Blockquote,
    Anchor,
    Code,
    Divider,
} from "@mantine/core";
import {
    IconChevronRight,
    IconInfoCircle,
    IconUserQuestion,
    IconNumber,
    IconQuestionMark,
    IconCode,
    IconSearch,
} from "@tabler/icons-react";
import { useMantineColorScheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

export const InfoPage: React.FC = () => {
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

    return (
        <Container
            size="lg"
            py="xl"
            bg={
                colorScheme === "dark"
                    ? theme.colors.dark[8]
                    : theme.colors.gray[0]
            }
        >
            <Stack gap="xl">
                {/* Page Header */}
                <Paper
                    p="md"
                    bg={
                        colorScheme === "dark"
                            ? theme.colors.dark[6]
                            : theme.colors.blue[0]
                    }
                >
                    <Title order={1}>
                        <IconInfoCircle style={{ marginRight: rem(8) }} />
                        Fantasy Premier League Guide
                    </Title>
                    <Text c="dimmed" mt="sm">
                        Everything you need to know about using our analytics
                        platform
                    </Text>
                </Paper>

                {/* Getting Team ID Section */}
                <Paper p="md" withBorder>
                    <Title order={2} mb="md">
                        <IconSearch style={{ marginRight: rem(8) }} />
                        Finding Your FPL Team ID
                    </Title>

                    <List spacing="sm" center>
                        <List.Item
                            icon={
                                <ThemeIcon
                                    color={theme.primaryColor}
                                    size={24}
                                    radius="xl"
                                >
                                    1
                                </ThemeIcon>
                            }
                        >
                            Log in to the{" "}
                            <Anchor
                                href="https://fantasy.premierleague.com"
                                target="_blank"
                            >
                                official FPL site
                            </Anchor>
                        </List.Item>

                        <List.Item
                            icon={
                                <ThemeIcon
                                    color={theme.primaryColor}
                                    size={24}
                                    radius="xl"
                                >
                                    2
                                </ThemeIcon>
                            }
                        >
                            Go to <Code>Points</Code> page
                        </List.Item>

                        <List.Item
                            icon={
                                <ThemeIcon
                                    color={theme.primaryColor}
                                    size={24}
                                    radius="xl"
                                >
                                    3
                                </ThemeIcon>
                            }
                        >
                            Check the URL:{" "}
                            <Code>
                                 https://fantasy.premierleague.com/entry/<strong>315456</strong>/event/34
                  
                            </Code>
                        </List.Item>
                    </List>

                    <Blockquote
         
                        color={theme.primaryColor}
        
                        mt="md"
                    >
                        The number between entry and event of your team page URL is your Team
                        ID
                    </Blockquote>
                </Paper>

                {/* FAQ Section */}
                <Paper p="md" withBorder>
                    <Title order={2} mb="md">
                        <IconQuestionMark style={{ marginRight: rem(8) }} />
                        Frequently Asked Questions
                    </Title>

                    <Accordion variant="contained">
                        <Accordion.Item value="data-frequency">
                            <Accordion.Control>
                                How often is data updated?
                            </Accordion.Control>
                            <Accordion.Panel>
                                Player data is updated at the end of every gameweek.
                            </Accordion.Panel>
                        </Accordion.Item>

                        <Accordion.Item value="algorithm">
                            <Accordion.Control>
                                How does the transfer suggestion work?
                            </Accordion.Control>
                            <Accordion.Panel>
                                Our algorithm considers:
                                <List mt="sm" spacing="xs">
                                    <List.Item>
                                        Player form (last 5 matches)
                                    </List.Item>
                                    <List.Item>
                                        Fixture difficulty ratings
                                    </List.Item>
                                    <List.Item>
                                        Price changes predictions
                                    </List.Item>
                                    <List.Item>
                                        Team news and injury status
                                    </List.Item>
                                </List>
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                </Paper>

                {/* Algorithm Details */}
                <Paper p="md" withBorder>
                    <Title order={2} mb="md">
                        <IconCode style={{ marginRight: rem(8) }} />
                        Algorithm Overview
                    </Title>

                    <Grid gutter="xl">
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Title order={3} size="h4">
                                Key Factors
                            </Title>
                            <List spacing="sm" mt="sm">
                                <List.Item
                                    icon={<IconChevronRight size={18} />}
                                >
                                    Expected Points (xP) model
                                </List.Item>
                                <List.Item
                                    icon={<IconChevronRight size={18} />}
                                >
                                    Machine learning price change prediction
                                </List.Item>
                                <List.Item
                                    icon={<IconChevronRight size={18} />}
                                >
                                    Dynamic fixture difficulty adjustments
                                </List.Item>
                            </List>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Title order={3} size="h4">
                                Data Sources
                            </Title>
                            <List spacing="sm" mt="sm">
                                <List.Item
                                    icon={<IconChevronRight size={18} />}
                                >
                                    Official FPL API - More soon to come!
                                </List.Item>
                        
                            
                            </List>
                        </Grid.Col>
                    </Grid>

                    <Divider my="md" />

                    <Text size="sm" c="dimmed">
                        <Badge variant="dot" style={{marginRight: "1em"}}color={theme.primaryColor}>
                            Note
                        </Badge>
                        Our algorithms update dynamically based on real-world
                        matches and player performance
                    </Text>
                </Paper>
            </Stack>
        </Container>
    );
};
