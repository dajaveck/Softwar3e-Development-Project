import { AuthResponse } from "./AuthResponse";
import { FantasyUser } from "./FantasyUser";
import { Fixture } from "./Fixture";
import { GeneralInformation } from "./GeneralInformation";
import { ManagersTeam } from "./ManagersTeam";
import { Player } from "./Player";
import { SignInWithPasswordResponse } from "./SignInWithPasswordResponse";
import { StartingResponse } from "./StartingResponse";
import { Transfer, TransferResponse } from "./Transfer";

export type DataService = {
    getGeneralInformation(): Promise<GeneralInformation>;

    getFixtures(): Promise<Fixture[]>;

    getPlayerPicture(photo: string): Promise<string>;

    getFixturesByGameweek(gameweekID: number): Promise<Fixture[]>;

    getDataOnPlayer(playerID: number): Promise<Player>;

    getDataOnGameweek(gameweekID: number): Promise<string>;

    getManagerSummary(managerID: number): Promise<string>;

    getManagersTransfers(managerID: number): Promise<Transfer[]>;

    getManagersTeam(managerID: number): Promise<string>;

    getManagersTeamByGameweek(
        managerID: number,
        gameweekID: number,
    ): Promise<ManagersTeam>;

    optimizeTransfers(teamID: number | null, transfers: any, elements: number[]): Promise<TransferResponse>;

    optimizeTeam(teamID: number[], filters: any): Promise<StartingResponse>;

    ingestData(): Promise<any>; 

    makePredictions(model: string, horizon: number): Promise<any>

    testPythonFunctions(): Promise<any>;
};
