import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useDataService } from "./useDataService";
import { AzureDevOpsClient } from "../Helpers/AzureHelpers";
import { DefaultRootState } from "../../DefaultRootState";

interface WorkItem {
    id: number;
    url: string;
    fields: {
        "System.Title": string;
        "System.State": string;
        "System.WorkItemType": string;
        // Add other fields you need
    };
}

export const useDataRetrievals = () => {
    const dataService = useDataService();
    const dispatch = useDispatch();
    const gameweek = useSelector((state: DefaultRootState) => state.gameweek);
    const organization = "jackDavey";
    const project = "Software Development Project";
    const pat = "";

    //const client = new AzureDevOpsClient(organization, project, pat);

    useEffect(() => {
        dataService
            .getGeneralInformation()
            .then((data) =>
                dispatch({
                    type: "SetGeneralInformation",
                    generalInformation: data,
                }),
            )
            .catch((error) =>
                dispatch({
                    type: "SetLatestError",
                    latestError: {
                        error: error,
                        message: "Unable to load General Information",
                        isFatal: true,
                    },
                }),
            );

        dataService.getFixtures().then((data) => {
            dispatch({
                type: "SetFixtures",
                fixtures: data,
            });
        });
    }, []);
    /** 
    useEffect(() => {
        client.get().then((workItems: any) => {
            console.log("Azure Work Items: ", workItems);
            dispatch({
                type: "SetAzureWorkItems",
                azureWorkItems: workItems,
            });
        });
        
    }, []);
    */
};
