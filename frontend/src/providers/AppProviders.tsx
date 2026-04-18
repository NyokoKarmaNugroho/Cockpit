import type { ReactNode } from "react";
import { GetStartedProvider } from "../context/GetStartedContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return <GetStartedProvider>{children}</GetStartedProvider>;
}
