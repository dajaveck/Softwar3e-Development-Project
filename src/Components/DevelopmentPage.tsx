import { Button, Group, useMantineColorScheme } from "@mantine/core";
import { useState } from "react";
import { JSONTree } from "react-json-tree";
import { useDispatch, useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";
import { useDataService } from "../Hooks/useDataService";
import { LoadingModal } from "./LoadingModal";

export const JSONTreeTheme = {
    scheme: "monokai",
    author: "wimer hazenberg (http://www.monokai.nl)",
    base00: "#272822",
    base01: "#383830",
    base02: "#49483e",
    base03: "#75715e",
    base04: "#a59f85",
    base05: "#f8f8f2",
    base06: "#f5f4f1",
    base07: "#f9f8f5",
    base08: "#f92672",
    base09: "#fd971f",
    base0A: "#f4bf75",
    base0B: "#a6e22e",
    base0C: "#a1efe4",
    base0D: "#66d9ef",
    base0E: "#ae81ff",
    base0F: "#cc6633",
};

export const lorumIpsum =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nMaecenas in pharetra lacus.\nFusce gravida tristique accumsan.\nIn sed libero vel lectus consectetur egestas nec at magna.\nMorbi ultricies lectus vitae interdum aliquam.\nPhasellus aliquet sagittis arcu, commodo malesuada mi suscipit at.\nSuspendisse pulvinar pellentesque sem, ac vestibulum diam eleifend sit amet.\nDonec scelerisque in massa in rhoncus.\nNunc in libero non quam tincidunt faucibus.\nVestibulum sit amet vulputate tortor, non lacinia mi.\nIn euismod mauris erat, sit amet placerat justo molestie eget.\nNullam in quam ligula.\nMaecenas condimentum maximus sapien, ac blandit orci vestibulum et.\nSuspendisse non quam ac nibh dictum convallis vitae interdum neque.\nPraesent venenatis augue maximus enim bibendum ultrices.\nPellentesque aliquam enim leo, sed dapibus nisi suscipit ac.\nNullam ac enim vel est dignissim pharetra in sed eros.\nAenean pretium, lectus a pulvinar consequat, tortor eros tempor quam, eu malesuada turpis sem sed urna.\nNam vel eros in justo semper molestie.\nDonec hendrerit lectus eget urna laoreet pellentesque.\nInteger eget dignissim velit.\nSed quis massa est.\nNam sed tempus orci, quis dignissim justo.\nNulla facilisi.\nVestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;\nAenean cursus tellus bibendum nisi maximus tincidunt.\nInteger feugiat eu tortor sit amet porttitor.\nVivamus et mauris venenatis, imperdiet augue a, commodo justo.\nSuspendisse ac mauris quis justo pellentesque consequat id at nulla.\nPraesent eu bibendum eros.\nCurabitur convallis suscipit urna, vitae viverra augue aliquam sed.\nAliquam pharetra pellentesque massa ac vulputate.\nAenean neque enim, luctus in lobortis a, lacinia et ante.\nAenean vulputate ex vel tincidunt porta.\nDuis quis magna vitae dui sodales cursus in a lectus.\nPellentesque iaculis sit amet risus id viverra.";

export const DevelopmentPage: React.FC = () => {
    const dataService = useDataService();
    const dispatch = useDispatch();
    const [code, setCode] = useState<string>("");
    const colorScheme = useMantineColorScheme();
    const user = useSelector((state: DefaultRootState) => state.user);
    const latestError = useSelector(
        (state: DefaultRootState) => state.latestError,
    );
    const notifications = useSelector(
        (state: DefaultRootState) => state.notifications,
    );

    return (
        <>
            <Group>
                <LoadingModal />
                {/* Make a button that when pressed spams network requests to the server */}
                <Button
                    onClick={async () => {
                        const spamRequests = async () => {
                            for (let i = 0; i < 100; i++) {
                                try {
                                    const data = await dataService.getGeneralInformation();
                                    console.log(`Request ${i + 1}:`, data);
                                } catch (error) {
                                    console.error(`Request ${i + 1} failed:`, error);
                                }
                            }
                        };
                        spamRequests();
                    }}
                >
                    Spam Requests
                </Button>
                <Button
                    onClick={async () => {
                        const data = await dataService.getGeneralInformation();
                        setCode(JSON.stringify(data, null, 2)); // Set the general information as code
                    }}
                />
                get general info
                <Button
                    onClick={async () => {
                        const data = await dataService.testPythonFunctions();
                        setCode(JSON.stringify(data, null, 2));
                    }}
                >
                    yes
                </Button>
                <Button
                    onClick={async () => {
                        const generalInfo =
                            await dataService.getGeneralInformation();
                        // Order the elements by id
                        const orderedElements = generalInfo.elements.sort(
                            (a, b) => a.id - b.id,
                        );

                        setCode(JSON.stringify(orderedElements, null, 2)); // Set the general information as code
                    }}
                >
                    Get General Information
                </Button>
                <Button
                    onClick={async () => {
                        const fixtures = await dataService.getFixtures();
                        setCode(JSON.stringify(fixtures, null, 2)); // Set the fixtures data as code
                    }}
                >
                    Get Fixtures
                </Button>
                <Button
                    onClick={async () => {
                        const fixturesByGameweek =
                            await dataService.getFixturesByGameweek(35);
                        setCode(JSON.stringify(fixturesByGameweek, null, 2)); // Set the fixtures by gameweek as code
                    }}
                >
                    Get Fixtures By Gameweek
                </Button>
                <Button
                    onClick={async () => {
                        const playerData =
                            await dataService.getDataOnPlayer(706);
                        setCode(JSON.stringify(playerData, null, 2)); // Set the player data as code
                    }}
                >
                    Get Data On Player
                </Button>
                <Button
                    onClick={async () => {
                        const gameweekData =
                            await dataService.getDataOnGameweek(706);
                        setCode(JSON.stringify(gameweekData, null, 2)); // Set the gameweek data as code
                    }}
                >
                    Get Data On Gameweek
                </Button>
                <Button
                    onClick={async () => {
                        const managerSummary =
                            await dataService.getManagerSummary(315456);
                        setCode(JSON.stringify(managerSummary, null, 2)); // Set manager summary as code
                    }}
                >
                    Get Manager Summary
                </Button>
                <Button
                    onClick={async () => {
                        const managersTeam =
                            await dataService.getManagersTeam(315456);
                        setCode(JSON.stringify(managersTeam, null, 2)); // Set managers team as code
                    }}
                >
                    Get Managers Team
                </Button>
                <Button
                    onClick={async () => {
                        const managersTeamByGameweek =
                            await dataService.getManagersTeamByGameweek(
                                315456,
                                29,
                            );
                        setCode(
                            JSON.stringify(managersTeamByGameweek, null, 2),
                        ); // Set managers team by gameweek as code
                    }}
                >
                    Get Managers Team By Gameweek
                </Button>
                <Button
                    onClick={() =>
                        setCode(
                            user
                                ? JSON.stringify(user)
                                : JSON.stringify("No User"),
                        )
                    }
                >
                    Get User Information
                </Button>
                <Button
                    onClick={() => {
                        dispatch({
                            type: "SetLatestError",
                            latestError: {
                                error: {
                                    message: "Test Error",

                                    stack: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas in pharetra lacus. Fusce gravida tristique accumsan. In sed libero vel lectus consectetur egestas nec at magna. Morbi ultricies lectus vitae interdum aliquam. Phasellus aliquet sagittis arcu, commodo malesuada mi suscipit at. Suspendisse pulvinar pellentesque sem, ac vestibulum diam eleifend sit amet. Donec scelerisque in massa in rhoncus. Nunc in libero non quam tincidunt faucibus. Vestibulum sit amet vulputate tortor, non lacinia mi. In euismod mauris erat, sit amet placerat justo molestie eget. Nullam in quam ligula.Maecenas condimentum maximus sapien, ac blandit orci vestibulum et. Suspendisse non quam ac nibh dictum convallis vitae interdum neque. Praesent venenatis augue maximus enim bibendum ultrices. Pellentesque aliquam enim leo, sed dapibus nisi suscipit ac. Nullam ac enim vel est dignissim pharetra in sed eros. Aenean pretium, lectus a pulvinar consequat, tortor eros tempor quam, eu malesuada turpis sem sed urna. Nam vel eros in justo semper molestie. Donec hendrerit lectus eget urna laoreet pellentesque. Integer eget dignissim velit.Sed quis massa est. Nam sed tempus orci, quis dignissim justo. Nulla facilisi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aenean cursus tellus bibendum nisi maximus tincidunt. Integer feugiat eu tortor sit amet porttitor. Vivamus et mauris venenatis, imperdiet augue a, commodo justo. Suspendisse ac mauris quis justo pellentesque consequat id at nulla. Praesent eu bibendum eros. Curabitur convallis suscipit urna, vitae viverra augue aliquam sed. Aliquam pharetra pellentesque massa ac vulputate. Aenean neque enim, luctus in lobortis a, lacinia et ante. Aenean vulputate ex vel tincidunt porta. Duis quis magna vitae dui sodales cursus in a lectus. Pellentesque iaculis sit amet risus id viverra.",
                                },
                                message: "This is a Test Error",
                                isFatal: false,
                            },
                        });
                    }}
                >
                    Non Fatal Modal
                </Button>
                <Button
                    onClick={() => {
                        dispatch({
                            type: "SetLatestError",
                            latestError: {
                                error: {
                                    message: "Test Error",

                                    stack: lorumIpsum,
                                },
                                message: "This is a Test Error",
                                isFatal: true,
                            },
                        });
                    }}
                >
                    Fatal Modal
                </Button>
                <Button onClick={() => setCode(JSON.stringify(latestError))}>
                    Get Latest Error
                </Button>
                <Button
                    onClick={() =>
                        dispatch({
                            type: "SetNotifications",
                            notifications: [
                                ...notifications,
                                {
                                    id: crypto.randomUUID(),
                                    title: "Test Notification",
                                    message: "Test Notification",
                                },
                            ],
                        })
                    }
                ></Button>
                <Button onClick={() => dataService.ingestData()}>Injest Data</Button>
            </Group>
            {/* Display the code in the Code component */}
            <JSONTree
                invertTheme={colorScheme.colorScheme == "light" ? true : false}
                theme={JSONTreeTheme}
                data={code && JSON.parse(code)}
            />
        </>
    );
};
