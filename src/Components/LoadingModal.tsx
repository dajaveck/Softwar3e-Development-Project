import {
    Modal,
    Text,
    Group,
    useMantineTheme,
    useMantineColorScheme,
    Paper,
    Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { motion } from "framer-motion";
import { IconRotateClockwise } from "@tabler/icons-react";
import React from "react";

interface LoadingModalProps {
    title?: string;
    subtitle?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
    title = "Processing Your Request...",
    subtitle = "Please wait while we complete your request",
    isOpen = true,
    onClose = () => {},
}) => {
    const [opened, { close }] = useDisclosure(isOpen);
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();

    const handleClose = () => {
        close();
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            centered
            size="sm"
            radius="md"
            withCloseButton={false}
            styles={{
                content: {
                    overflow: "hidden",
                    padding: typeof theme.spacing.xl === 'number' ? theme.spacing.xl : 16,
                    maxWidth: "360px",
                    margin: "0 auto",
                },
                body: {
                    padding: 0,
                }
            }}
            overlayProps={{
                backgroundOpacity: 0.4,
                blur: 3,
            }}
        >
            <Box p="md">
                <Group justify="center" mb="md">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "linear",
                        }}
                    >
                        <IconRotateClockwise
                            size={24}
                            color={theme.colors[theme.primaryColor][6]}
                        />
                    </motion.div>
                    <Text size="lg" fw={600}>
                        {title}
                    </Text>
                </Group>

                <Paper
                    p="md"
                    radius="md"
                    style={{
                        backgroundColor:
                            colorScheme === "dark"
                                ? theme.colors.dark[6]
                                : theme.colors.gray[0],
                        textAlign: "center",
                        margin: "10px 0",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Text c="dimmed" size="sm">
                            {subtitle}
                        </Text>
                    </motion.div>
                </Paper>
            </Box>
        </Modal>
    );
};