import {
    Grid,
    Paper,
    Modal,
    Group,
    Text,
    Stack,
    Table,
    Badge,
    Divider,
    Title,
    Center,
    ScrollArea,
} from "@mantine/core";
import {
    IconArrowsExchange,
    IconTrendingUp,
    IconTrendingDown,
} from "@tabler/icons-react";
import { useState } from "react";
import { Transfer } from "../Types/Transfer";

export const TransferSuggestion: React.FC<{ transfer: Transfer }> = ({
    transfer,
}) => {
    const [modalOpened, setModalOpened] = useState(false);

    if (!transfer) return null;

    // Get all unique metrics from both players
    const allMetrics = new Set([
        ...Object.keys(transfer.transferIn_metrics),
        ...Object.keys(transfer.transferOut_metrics),
    ]);

    // Create comparison data
    const comparisonData = Array.from(allMetrics).map((metric) => {
        const inValue = transfer.transferIn_metrics[metric] || 0;
        const outValue = transfer.transferOut_metrics[metric] || 0;
        const difference = inValue - outValue;

        return {
            metric,
            inValue,
            outValue,
            difference,
            isBetter: difference > 0,
        };
    });

    return (
        <>
            <Paper
                shadow="xs"
                p="md"
                radius="md"
                withBorder
                style={{ minWidth: "30em", height: "100%" }}
                onClick={() => setModalOpened(true)}
            >
                <Grid align="center" style={{ padding: "10px" }}>
                    <Grid.Col span={4} style={{ fontWeight: "bold" }}>
                        {transfer.playerIn_name}
                    </Grid.Col>
                    <Grid.Col
                        span={2}
                        style={{ display: "flex", justifyContent: "center" }}
                    >
                        <IconArrowsExchange size={20} />
                    </Grid.Col>
                    <Grid.Col span={4} style={{ fontWeight: "bold" }}>
                        {transfer.playerOut_name}
                    </Grid.Col>
                    <Grid.Col
                        span={2}
                        style={{ textAlign: "right", fontWeight: "bold" }}
                    >
                        <Badge
                            color={transfer.gain > 0 ? "teal" : "red"}
                            variant="light"
                            style={{
                                borderRadius: "4px",
                                fontSize: "14px",
                                width: "5em",
                                textAlign: "center",
                            }}
                        >
                            {transfer.gain > 0 ? "+" : ""}
                            {transfer.gain.toFixed(2)}
                        </Badge>
                    </Grid.Col>
                </Grid>
            </Paper>

            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                size="xl"
                title={<Title order={3}>Transfer Comparison</Title>}
                styles={{
                    header: { justifyContent: "center", width: "100%" },
                    title: { width: "100%" },
                    body: { padding: "20px" },
                }}
            >
                <Stack spacing="lg">
                    <Group
                        style={{
                            justifyContent: "space-between",
                            marginBottom: "16px",
                        }}
                    >
                        <Stack align="center" style={{ gap: 0 }}>
                            <Text style={{ fontWeight: 700, fontSize: "18px" }}>
                                {transfer.playerIn_name}
                            </Text>
                            <Badge
                                color="teal"
                                variant="light"
                                style={{ borderRadius: "4px" }}
                            >
                                Incoming
                            </Badge>
                        </Stack>

                        <IconArrowsExchange size={24} />

                        <Stack align="center" style={{ gap: 0 }}>
                            <Text style={{ fontWeight: 700, fontSize: "18px" }}>
                                {transfer.playerOut_name}
                            </Text>
                            <Badge
                                color="red"
                                variant="light"
                                style={{ borderRadius: "4px" }}
                            >
                                Outgoing
                            </Badge>
                        </Stack>
                    </Group>

                    <Paper withBorder p="md" radius="md">
                        <Center>
                            <Group style={{ gap: "8px" }}>
                                <Text style={{ fontSize: "18px" }}>
                                    Expected points gain:
                                </Text>
                                <Badge
                                    color={transfer.gain > 0 ? "teal" : "red"}
                                    variant="light"
                                >
                                    {transfer.gain > 0 ? "+" : ""}
                                    {transfer.gain.toFixed(2)}
                                </Badge>
                            </Group>
                        </Center>
                    </Paper>

                    <Divider
                        label="Metrics Comparison"
                        labelPosition="center"
                    />

                    <ScrollArea style={{ height: 350 }}>
                        <Table highlightOnHover>
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th style={{ textAlign: "right" }}>
                                        {transfer.playerIn_name}
                                    </th>
                                    <th style={{ textAlign: "right" }}>
                                        {transfer.playerOut_name}
                                    </th>
                                    <th style={{ textAlign: "right" }}>
                                        Difference
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonData.map((row) => (
                                    <tr key={row.metric}>
                                        <td>{row.metric.replace(/_/g, " ")}</td>
                                        <td style={{ textAlign: "right" }}>
                                            {row.inValue.toFixed(2)}
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            {row.outValue.toFixed(2)}
                                        </td>
                                        <td
                                            style={{
                                                textAlign: "right",
                                                fontWeight: 700,
                                            }}
                                        >
                                            <Group
                                                style={{
                                                    gap: "4px",
                                                    justifyContent: "flex-end",
                                                }}
                                            >
                                                {row.difference > 0 ? (
                                                    <IconTrendingUp
                                                        size={16}
                                                        color="#12B886"
                                                    />
                                                ) : row.difference < 0 ? (
                                                    <IconTrendingDown
                                                        size={16}
                                                        color="#FA5252"
                                                    />
                                                ) : <></>}
                                                <Text
                                                    color={
                                                        row.difference > 0
                                                            ? "teal"
                                                            : row.difference < 0 ? "red" : ""
                                                    }
                                                >
                                                    {row.difference > 0
                                                        ? "+"
                                                        : ""}
                                                    {row.difference.toFixed(2)}
                                                </Text>
                                            </Group>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </ScrollArea>
                </Stack>
            </Modal>
        </>
    );
};
