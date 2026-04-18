import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { GetStartedModal } from "../components/GetStartedModal";

const ENGAGED_KEY = "cockpit_get_started_engaged";

function readEngagedFromStorage(): boolean {
  try {
    return sessionStorage.getItem(ENGAGED_KEY) === "1";
  } catch {
    return false;
  }
}

type GetStartedContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
  /** True after the user clicks any Get started control (session; persisted in sessionStorage). */
  hasPressedGetStarted: boolean;
  markGetStartedPressed: () => void;
};

const GetStartedContext = createContext<GetStartedContextValue | null>(null);

export function GetStartedProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [hasPressedGetStarted, setHasPressedGetStarted] = useState(false);

  useEffect(() => {
    if (readEngagedFromStorage()) setHasPressedGetStarted(true);
  }, []);

  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  const markGetStartedPressed = useCallback(() => {
    setHasPressedGetStarted(true);
    try {
      sessionStorage.setItem(ENGAGED_KEY, "1");
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const value = useMemo(
    () => ({ open, close, isOpen, hasPressedGetStarted, markGetStartedPressed }),
    [open, close, isOpen, hasPressedGetStarted, markGetStartedPressed]
  );

  return (
    <GetStartedContext.Provider value={value}>
      {children}
      <GetStartedModal />
    </GetStartedContext.Provider>
  );
}

export function useGetStarted() {
  const ctx = useContext(GetStartedContext);
  if (!ctx) throw new Error("useGetStarted must be used within GetStartedProvider");
  return ctx;
}
