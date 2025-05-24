import { RateLimiter } from "./DataHelpers";

export class AzureDevOpsClient {
    private readonly rateLimiter: RateLimiter;
    private readonly baseUrl: string;
    private readonly authHeader: string;

    constructor(
        organization: string,
        project: string,
        personalAccessToken: string,
    ) {
        this.rateLimiter = new RateLimiter(5, 500); // 5 requests per 500ms
        this.baseUrl = `https://dev.azure.com/${organization}/${project}/`;
        this.authHeader = `Basic ${btoa(`:${personalAccessToken}`)}`;
    }

    async get<T>(params?: Record<string, string>): Promise<T> {
        type QueryResponse = {
            queryType: string;
            workItems: Array<{ id: number; url: string }>;
        };

        const queryString = params
            ? "?" +
              new URLSearchParams({
                  ...params,
                  "api-version": "7.1",
              }).toString()
            : "?api-version=7.1";

        return this.rateLimiter.makeRequest(async () => {
            const query = await fetch(
                `${this.baseUrl}/Software Development Project Team/_apis/wit/queries/54dd68e3-55a7-4c6f-a77f-b4c95137b0fa${queryString}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: this.authHeader,
                    },
                },
            );

            console.log("Query: ", query);

            const queryResponse = await fetch(
                `${this.baseUrl}/Software Development Project Team/_apis/wit/wiql/54dd68e3-55a7-4c6f-a77f-b4c95137b0fa${queryString}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: this.authHeader,
                    },
                },
            );

            const queryResponseJson =
                (await queryResponse.json()) as QueryResponse;

            const workItemsIdArray: number[] = queryResponseJson.workItems.map(
                (item: any) => item.id,
            );

            console.log("Query Response: ", workItemsIdArray);

            const response = await fetch(
                `${this.baseUrl}/Software Development Project Team/_apis/work/backlogs/Software Development Project Team/workitems${queryString}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: this.authHeader,
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        });
    }
}
