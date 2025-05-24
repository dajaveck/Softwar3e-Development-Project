import { createTheme, MantineProvider, virtualColor } from "@mantine/core";
import React from "react";

export const App: React.FC<{ fantasyFootballComponent: JSX.Element }> = ({
    fantasyFootballComponent,
}) => {
 const theme = createTheme({
     colors: {
         primary: [
             "#f9f1f2",
             "#e8d6d8",
             "#d6b8bb",
             "#c49aa0",
             "#b37e86",
             "#a1626d", // Main
             "#894e59",
             "#713b45",
             "#5a2a32",
             "#441b22",
         ],
         secondary: [
             "#fdf7f0",
             "#f7e3cc",
             "#f2ceaa",
             "#ecba88",
             "#e7a767",
             "#e19347", // Main
             "#c77e3d",
             "#ad6933",
             "#93542a",
             "#793f20",
         ],
     },
     primaryColor: "primary",
     primaryShade: 5,
     defaultGradient: {
         from: "primary",
         to: "secondary",
         deg: 45,
     },
 });

return (
    <MantineProvider defaultColorScheme={"dark"} theme={theme} >
            {fantasyFootballComponent}
    </MantineProvider>
)
}

