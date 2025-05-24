import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DefaultRootState } from "../../DefaultRootState";
import { Element } from "../Types/GeneralInformation";
import { useDataService } from "./useDataService";

export const useDataEffects = () => {
    const dataService = useDataService();
    const dispatch = useDispatch();
    const user = useSelector((state: DefaultRootState) => state.user);
    const latestError = useSelector(
        (state: DefaultRootState) => state.latestError,
    );
    const generalInformation = useSelector(
        (state: DefaultRootState) => state.generalInformation,
    );

    const gameweek = useSelector((state: DefaultRootState) => state.gameweek);

    useEffect(() => {
        // Set the current gameweek
          const now = new Date();

          if (!generalInformation) {
              return;
          }

          var gameweek
          console.log("Current Time:", now.toISOString());

          // Iterate through each gameweek in the bootstrap data
          for (const gw of generalInformation.events) {
              const deadlineTime = new Date(gw.deadline_time);

              // Check if the deadline time is in the future
              if (deadlineTime > now) {
                  // Return the previous gameweek (current gameweek is the one before the first future deadline)
                  gameweek =  gw.id ;

                  dataService
                  .getDataOnGameweek(gameweek)
                  .then((data) =>
                      dispatch({
                          type: "SetGameweekData",
                          gameweekData: data,
                      }),
                  )
                  .catch((error) =>
                      dispatch({
                          type: "SetLatestError",
                          latestError: {
                              error: error,
                              message: "Unable to load Gameweek Data",
                              isFatal: true,
                          },
                      }),
                  );

                   dispatch({
                       type: "SetGameweek",
                       gameweek: gameweek,
                   });

                    return;
              }
          }

          // If no future deadlines are found, return null
          gameweek = null;

            dispatch({
                type: "SetGameweek",
                gameweek: gameweek,
            });

          

        


    }, [generalInformation]);

    // Fetch the Managers Team
    useEffect(() => {
        if (!user?.teamID) return;

        if (!gameweek) {
            return;
        }

        dispatch({
            type: "SetUser",
            user: { ...user, loadedInformation: false },
        });

        const fetchManagersTeam = async () => {
            try {
                const teamData = await dataService.getManagersTeamByGameweek(
                    user?.teamID as number,
                    gameweek -1 ,
                );
                dispatch({
                    type: "SetUser",
                    user: { ...user, team: teamData },
                });
            } catch (error) {
                dispatch({
                    type: "SetLatestError",
                    latestError: {
                        error,
                        message: "Unable to Load Managers Team By Gameweek",
                        isFatal: false,
                    },
                });
            }
        };

        fetchManagersTeam();
    }, [user?.teamID]);

    // Fetch the Transfers after Managers Team data is set
    useEffect(() => {
        if (!user?.team) {
            return;
        }

        const fetchTransfers = async () => {
            try {
                const transferData = await dataService.getManagersTransfers(
                    user?.teamID as number,
                );
                dispatch({
                    type: "SetUser",
                    user: { ...user, transfers: transferData },
                });
            } catch (error) {
                dispatch({
                    type: "SetLatestError",
                    latestError: {
                        error,
                        message:
                            "Unable to Load Managers Transfers By Gameweek",
                        isFatal: false,
                    },
                });
            }
        };

        fetchTransfers();
    }, [user?.team]);

    // Process the Players and Set Loaded Information after Managers Team and Transfers
    useEffect(() => {
        if (!user?.team?.picks || !generalInformation) return;

        const foundPlayers: Element[] = user?.team.picks
            .map((pick) =>
                generalInformation.elements.find(
                    (element) => element.id === pick.element,
                ),
            )
            .filter((element): element is Element => element !== undefined);

        if (foundPlayers.length !== user.team.picks.length) {
            throw new Error("Mismatch in player data.");
        }

        dispatch({
            type: "SetUser",
            user: { ...user, players: foundPlayers },
        });
    }, [user?.transfers]);


};
