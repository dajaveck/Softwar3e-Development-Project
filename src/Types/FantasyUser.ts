import { Element } from "./GeneralInformation";
import { ManagersTeam } from "./ManagersTeam";
import { Transfer } from "./Transfer";
import { User } from "@supabase/supabase-js"

export type FantasyUser = {

    teamID: number | null;

    team: ManagersTeam | null;

    transfers: Transfer[];

    players: Element[];

    loadedInformation: boolean;

    player: number[];
} ;
