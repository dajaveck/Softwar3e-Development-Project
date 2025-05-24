import { Avatar, Badge, Card, Group, Text, Tooltip, rem, useMantineTheme } from "@mantine/core";
import { FantasyUser } from "../Types/FantasyUser";
import { Pick } from "../Types/ManagersTeam";
import { Element as GeneralElement } from "../Types/GeneralInformation";
import { Element as GameweekElement } from "../Types/GameweekData";
import { getPlayerImageUrl } from "../Helpers/ImageHelper";
import {
    IconAlertCircle,
    IconBandage,
    IconBan,
    IconHome,
    IconRoad,
} from "@tabler/icons-react";
import { useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";

export const PlayerCard: React.FC<{
    user: FantasyUser;
    pick: Pick;
    player: GeneralElement | undefined;
    element: GameweekElement | undefined;
    isBenched?: boolean;
    isCaptain: boolean;
    vc:boolean
    predictedPoints: number | undefined
}> = ({ user, pick, player, element, isBenched, isCaptain, vc, predictedPoints }) => {
    const theme = useMantineTheme();
    const injuryStatus = player?.status;
    const gameweek = useSelector((state: DefaultRootState) => state.gameweek)
    const isInjured = injuryStatus === "i" || injuryStatus === "u";
    const isSuspended =
        injuryStatus === "d" || injuryStatus === "p" || injuryStatus === "s";
    const captainColor = isCaptain
        ? "red"
        : vc
          ? "yellow"
          : "transparent";

    const generalInformation = useSelector(
        (state: DefaultRootState) => state.generalInformation,
    );

    const fixtures = useSelector((state: DefaultRootState) => state.fixtures);

    if (!fixtures) {
        return <>help</>
    }

    const getNextFixture = (teamId: number) => {
        console.log(teamId)
        const nextFixture = fixtures.filter((f) => f.event == (gameweek)).filter((f) => f.finished == false)
            .find((fixture) => fixture.team_a == teamId || fixture.team_h == teamId);

        console.log("Next Fixture", nextFixture);

        if (!nextFixture) return null;

        const isFinished = nextFixture.finished;
        const isHome = nextFixture.team_h === teamId;
        const opponentId = isHome ? nextFixture.team_a : nextFixture.team_h;
        const opponent = generalInformation.teams.find(
            (t) => t.id === opponentId,
        );

        return {
            opponent,
            isHome,
            date: new Date(nextFixture.kickoff_time || ""),
            isFinished,

        };
    };

    const nextFixture = player?.team ? getNextFixture(player.team) : null;

    return (
        <Card
            shadow="sm"
            padding="xs"
            radius="md"
            withBorder
            style={{
                width: rem(140),
                minHeight: rem(180),
                position: "relative",
                transition: "transform 0.2s, border-color 0.2s",
                cursor: "pointer",
                borderColor: captainColor,
                ":hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "var(--mantine-shadow-md)",
                },
            }}
        >
            {/* Captain/Vice Badge */}
            {(isCaptain || vc) && (
                <Badge
                    variant="filled"
                    color={captainColor}
                    size="xs"
                    style={{
                        position: "absolute",
                        top: rem(4),
                        right: rem(4),
                        zIndex: 2,
                        textTransform: "none",
                    }}
                >
                    {isCaptain ? "C" : "VC"}
                </Badge>
            )}

            {/* Injury/Suspension Indicator */}
            {(isInjured || isSuspended) && (
                <Tooltip label={isInjured ? "Injured" : "Suspended"}>
                    <Badge
                        variant="light"
                        color={isInjured ? "red" : "yellow"}
                        leftSection={
                            isInjured ? (
                                <IconBandage size={12} />
                            ) : (
                                <IconBan size={12} />
                            )
                        }
                        style={{
                            position: "absolute",
                            top: rem(4),
                            left: rem(4),
                            zIndex: 2,
                        }}
                    >
                        {player?.news?.split(" ")[0] || "Out"}
                    </Badge>
                </Tooltip>
            )}

            {/* Player Image */}
            <Card.Section style={{ position: "relative", padding: rem(8) }}>
                <Avatar
                    src={getPlayerImageUrl(user, player?.id ?? 0)}
                    size={64}
                    radius="md"
                    style={{ margin: "0 auto" }}
                    imageProps={{ style: { objectPosition: "top" } }}
                >
                    {player?.web_name?.[0]}
                </Avatar>
            </Card.Section>

            {/* Player Info */}
            <div style={{ textAlign: "center" }}>
                <Text fw={600} size="sm" truncate>
                    {player?.web_name}
                </Text>

                <div style={{ minHeight: rem(24), marginTop: rem(4) }}>
                    {nextFixture && !nextFixture.isFinished ? (
                        <Tooltip
                            label={`Next: ${nextFixture.opponent?.name} | ${nextFixture.date.toLocaleDateString()}`}
                        >
                            <Badge
                                variant="light"
                                color={nextFixture.isHome ? "green" : "orange"}
                                leftSection={
                                    nextFixture.isHome ? (
                                        <IconHome size={12} />
                                    ) : (
                                        <IconRoad size={12} />
                                    )
                                }
                                radius="sm"
                                style={{ cursor: "help" }}
                            >
                                {nextFixture.opponent?.short_name}
                            </Badge>
                        </Tooltip>
                    ) : (
                        <div style={{ marginTop: rem(4) }}>
                            <Text size="xs" c="dimmed">
                                GW Points
                            </Text>
                            <Text
                                fw={700}
                                size="lg"
                                style={{
                                    lineHeight: 1.2,
                                    color:
                                        (element?.stats.total_points || 0) > 0
                                            ? theme.colors.green[5]
                                            : theme.colors.red[5],
                                }}
                            >
                                {(element?.stats.total_points || 0) *
                                    (pick.is_captain ? 2 : 1)}
                            </Text>
                        </div>
                    )}
                    {predictedPoints && <div style={{ marginTop: rem(4) }}>
                            <Text size="xs" c="dimmed">
                                Predicted Points:
                            </Text>
                            <Text
                                fw={700}
                                size="lg"
                                style={{
                                    lineHeight: 1.2,
                                    color:
                                        (predictedPoints || 0) > 0
                                            ? theme.colors.green[5]
                                            : theme.colors.red[5],
                                }}
                            >
                                {((predictedPoints || 0) *
                                    (isCaptain ? 1 : 1)).toFixed(2)}
                            </Text>
                        </div>}
                </div>

                <Group justify="center" gap={rem(12)} mt={rem(8)}>
        
                        <div>
                            <Text size="xs" c="dimmed">
                                Value
                            </Text>
                            <Text fw={500} size="sm">
                                £{(player?.now_cost ?? 0) / 10}m
                            </Text>
                        </div>
                    
                </Group>
            </div>

            {/* Status Indicator */}
            {(isInjured || isSuspended) && (
                <div
                    style={{
                        position: "absolute",
                        bottom: rem(4),
                        right: rem(4),
                    }}
                >
                    <IconAlertCircle
                        size={16}
                        color={isInjured ? "red" : "yellow"}
                    />
                </div>
            )}
        </Card>
    );
};
