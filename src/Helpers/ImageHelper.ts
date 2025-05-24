import { FantasyUser } from "../Types/FantasyUser";

 export const getPlayerImageUrl = (user: FantasyUser, elementId: number): string => {

    //console.log("getting player image url");
        return `https://resources.premierleague.com/premierleague/photos/players/250x250/p${user?.players
            .find((player) => player.id === elementId)
            ?.photo.replace("jpg", "png")}`;
    };