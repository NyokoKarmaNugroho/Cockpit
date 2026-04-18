import type { ReactNode } from "react";
import { AnalysisProvider } from "../context/AnalysisContext";
import { GetStartedProvider } from "../context/GetStartedContext";
import { SessionProvider } from "../context/SessionContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GetStartedProvider>
      <SessionProvider>
        <AnalysisProvider>{children}</AnalysisProvider>
      </SessionProvider>
    </GetStartedProvider>
  );
}
