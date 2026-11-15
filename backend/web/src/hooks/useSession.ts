import { useCallback, useState } from "react";

import { readStoredToken, storeToken, takeGoogleResult } from "../api/session.js";

export type Session = {
  readonly token: string | null;
  /** Why the last Google sign-in failed, if it did. */
  readonly signInError: string | null;
  readonly signOut: () => void;
};

const startSession = (): { readonly token: string | null; readonly signInError: string | null } => {
  const google = takeGoogleResult();
  if (google.token !== null) {
    storeToken(google.token);
    return { token: google.token, signInError: null };
  }
  return { token: readStoredToken(), signInError: google.error };
};

export const useSession = (): Session => {
  const [session, setSession] = useState(startSession);

  const signOut = useCallback(() => {
    storeToken(null);
    setSession({ token: null, signInError: null });
  }, []);

  return { token: session.token, signInError: session.signInError, signOut };
};
