import { AuthResponse } from "../Types/AuthResponse";
import { DataService } from "../Types/DataService";
import { FantasyUser } from "../Types/FantasyUser";
import { Fixture } from "../Types/Fixture";
import { GeneralInformation } from "../Types/GeneralInformation";
import { ManagersTeam } from "../Types/ManagersTeam";
import { Player } from "../Types/Player";
import { SignInWithPasswordResponse } from "../Types/SignInWithPasswordResponse";
import { StartingResponse } from "../Types/StartingResponse";
import { Transfer, TransferResponse } from "../Types/Transfer";
import { useLiveDataService } from "./useLiveDataService";

export const useDataService = (): DataService => {
    const liveDataService = useLiveDataService();
    const crudService = liveDataService;

    async function getGeneralInformation(): Promise<GeneralInformation> {
        return crudService.getGeneralInformation();
    }

    async function getFixtures(): Promise<Fixture[]> {
        return crudService.getFixtures();
    }

    async function getPlayerPicture(photo: string): Promise<any> {
        return crudService.getPlayerPicture(photo);
    }

    async function getFixturesByGameweek(gameweekID: number): Promise<Fixture[]> {
        return crudService.getFixturesByGameweek(gameweekID);
    }

    async function getDataOnPlayer(playerID: number): Promise<Player> {
        return crudService.getDataOnPlayer(playerID);
    }

    async function getDataOnGameweek(gameweekID: number): Promise<string> {
        return crudService.getDataOnGameweek(gameweekID);
    }

    async function getManagerSummary(managerID: number): Promise<string> {
        return crudService.getManagerSummary(managerID);
    }

    async function getManagersTransfers(
        managerID: number,
    ): Promise<Transfer[]> {
        return crudService.getManagersTransfers(managerID);
    }

    async function getManagersTeam(managerID: number): Promise<string> {
        return crudService.getManagersTeam(managerID);
    }

    async function getManagersTeamByGameweek(
        managerID: number,
        gameweekID: number,
    ): Promise<ManagersTeam> {
        return crudService.getManagersTeamByGameweek(managerID, gameweekID);
    }

  

    async function optimizeTransfers(teamID: number, transfers: any, elements: number[]): Promise<TransferResponse> {
        return crudService.optimizeTransfers(teamID, transfers , elements);
    }

    async function optimizeTeam(teamID: number[], filters: any): Promise<StartingResponse> {
        return crudService.optimizeTeam(teamID, filters);
    }

    async function ingestData(): Promise<any> {
        return crudService.ingestData();
    }

    async function makePredictions(model: string, horizon: number): Promise<any> {
        return crudService.makePredictions(model, horizon);
    }

    async function testPythonFunctions(): Promise<any> {
        return crudService.testPythonFunctions();
    }

    return {
        getGeneralInformation,
        getFixtures,
        getPlayerPicture,
        getFixturesByGameweek,
        getDataOnPlayer,
        getDataOnGameweek,
        getManagerSummary,
        getManagersTransfers,
        getManagersTeam,
        getManagersTeamByGameweek,
        makePredictions,
        optimizeTransfers,
        optimizeTeam,
        ingestData,
        testPythonFunctions
    };
};
