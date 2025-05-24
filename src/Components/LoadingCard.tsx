import {
    Paper,
    Skeleton,
    useMantineColorScheme,
    useMantineTheme,
    Text,
    Avatar,
    Center,
    Divider,
    Stack,
} from "@mantine/core";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";
import { getPlayerImageUrl } from "../Helpers/ImageHelper";
import { PredictionResponseElement } from "../Types/PredictionResponse";

interface LoadingCardProps {
    loading: boolean;
    playerName?: string;
    points?: number;
    target?: string;
    player?: PredictionResponseElement
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
    loading,
    playerName,
    points,
    target,
    player,
}) => {
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const [url, setUrl ] = useState("")

    const user = useSelector((state: DefaultRootState) => state.user)

    if (!user)
    {
        return <></>
    }

    const shimmerColor =
        colorScheme === "dark" ? `rgba(255,255,255,0.2)` : `rgba(0,0,0,0.1)`;

    const formatTargetName = (t: string) =>
        t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, " ");

    // <-- adjust this to your desired fixed height
    const CARD_HEIGHT = 240;

    
    useEffect(() => {
        const fetchImage = async () => {
            if (loading) {
                return;
            }
    
            try {
                const url = await getPlayerImageUrl(user, player?.element ?? 0);
                console.log(url)
                setUrl(url)
                // You can now use the `url` here, like setting it to state or doing other operations
            } catch (error) {
                console.error('Error fetching player image URL:', error);
            }
        };
    
        fetchImage();
    }, [loading, user, player]); // Adding `loading`, `user`, and `player` as dependencies

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ height: CARD_HEIGHT, width: "100%" }}
        >
            <Paper
                p="sm"
                radius="lg"
                withBorder
                style={{
                    height: "100%",
                    width: "100%",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: loading ? "flex-start" : "space-between",
                    background:
                        colorScheme === "dark"
                            ? theme.colors.dark[6]
                            : theme.colors.gray[0],
                }}
            >
                {loading ? (
                    <>
                        {/* take up a chunk of the fixed height */}
                        <Skeleton
                            height={CARD_HEIGHT * 0.4}
                            mb="sm"
                            radius="md"
                            style={{
                                background:
                                    colorScheme === "dark"
                                        ? theme.colors.dark[4]
                                        : theme.colors.gray[3],
                            }}
                        />
                        <Skeleton height={10} width="60%" radius="xl" mb={4} />
                        <Skeleton height={8} width="80%" radius="xl" mb={4} />
                        <Skeleton height={8} width="40%" radius="xl" />
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: "-100%",
                                width: "40%",
                                height: "100%",
                                background: `linear-gradient(
                    90deg,
                    transparent,
                    ${shimmerColor},
                    transparent
                  )`,
                                animation: "shimmer 1.5s infinite",
                            }}
                        />
                    </>
                ) : (
                    <>
                    {/* Avatar + Name/Target */}
                    <Stack align="center"  mb="sm">
                      <Avatar
                        src={`https://resources.premierleague.com/premierleague/photos/players/250x250/p${String(player?.photo).split('.')[0]}.png`}
                        size={64}
                        radius="xl"
                        style={{
                          border: `2px solid ${theme.colors[theme.primaryColor][5]}`,
                        }}
                        imageProps={{ style: { objectPosition: "top" } }}
                      >
                        {player?.web_name?.[0]}
                      </Avatar>
                      <Text size="lg" fw={600} truncate>
                        {playerName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {target && formatTargetName(target)}
                      </Text>
                    </Stack>
                  
                    <Divider my="xs" />
                  
                    {/* Points badge */}
                    <Center style={{ marginTop: 8 }}>
                      <Paper
                        px="xs"
                        py={4}
                        radius="xl"
                        withBorder
                        style={{
                          background:
                          colorScheme === "dark"
                          ? theme.colors[theme.primaryColor][7] // a darker tint in dark mode
                          : theme.colors[theme.primaryColor][1]
                        }}
                      >
                        <Text size="xl" fw={700} color={theme.colors[theme.primaryColor][6]}>
                          {points?.toFixed(1)} pts
                        </Text>
                      </Paper>
                    </Center>
                  </>
                )}
            </Paper>

            <style>{`
          @keyframes shimmer {
            100% { left: 200%; }
          }
        `}</style>
        </motion.div>
    );
};
