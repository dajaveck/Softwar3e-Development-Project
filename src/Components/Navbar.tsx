import { Button, Stack, useMantineTheme, rem, Group, Text } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import { PageType } from "./FantasyFootball";
import {
    IconHome,
    IconUsers,
    IconCode,
    IconLayoutDashboard,
    IconInfoHexagon,
    IconInfoCircle,
    IconCalendar,
} from "@tabler/icons-react";
import { useMantineColorScheme } from "@mantine/core";
import { DefaultRootState } from "../../DefaultRootState";

export const Navbar: React.FC = () => {
    const dispatch = useDispatch();
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const currentPage = useSelector(
        (state: DefaultRootState) => state.currentPage,
    );

    function setSelectedPage(page: PageType) {
        dispatch({ type: "SetCurrentPage", currentPage: page });
        dispatch({ type: "SetNavbarOpen", navbarOpen: false });
        dispatch({ type: "SetLatestError" }); // Fixed typo in action name
    }

    const navItems = [
        {
            id: "landing",
            label: "Dashboard",
            icon: <IconLayoutDashboard size={20} />,
        },
        {
            id: "team",
            label: "My Team",
            icon: <IconUsers size={20} />,
        },
        {
            id: "fixtures",
            label: "Fixtures",
            icon:  <IconCalendar size={20}/>
        },
        {
            id: "info",
            label: "Information",
            icon: <IconInfoCircle size={20} />
        },
        {
            id: "development",
            label: "Development",
            icon: <IconCode size={20} />,
        },
    ];

    return (
        <Stack
            p="md"
            gap="sm"
            style={{
                borderRight: `${rem(1)} solid ${
                    colorScheme === "dark"
                        ? theme.colors.dark[5]
                        : theme.colors.gray[2]
                }`,
                height: "100vh",
                position: "sticky",
                top: 0,
            }}
        >
            <Group justify="center" mb="md">
                <IconHome
                    size={28}
                    color={theme.colors[theme.primaryColor][6]}
                />
                <Text size="xl" fw={500}>
                    Fantasy Football
                </Text>
            </Group>

            {navItems.map((item) => (
                <Button
                    key={item.id}
                    variant={currentPage === item.id ? "filled" : "subtle"}
                    color={
                        currentPage === item.id ? theme.primaryColor : "gray"
                    }
                    onClick={() => setSelectedPage(item.id as PageType)}
                    leftSection={item.icon}
                    justify="flex-start"
                    fullWidth
                    radius="md"
                    style={{
                        transition: "all 0.2s ease",
                        border:
                            currentPage === item.id
                                ? `1px solid ${theme.colors[theme.primaryColor][6]}`
                                : "1px solid transparent",
                    }}
                    styles={{
                        inner: {
                            justifyContent: "flex-start",
                        },
                        label: {
                            flexGrow: 0,
                        },
                    }}
                    h={45}
                    px="md"
                >
                    {item.label}
                </Button>
            ))}
        </Stack>
    );
};
