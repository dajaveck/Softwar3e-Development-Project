import { Button, Fieldset, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { useDataService } from "../Hooks/useDataService";

export const LoginPage: React.FC = () => {
    const dataService = useDataService();
    const [loginEmail, setLoginEmail] = useState<string>("");
    const [loginPassword, setLoginPassword] = useState<string>("");
    const [signUpEmail, setSignUpEmail] = useState<string>("");
    const [signUpPassword, setSignUpPassword] = useState<string>("");

    const loginForm = useForm({
        mode: "uncontrolled",
        initialValues: {
            email: "",
            password: "",
        },
    });

    const signUpForm = useForm({
        mode: "uncontrolled",
        initialValues: {
            email: "",
            password: "",
        },
    });

    async function signInWithEmail(email: string, password: string) {
        await dataService.signInWithEmail(email, password);
    }

    async function signUp(email: string, password: string) {
        await dataService.signUp(email, password);
    }

    return (
        <>
            <form
                onSubmit={loginForm.onSubmit(() =>
                    signInWithEmail(loginEmail, loginPassword),
                )}
            >
                <Fieldset>
                    <TextInput
                        withAsterisk
                        label="Email"
                        key={loginForm.key("email")}
                        {...loginForm.getInputProps("email")}
                        onChange={(e) => setLoginEmail(e.target.value)}
                    />
                    <TextInput
                        label="Password"
                        key={loginForm.key("password")}
                        {...loginForm.getInputProps("password")}
                        onChange={(e) => setLoginPassword(e.target.value)}
                    />
                </Fieldset>
                <Button type="submit">Sign In</Button>
            </form>
            <form
                onSubmit={signUpForm.onSubmit(() =>
                    signUp(signUpEmail, signUpPassword),
                )}
            >
                <Fieldset>
                    {" "}
                    <TextInput
                        withAsterisk
                        label="Email"
                        key={signUpForm.key("email")}
                        {...signUpForm.getInputProps("email")}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                    />
                    <TextInput
                        label="Password"
                        key={signUpForm.key("password")}
                        {...signUpForm.getInputProps("password")}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                    />
                </Fieldset>
                <Button type="submit">Sign Up</Button>
            </form>
        </>
    );
};
