import { AuthError, Session, User, WeakPassword } from "@supabase/supabase-js";
export type SignInWithPasswordResponse = {
    data: {
        user: User | null;
        session: Session | null;
        weakPassword?: WeakPassword | null;
    };
    error: AuthError | null;
};
