import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useGetStarted } from "../context/GetStartedContext";

type Props = {
  className: string;
  /** Defaults to “Get started”. */
  children?: ReactNode;
};

const directDashboard = import.meta.env.VITE_GET_STARTED_DIRECT_DASHBOARD === "true";

/** Opens the integration panel, or navigates to the dashboard when `VITE_GET_STARTED_DIRECT_DASHBOARD` is true. */
export function GetStartedTrigger({ className, children }: Props) {
  const { open, markGetStartedPressed } = useGetStarted();
  const navigate = useNavigate();

  function onClick() {
    markGetStartedPressed();
    if (directDashboard) {
      navigate("/build-dashboard");
      return;
    }
    open();
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {children ?? "Get started"}
    </button>
  );
}
