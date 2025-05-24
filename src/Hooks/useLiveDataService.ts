import { useDispatch, useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";
import { AuthResponse } from "../Types/AuthResponse";
import { DataService } from "../Types/DataService";
import { GeneralInformation } from "../Types/GeneralInformation";
import { ManagersTeam } from "../Types/ManagersTeam";
import { Player } from "../Types/Player";
import { SignInWithPasswordResponse } from "../Types/SignInWithPasswordResponse";
import { Transfer, TransferResponse } from "../Types/Transfer";
import { RateLimiter } from "../Helpers/DataHelpers";
import { Fixture } from "../Types/Fixture";
import { send } from "vite";
import { PredictionResponse } from "../Types/PredictionResponse";
import { StartingResponse } from "../Types/StartingResponse";

export const useLiveDataService = (): DataService => {
    const dispatch = useDispatch();
    const user = useSelector((state: DefaultRootState) => state.user);

    const limiter = new RateLimiter(5, 500); // 1 request per second

    /**
     * Function to send request
     * @param url The URL of the request
     * @returns the parsed JSON of the response
     */
    async function sendRequest(url: string): Promise<any> {
        try {
            const response = await limiter.makeRequest(async () => {
                return fetch(url);
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            return data;
        } catch (error) {
            console.error("Fetch error:", error);

            throw error;
        }
    }

    async function getGeneralInformation(): Promise<GeneralInformation> {
        const url = `https://corsproxy.io/?key=e358b23f&url=https://fantasy.premierleague.com/api/bootstrap-static/`;
        const response = await sendRequest(url);

        return response as GeneralInformation;
    }

    async function getFixtures(): Promise<Fixture[]> {
        const url = `https://corsproxy.io/?key=e358b23f&url=https://fantasy.premierleague.com/api/fixtures/`;
        const response = await sendRequest(url);

        return response;
    }

    async function getPlayerPicture(photo: string): Promise<any> {
        const url = `https://resources.premierleague.com/premierleague/photos/players/250x250/${photo}`;

        return (await fetch(url)).blob();
    }

    async function getFixturesByGameweek(
        gameweekID: number,
    ): Promise<Fixture[]> {
        const url = `https://corsproxy.io/?key=e358b23f&url=https://fantasy.premierleague.com/api/fixtures/?event=${gameweekID}`;
        const response = await sendRequest(url);

        return response;
    }

    async function getDataOnPlayer(playerID: number): Promise<Player> {
        const url = `https://corsproxy.io/?key=e358b23f&url=https://fantasy.premierleague.com/api/element-summary/${playerID}`;
        const response = await sendRequest(url);

        return response as Player;
    }

    async function getDataOnGameweek(gameweekID: number): Promise<string> {
        const url = `https://corsproxy.io/?key=e358b23f&url=https://fantasy.premierleague.com/api/event/${gameweekID}/live/`;
        const response = await sendRequest(url);

        return response;
    }

    async function getManagerSummary(managerID: number): Promise<string> {
        const url = `https://corsproxy.io/?key=e358b23f&url=https://fantasy.premierleague.com/api/entry/${managerID}/`;
        const response = await sendRequest(url);

        return response;
    }

    async function getManagersTransfers(
        managerID: number,
    ): Promise<Transfer[]> {
        const url = `https://corsproxy.io/?key=e358b23f&url=https://fantasy.premierleague.com/api/entry/${managerID}/transfers/`;
        const response = await sendRequest(url);

        return response as Transfer[];
    }

    async function getManagersTeam(managerID: number): Promise<string> {
        const url = `https://corsproxy.io/?key=e358b23f&url=https://fantasy.premierleague.com/api/my-team/${managerID}/`;
        const response = await sendRequest(url);

        return JSON.parse(response);
    }

    async function getManagersTeamByGameweek(
        managerID: number,
        gameweekID: number,
    ): Promise<ManagersTeam> {
        const url = `https://corsproxy.io/?key=e358b23f&url=https://fantasy.premierleague.com/api/entry/${managerID}/event/${gameweekID}/picks/`;
        const response = await sendRequest(url);

        return response as ManagersTeam;
    }

    async function testPythonFunctions(): Promise<any> {
        const url = "/api/http_trigger";
        const response = await sendRequest(url);

        return response;
    }

    async function optimizeTransfers(
        teamID: number,
        filters: any,
        elements: number[]
    ): Promise<TransferResponse> {
        console.log(filters);

        const url = `/api/optimise_transfers?team_id=${teamID}&horizon=${filters.horizon}&elements=${elements}&transfers=${filters.transfers}`;

        return sendRequest(url);
    }

    async function optimizeTeam(elements: number[], filters: any): Promise<StartingResponse> {
        const url = `/api/optimise_team?elements=${elements}`;

        return sendRequest(url);
    }

    async function makePredictions(model: string, horizon: number): Promise<any> {
        const url = `/api/make_predictions?model=${model}&horizon=${horizon}`;


        const data: PredictionResponse = await sendRequest(url);

        if (data) {
            console.log(data.elements.length)
        } else {
            console.log("NOOOOO")
        }

        return data

        
        
    }

    async function ingestData(): Promise<any> {
        const url = "/api/injest_data";
        const response = await sendRequest(url);

        return response;
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
        optimizeTransfers,
        optimizeTeam,
        makePredictions,
        ingestData,
        testPythonFunctions,
    };
};
