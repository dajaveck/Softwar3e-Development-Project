import { useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";
import {
    Container,
    Grid,
    Title,
    Paper,
    Flex,
    Text,
    Box,
    useMantineTheme,
    Group,
    useMantineColorScheme,
} from "@mantine/core";
import { PlayerCard } from "./PlayerCard";
import { IconBeach, IconStar } from "@tabler/icons-react";
import { StartingResponse } from "../Types/StartingResponse";
import { useState } from "react";
import { PredictionResponse } from "../Types/PredictionResponse";

export const TeamDisplay: React.FC<{ predictionResponse: PredictionResponse | null, optimise: StartingResponse | null }> = ({
    optimise,
    predictionResponse
}) => {
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const user = useSelector((state: DefaultRootState) => state.user);
    const gameweekData = useSelector(
        (state: DefaultRootState) => state.gameweekData,
    );
    const picks = user?.team?.picks;
    const gameweekPlayers = gameweekData?.elements.filter((e) =>
        picks?.some((p) => p.element == e.id),
    );

    const [points, setPoints] = useState<number>(0)



    const getPlayersByPosition = (positionType: number) =>
        picks?.filter(
            (p) => p.position < 12 && p.element_type === positionType,
        ) || [];

    const FormationRow = ({
        players,
        position,
    }: {
        players: any[];
        position: string;
    }) => {
        // Calculate dynamic spacing based on number of players
        const spacing = Math.min(60, 200 / players.length);

        return (
            <Flex
                gap="sm"
                justify="center"
                align="center"
                style={{
                    position: "relative",
                    minHeight: "120px",
                    margin: "1rem 0",
                    maxWidth: "100%",
                    overflow: "hidden",
                }}
            >
                {players.map((p, index) => (
                    <Box
                        key={p.element}
                        style={{
                            position: "relative",
                            left: `${(index - (players.length - 1) / 2) * spacing}px`,
                            transition: "left 0.3s ease",
                            zIndex: players.length - index,
                            flexShrink: 0,
                        }}
                    >
                        <PlayerCard
                            user={user}
                            pick={p}
                            player={user.players.find(
                                (player) => player.id === p.element,
                            )}
                            element={gameweekPlayers?.find(
                                (player) => player.id === p.element,
                            )}
                            isCaptain={optimise ? optimise.elements.find((e) => e.element == p.element)?.is_captain : p.is_captain}
                            vc={optimise ? optimise.elements.find((e) => e.element == p.element)?.is_vicecaptain : p.is_vice_captain}
                            predictedPoints ={predictionResponse ? predictionResponse.elements.find((e) => e.element == p.element)?.total_points : undefined}
                        />
                    </Box>
                ))}
            </Flex>
        );
    };

    const FieldBackground = () => (
        <Box
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(160deg, ${theme.colors.green[8]} 0%, ${theme.colors.green[6]} 100%)`,
                opacity: colorScheme === "dark" ? 0.15 : 0.1,
                zIndex: 0,
                pointerEvents: "none",
                borderRadius: theme.radius.md,
            }}
        >
            <Box
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "80%",
                    height: "70%",
                    border: `2px dashed ${colorScheme === "dark" ? theme.colors.gray[6] : theme.colors.gray[3]}`,
                    borderRadius: theme.radius.md,
                }}
            />
        </Box>
    );

    return (
        <Box
            style={{
                position: "relative",
                minHeight: "100%",
                padding: theme.spacing.md,
            }}
        >

            <FieldBackground />

            {!picks || !user.players ? (
                <Flex justify="center" align="center" h="100%">
                    <Text size="xl" c="dimmed">
                        No team selected yet
                    </Text>
                </Flex>
            ) : (
                <Box style={{ position: "relative", zIndex: 1 }}>
                    {/* Goalkeeper */}
                    <Flex justify="center" mt="xl">
                        {(optimise
                            ? picks.filter((p) =>
                                  optimise.elements
                                      .filter(
                                          (e) =>
                                              e.starting_xi == true &&
                                              e.element_type == 1,
                                      )
                                      .map((e) => e.element)
                                      .includes(p.element),
                              )
                            : getPlayersByPosition(1)
                        ).map((p) => (
                            <PlayerCard
                                key={p.element}
                                user={user}
                                pick={p}
                                player={user.players.find(
                                    (player) => player.id === p.element,
                                )}
                                element={gameweekPlayers?.find(
                                    (player) => player.id === p.element,
                                )}
                                isCaptain={optimise ? optimise.elements.find((e) => e.element == p.element)?.is_captain : p.is_captain}
                                vc={optimise ? optimise.elements.find((e) => e.element == p.element)?.is_vicecaptain : p.is_vice_captain}
                                predictedPoints ={predictionResponse ? predictionResponse.elements.find((e) => e.element == p.element)?.total_points : undefined}
                            />
                        ))}
                    </Flex>

                    {/* Defenders */}
                    <FormationRow
                        players={
                            optimise
                                ? picks.filter((p) =>
                                      optimise.elements
                                          .filter(
                                              (e) =>
                                                  e.starting_xi == true &&
                                                  e.element_type == 2,
                                          )
                                          .map((e) => e.element)
                                          .includes(p.element),
                                  )
                                : getPlayersByPosition(2)
                        }
                        position="defense"
                    />

                    {/* Midfielders */}
                    <FormationRow
                        players={
                            optimise
                                ? picks.filter((p) =>
                                      optimise.elements
                                          .filter(
                                              (e) =>
                                                  e.starting_xi == true &&
                                                  e.element_type == 3,
                                          )
                                          .map((e) => e.element)
                                          .includes(p.element),
                                  )
                                : getPlayersByPosition(3)
                        }
                        position="midfield"
                    />

                    {/* Attackers */}
                    <FormationRow
                        players={
                            optimise
                                ? picks.filter((p) =>
                                      optimise.elements
                                          .filter(
                                              (e) =>
                                                  e.starting_xi == true &&
                                                  e.element_type == 4,
                                          )
                                          .map((e) => e.element)
                                          .includes(p.element),
                                  )
                                : getPlayersByPosition(4)
                        }
                        position="forward"
                    />

                    {/* Bench */}
                    <Paper p="md" mt="xl" radius="md" withBorder>
                        <Group mb="sm">
                            <IconBeach
                                size={20}
                                color={theme.colors.yellow[6]}
                            />
                            <Title order={4}>Bench</Title>
                        </Group>
                        <Flex gap="sm" wrap="wrap" justify="center">
                            {(optimise ? picks.filter((p) =>
                                      optimise.elements
                                          .filter(
                                              (e) =>
                                                  e.starting_xi == false 
                                            
                                          )
                                          .map((e) => e.element)
                                          .includes(p.element),
                                  ): (picks
                                ?.filter(
                                    (p) =>
                                        p.position > 11 && p.element_type !== 5,
                                )))
                                .map((p) => (
                                    <Box
                                        key={p.element}
                                        style={{ width: "160px" }}
                                    >
                                        <PlayerCard
                                            user={user}
                                            pick={p}
                                            isBenched
                                            player={user.players.find(
                                                (player) =>
                                                    player.id === p.element,
                                            )}
                                            element={gameweekPlayers?.find(
                                                (player) =>
                                                    player.id === p.element,
                                            )}
                                            isCaptain={false}
                                            vc={false}
                                            predictedPoints ={predictionResponse ? predictionResponse.elements.find((e) => e.element == p.element)?.total_points : undefined}
                                        />
                                    </Box>
                                ))}
                        </Flex>
                    </Paper>

                    {/* Manager */}
                    {picks?.some((p) => p.element_type == 5) && (
                        <Paper p="md" mt="xl" radius="md" withBorder>
                            <Group mb="sm">
                                <IconStar
                                    size={20}
                                    color={theme.colors.yellow[6]}
                                />
                                <Title order={4}>Team Manager</Title>
                            </Group>
                            <Flex justify="center">
                                {picks
                                    ?.filter((p) => p.element_type === 5)
                                    .map((p) => (
                                        <PlayerCard
                                            key={p.element}
                                            user={user}
                                            pick={p}
                                            player={user.players.find(
                                                (player) =>
                                                    player.id === p.element,
                                            )}
                                            element={gameweekPlayers?.find(
                                                (player) =>
                                                    player.id === p.element,
                                            )}
                                        />
                                    ))}
                            </Flex>
                        </Paper>
                    )}
                </Box>
            )}
        </Box>
    );
};
