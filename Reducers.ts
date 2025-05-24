import { Draft, produce } from "immer";
import { Reducer } from "react";
import { DefaultRootState } from "./DefaultRootState";

export type Action =
    | { type: "SetTheme"; theme: DefaultRootState["theme"] }
    | { type: "SetNavbarOpen"; navbarOpen: DefaultRootState["navbarOpen"] }
    | { type: "SetCurrentPage"; currentPage: DefaultRootState["currentPage"] }
    | {
          type: "SetGeneralInformation";
          generalInformation: DefaultRootState["generalInformation"];
      }
    | {
          type: "SetUser";
          user: DefaultRootState["user"];
      }
    | {
          type: "SetLatestError";
          latestError: DefaultRootState["latestError"];
      }
    | {
          type: "SetNotifications";
          notifications: DefaultRootState["notifications"];
      }
    | {
          type: "SetGameweekData";
          gameweekData: DefaultRootState["gameweekData"];
      }
    | {
        type: "SetGameweek";
        gameweek: DefaultRootState["gameweek"];
    } 
    | {
          type: "SetFilters";
          filters: DefaultRootState["filters"];
      }
    | {
          type: "SetFixtures";
          fixtures: DefaultRootState["fixtures"];
      } |
      {
        type: "SetIsLoading";
        isLoading: DefaultRootState["isLoading"]
      } |
      {
      type: "SetLoadingPercent";
      loadingPercent: DefaultRootState["loadingPercent"]
      } |
      {
        type :"SetPredictionResponse";
        predictionResponse: DefaultRootState["predictionResponse"]
      }
      ;

export const initialState: DefaultRootState = {
    theme: "dark",

    navbarOpen: false,

    currentPage: "landing",

    generalInformation: {
         events: [],
            game_settings: null,
            phases: [],
            teams: [],
            total_players: null,
            elements: [],
            element_stats: [],
            element_types: [],
    },

    user: {
        teamID: null,
        team: null,
        transfers: [],
        players: [],
        loadedInformation: false,
        player: []
    },

    latestError: null,

    notifications: [],

    gameweekData: null,

    gameweek: null,

    filters: {model: null, horizon: 1, transfers: 1},

    fixtures: [],

    isLoading: false,

    loadingPercent: 0.0,

    predictionResponse: {
        current_target: "",
        elements: []
    }
    
};

export const rootReducer: Reducer<DefaultRootState, Action> = (
    currentState,
    action,
): DefaultRootState =>
    produce<DefaultRootState, Draft<DefaultRootState>>(
        currentState,
        (draftState) => {
            switch (action.type) {
                case "SetTheme": {
                    draftState.theme = action.theme;

                    break;
                }

                case "SetNavbarOpen": {
                    draftState.navbarOpen = action.navbarOpen;

                    break;
                }

                case "SetCurrentPage": {
                    draftState.currentPage = action.currentPage;

                    break;
                }

                case "SetGeneralInformation": {
                    draftState.generalInformation = action.generalInformation;

                    break;
                }

                case "SetUser": {
                    draftState.user = action.user;

                    break;
                }

                case "SetLatestError": {
                    draftState.latestError = action.latestError;

                    break;
                }

                case "SetNotifications": {
                    draftState.notifications = action.notifications;

                    break;
                }

                case "SetGameweekData": {
                    draftState.gameweekData = action.gameweekData;

                    break;
                }

                case "SetGameweek": {
                    draftState.gameweek = action.gameweek;

                    break;
                }

                case "SetFilters": {
                    draftState.filters = action.filters;

                    break;
                }

                case "SetFixtures": {
                    draftState.fixtures = action.fixtures;

                    break;
                }

                case "SetIsLoading": {
                    draftState.isLoading = action.isLoading

                    break
                }

                case "SetLoadingPercent":
                    draftState.loadingPercent = action.loadingPercent

                    break

                case "SetPredictionResponse":
                    draftState.predictionResponse = action.predictionResponse

                    break

            }
        },
    );
