import { Notification, Transition } from "@mantine/core";
import { useEffect, useState } from "react";
import { ErrorNotification } from "../Types/ErrorNotification";

export const NotificationComponent: React.FC<{
    notification: ErrorNotification;
}> = ({ notification }) => {
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(!mounted);
    }, []);

    return (
        <Transition
            mounted={mounted}
            transition="fade-left"
            timingFunction="ease"
        >
            {(transitionStyle) => (
                <Notification
                    onClick={() => setMounted(!mounted)}
                    withBorder
                    title={notification.title}
                    style={{ ...transitionStyle, zIndex: 1, position: "fixed" }}
                >
                    {notification.message}
                </Notification>
            )}
        </Transition>
    );
};
