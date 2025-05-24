import { AppShell } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";
import { useDataEffects } from "../Hooks/useDataEffects";
import { useDataRetrievals } from "../Hooks/useDataRetrievals";
import { DevelopmentPage } from "./DevelopmentPage";
import { ErrorModal } from "./ErrorModal";
import { NotificationComponent } from "./ErrorNotification";
import { Header } from "./Header";
import { LandingPage } from "./LandingPage";
import { LoginPage } from "./LoginPage";
import { Navbar } from "./Navbar";
import { TeamPage } from "./TeamPage";
import { InfoPage } from "./InfoPage";
import { FixtureAnalysisPage } from "./FIxtureAnalysisPage";

export type PageType = "landing" | "development" | "team" | "fixtures" |"info" | "login" ;

export const FantasyFootball: React.FC = () => {
    useDataRetrievals();
    useDataEffects();

    const dispatch = useDispatch();

    const latestError = useSelector(
        (state: DefaultRootState) => state.latestError,
    );
    const navbarOpen = useSelector(
        (state: DefaultRootState) => state.navbarOpen,
    );
    const currentPage: PageType = useSelector(
        (state: DefaultRootState) => state.currentPage,
    );
    const notifications = useSelector(
        (state: DefaultRootState) => state.notifications,
    );

    const [showError, setShowError] = useState<boolean>(false);

    const pages: { [key in PageType]: JSX.Element } = {
        landing: <LandingPage />,
        development: <DevelopmentPage />,
        team: <TeamPage />,
        login: <LoginPage />,
        info: <InfoPage />,
        fixtures:  <FixtureAnalysisPage />
    };

    useEffect(() => {
        if (!latestError) {
            return;
        }
        setShowError(true);
    }, [latestError]);

    return (
        <AppShell
            header={{ height: 60 }}
            padding="md"
            navbar={{
                width: 300,
                breakpoint: "sm",
                collapsed: { mobile: !navbarOpen, desktop: !navbarOpen },
            }}
        >
            <AppShell.Header>
                <Header />
            </AppShell.Header>
            <AppShell.Navbar p="md">
                <Navbar />
            </AppShell.Navbar>

            <AppShell.Main>
                {" "}
                {notifications.map((n) => (
                    <NotificationComponent
                        notification={n}
                    ></NotificationComponent>
                ))}
                {pages[currentPage]}
            </AppShell.Main>
            <ErrorModal
                opened={showError}
                onClose={() =>
                    dispatch({ type: "SetLatestError", latestError: null })
                }
                error={latestError}
            />
        </AppShell>
    );
};
