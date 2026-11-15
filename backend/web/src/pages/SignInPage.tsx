import type { ReactElement } from "react";

import { GOOGLE_SIGN_IN_PATH } from "../api/api.constants.js";
import { Logo } from "../ui/Logo.js";

type SignInPageProps = {
  readonly problem: string | null;
};

export const SignInPage = ({ problem }: SignInPageProps): ReactElement => (
  <main className="flex min-h-screen items-center justify-center p-6">
    <div className="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-8 text-center shadow-sm">
      <div className="mb-6 flex justify-center">
        <Logo height={28} />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">Digital Andon</h1>
      <p className="mt-2 text-sm text-ink-secondary">Sign in with your work Google account to see your team.</p>
      <a href={GOOGLE_SIGN_IN_PATH} className="mt-6 flex h-10 items-center justify-center rounded-md bg-ink text-sm font-medium text-surface hover:opacity-90">
        Sign in with Google
      </a>
      {problem !== null && <p className="mt-4 text-sm text-ink-secondary">{problem}</p>}
    </div>
  </main>
);
