import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { DefaultRootState } from "../DefaultRootState";
import { Action, initialState, rootReducer } from "../Reducers";
import { App } from "./App";
import { FantasyFootball } from "./Components/FantasyFootball";



(async () => {
    const store = createStore(
        (prevState, action) => {
            if (prevState) {
                return rootReducer(
                    prevState as DefaultRootState,
                    action as Action,
                );
            }

            return initialState;
        },
        (window as any).__REDUX_DEVTOOLS_EXTENSION__?.(),
    );

    const root = createRoot(
        document.getElementById("react-entry-point") as HTMLElement,
    );

    root.render(
        <Provider store={store}>
            <App fantasyFootballComponent={<FantasyFootball />} />
        </Provider>,
    );
})();
