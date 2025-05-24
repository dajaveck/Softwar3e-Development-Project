import {
    Radio,
    Stack,
    Text,
    Group,
    Paper,
    useMantineTheme,
    rem,
    useMantineColorScheme,
} from "@mantine/core";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";
import {
    IconTrendingUp,
    IconHierarchy2,
    IconTrees,
    IconBolt,
    IconChartDots,
} from "@tabler/icons-react";

export const ModelSelectionPane: React.FC = () => {
    const theme = useMantineTheme();
    const scheme = useMantineColorScheme()
    const dispatch = useDispatch();
    const filters = useSelector((state: DefaultRootState) => state.filters);
    const [value, setValue] = useState(filters.model || "");

    const setModel = (name: string) => {
        dispatch({ type: "SetFilters", filters: { ...filters, model: name } });
        setValue(name);
    };

    const isDark = scheme.colorScheme === "dark";
    const borderSelected = theme.colors.primary[isDark ? 4 : 6];
    const borderHover = theme.colors.primary[isDark ? 3 : 5];
       const bgSelected = isDark
           ? `rgba(${theme.colors.primary[9]}, 0.2)` // Adding transparency to primary color
           : theme.colors.gray[0];
    const textSelected = isDark ? theme.white : theme.black;
    const iconColor = isDark ? theme.colors.gray[2] : theme.colors.gray[7];

    const data = [
        {
            name: "Linear Regression",
            description: "A linear approach to regression",
            icon: <IconTrendingUp size={20} color={iconColor} />,
        },
        {
            name: "Decision Tree",
            description: "A tree-based model for classification",
            icon: <IconHierarchy2 size={20} color={iconColor} />,
        },
        {
            name: "Random Forest",
            description: "An ensemble of decision trees",
            icon: <IconTrees size={20} color={iconColor} />,
        },
        {
            name: "Gradient Boosting",
            description: "Builds trees sequentially",
            icon: <IconBolt size={20} color={iconColor} />,
        },
        {
            name: "Support Vector Machine",
            description: "Works well on high-dimensional data",
            icon: <IconChartDots size={20} color={iconColor} />,
        },
    ];

    return (
        <Radio.Group value={value} onChange={setModel}>
            <Stack gap="sm">
                {data.map((item) => {
                    const isSelected = value === item.name;
                    return (
                        <Paper
                            key={item.name}
                            component="button"
                            type="button"
                            radius="md"
                            p="md"
                            withBorder
                            style={{
                                cursor: "pointer",
                                borderColor: isSelected
                                    ? borderSelected
                                    : theme.colors.gray[isDark ? 7 : 3],
                                backgroundColor: isSelected
                                    ? bgSelected
                                    : undefined,
                                transition: "all 150ms ease",
                            }}
                            onClick={() => setModel(item.name)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = borderHover;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isSelected
                                    ? borderSelected
                                    : theme.colors.gray[isDark ? 7 : 3];
                            }}
                        >
                            <Group align="flex-start" wrap="nowrap" gap="sm">
                                <Radio
                                    value={item.name}
                                    color="primary"
                                    style={{ flexShrink: 0 }}
                                />
                                <Group align="flex-start" gap="xs">
                                    {item.icon}
                                    <div>
                                        <Text
                                            fw={600}
                                            size="sm"
                                            c={
                                                isSelected
                                                    ? textSelected
                                                    : isDark
                                                      ? "gray.2"
                                                      : "gray.8"
                                            }
                                        >
                                            {item.name}
                                        </Text>
                                        <Text size="xs" c="dimmed" mt={2}>
                                            {item.description}
                                        </Text>
                                    </div>
                                </Group>
                            </Group>
                        </Paper>
                    );
                })}
            </Stack>
        </Radio.Group>
    );
};
