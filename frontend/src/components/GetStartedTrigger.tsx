import type { ReactNode } from "react";
import { useGetStarted } from "../context/GetStartedContext";

type Props = {
  className: string;
  /** Defaults to “Get started”. */
  children?: ReactNode;
};

/** Opens the onboarding modal for the current marketing-site flow. */
export function GetStartedTrigger({ className, children }: Props) {
  const { open, markGetStartedPressed } = useGetStarted();

  function onClick() {
    markGetStartedPressed();
    open();
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {children ?? "Get started"}
    </button>
  );
}
