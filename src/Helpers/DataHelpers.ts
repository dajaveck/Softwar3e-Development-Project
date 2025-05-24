import { useDispatch } from "react-redux";


type RequestFunction<T> = () => Promise<T>;

export class RateLimiter {
    private maxRequests: number;
    private timeWindow: number;
    private timeoutDuration: number;
    private requestTimestamps: number[];
    private isTimedOut: boolean;
    private dispatch: any;

    constructor(
        maxRequests: number,
        timeWindow: number,
        timeoutDuration: number = 5000,
    ) {
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.timeoutDuration = timeoutDuration;
        this.requestTimestamps = [];
        this.isTimedOut = false;
        this.dispatch = useDispatch();
    }

    private cleanupOldRequests(): void {
        const now = Date.now();
        this.requestTimestamps = this.requestTimestamps.filter(
            (timestamp) => now - timestamp < this.timeWindow,
        );
    }

    async makeRequest<T>(requestFn: RequestFunction<T>): Promise<T> {
        if (this.isTimedOut) {

            console.log("Rate limit exceeded - timed out");
            this.dispatch({
                type: "SetLatestError",
                latestError: {
                    error: {
                        name: "OOPS",
                        message:
                            "Something went wrong, please try refreshing the page.",
                        stack: "Something went wrong",
                    },
                    message: "OOPS",
                    isFatal: true,
                },
            });
            return Promise.reject(new Error("Rate limit exceeded"));
        }

        this.cleanupOldRequests();

        if (this.requestTimestamps.length >= this.maxRequests - 1) {
            
        }

        if (this.requestTimestamps.length >= this.maxRequests) {
            this.isTimedOut = true;
            setTimeout(() => {
                this.isTimedOut = false;
                this.requestTimestamps = [];
            }, this.timeoutDuration);
            throw new Error(
                `Rate limit exceeded. Maximum ${this.maxRequests} requests per ${this.timeWindow}ms allowed.`,
            );
        }

        this.requestTimestamps.push(Date.now());
        return requestFn();
    }
}
