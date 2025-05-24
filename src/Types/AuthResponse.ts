import { User, Session, AuthError } from "@supabase/supabase-js";

export type AuthResponse =
{
          data: {
              user: User | null;
              session: Session | null;
          };
          error: AuthError | null;
        }
      


