import {
    Burger,
    Button,
    Group,
    Switch,
    Text,
    useMantineColorScheme,
    Paper,
    ActionIcon,
    Box,
    Title,
    Flex,
    useMantineTheme,
} from "@mantine/core";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";
import { IconSun, IconMoonStars } from "@tabler/icons-react";

export const Header: React.FC = () => {
    const dispatch = useDispatch();
    const theme = useMantineTheme();
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const navbarOpen = useSelector(
        (state: DefaultRootState) => state.navbarOpen,
    );
    const user = useSelector((state: DefaultRootState) => state.user);

    function toggleNavbar() {
        dispatch({
            type: "SetNavbarOpen",
            navbarOpen: !navbarOpen,
        });
    }

    function openLoginPage() {
        dispatch({
            type: "SetCurrentPage",
            currentPage: "login",
        });
    }

    return (
        <Paper
            p="md"
            radius={0}
            withBorder
            style={{
                borderLeft: 0,
                borderRight: 0,
                backgroundColor:
                    colorScheme === "dark"
                        ? theme.colors.dark[8]
                        : theme.colors.gray[0],
            }}
        >
            <Flex
                align="center"
                justify="space-between"
                px="md"
                style={{ maxWidth: "1440px", margin: "0 auto" }}
            >
                <Group>
                    <ActionIcon
                        variant="transparent"
                        onClick={toggleNavbar}
                        size="lg"
                    >
                        <Burger
                            opened={navbarOpen}
                            color={
                                colorScheme === "dark"
                                    ? theme.colors.gray[5]
                                    : theme.colors.dark[9]
                            }
                        />
                    </ActionIcon>
                    <Title
                        order={3}
                        
          
                    >
                        Fantasy Football
                    </Title>
                </Group>

                <Group >
                    {user?.teamID && (
                        <Box
                            px="sm"
                            py={4}
                            style={{
                                borderRadius: theme.radius.md,
                                backgroundColor:
                                    colorScheme === "dark"
                                        ? theme.colors.dark[6]
                                        : theme.colors.gray[2],
                            }}
                        >
                            <Text size="sm" >
                                Team #{user.teamID}
                            </Text>
                        </Box>
                    )}

                    <ActionIcon
                        variant="outline"
                        color={colorScheme === "dark" ? "gray" : "dark"}
                        onClick={() =>
                            setColorScheme(
                                colorScheme === "dark" ? "light" : "dark",
                            )
                        }
                        size="lg"
                        title="Toggle theme"
                    >
                        {colorScheme === "dark" ? (
                            <IconSun size={18} />
                        ) : (
                            <IconMoonStars size={18} />
                        )}
                    </ActionIcon>

                </Group>
            </Flex>
        </Paper>
    );
};
