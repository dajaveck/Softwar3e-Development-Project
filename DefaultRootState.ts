import { PageType } from "./src/Components/FantasyFootball";
import { ErrorNotification } from "./src/Types/ErrorNotification";
import { FantasyUser } from "./src/Types/FantasyUser";
import { Fixture } from "./src/Types/Fixture";
import { GameweekData } from "./src/Types/GameweekData";
import { GeneralInformation } from "./src/Types/GeneralInformation";
import { LatestError } from "./src/Types/LatestError";
import { PredictionResponse } from "./src/Types/PredictionResponse";

export interface DefaultRootState {
    theme: string;

    navbarOpen: boolean;

    currentPage: PageType;

    generalInformation: GeneralInformation;

    user: FantasyUser;

    latestError: LatestError | null;

    notifications: ErrorNotification[];

    gameweekData: GameweekData | null;

    gameweek: number | null;

    filters: {model: string | null; horizon: number, transfers: number}

    fixtures: Fixture[]

    isLoading: boolean

    loadingPercent: number

    predictionResponse: PredictionResponse | null
}
