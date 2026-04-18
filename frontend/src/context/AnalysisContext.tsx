import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  API_BASE_URL,
  checkApiHealth,
  createAnalysis,
  createAnalysisStream,
  getAnalysis,
  listAnalyses,
  type AnalysisRun,
  type AnalysisRunSummary,
  type AnalysisStatus,
  type AnalysisStreamEvent,
} from "../lib/api";
import { useWorkspaceId } from "./SessionContext";

type ActiveAnalysis = {
  analysis: AnalysisRun;
  liveText: string;
  toolActivity: string[];
};

/** Backend `/health` probe for dashboard wiring (no wallet auth in this flow). */
export type ApiConnectionStatus = "checking" | "ready" | "unreachable";

type AnalysisContextValue = {
  workspaceId: string;
  apiBaseUrl: string;
  apiConnectionStatus: ApiConnectionStatus;
  recheckApiConnection: () => Promise<void>;
  analyses: AnalysisRunSummary[];
  activeAnalysis: ActiveAnalysis | null;
  isSubmitting: boolean;
  isHistoryLoading: boolean;
  errorMessage: string | null;
  submitPrompt: (prompt: string) => Promise<void>;
  clearActiveAnalysis: () => void;
  refreshAnalyses: () => Promise<void>;
};

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

function mergeSummary(list: AnalysisRunSummary[], next: AnalysisRunSummary): AnalysisRunSummary[] {
  const filtered = list.filter((item) => item.id !== next.id);
  return [next, ...filtered].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function toSummary(run: AnalysisRun): AnalysisRunSummary {
  return {
    id: run.id,
    workspaceId: run.workspaceId,
    title: run.title,
    status: run.status,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

function appendToolActivity(current: string[], event: AnalysisStreamEvent): string[] {
  if (event.type === "tool_call") {
    return [...current, `Calling ${event.name}`];
  }
  if (event.type === "tool_result") {
    return [...current, `${event.name}: ${event.summary}`];
  }
  if (event.type === "error") {
    return [...current, `Error: ${event.message}`];
  }
  return current;
}

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const workspaceId = useWorkspaceId();
  const [analyses, setAnalyses] = useState<AnalysisRunSummary[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<ActiveAnalysis | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiConnectionStatus, setApiConnectionStatus] = useState<ApiConnectionStatus>("checking");
  const streamRef = useRef<EventSource | null>(null);

  const recheckApiConnection = useCallback(async () => {
    setApiConnectionStatus("checking");
    const ok = await checkApiHealth({ timeoutMs: 8000 });
    setApiConnectionStatus(ok ? "ready" : "unreachable");
  }, []);

  useEffect(() => {
    void recheckApiConnection();
  }, [recheckApiConnection]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void recheckApiConnection();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [recheckApiConnection]);

  const closeStream = useCallback(() => {
    streamRef.current?.close();
    streamRef.current = null;
  }, []);

  const refreshAnalyses = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const items = await listAnalyses(workspaceId);
      setAnalyses(items);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load analyses.");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void refreshAnalyses();
  }, [refreshAnalyses]);

  useEffect(() => () => closeStream(), [closeStream]);

  const clearActiveAnalysis = useCallback(() => {
    closeStream();
    setActiveAnalysis(null);
    setErrorMessage(null);
  }, [closeStream]);

  const updateActiveStatus = useCallback((status: AnalysisStatus) => {
    setActiveAnalysis((current) => {
      if (!current) return current;
      return {
        ...current,
        analysis: {
          ...current.analysis,
          status,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const submitPrompt = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      closeStream();
      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const analysis = await createAnalysis({
          workspaceId,
          prompt: trimmed,
          clientRequestId: crypto.randomUUID(),
        });

        setActiveAnalysis({
          analysis,
          liveText: "",
          toolActivity: [],
        });
        setAnalyses((current) => mergeSummary(current, toSummary(analysis)));

        const stream = createAnalysisStream(analysis.id);
        streamRef.current = stream;

        stream.onmessage = (message) => {
          const event = JSON.parse(message.data) as AnalysisStreamEvent;

          if (event.type === "status") {
            updateActiveStatus(event.status);
            setAnalyses((current) =>
              mergeSummary(current, {
                ...toSummary({ ...analysis, status: event.status, updatedAt: event.at }),
                updatedAt: event.at,
              }),
            );
            return;
          }

          if (event.type === "token") {
            setActiveAnalysis((current) => {
              if (!current) return current;
              return {
                ...current,
                liveText: `${current.liveText}${event.delta}`,
              };
            });
            return;
          }

          if (event.type === "tool_call" || event.type === "tool_result" || event.type === "error") {
            setActiveAnalysis((current) => {
              if (!current) return current;
              return {
                ...current,
                toolActivity: appendToolActivity(current.toolActivity, event),
                analysis:
                  event.type === "error"
                    ? {
                        ...current.analysis,
                        errorMessage: event.message,
                        status: "failed",
                        updatedAt: new Date().toISOString(),
                      }
                    : current.analysis,
              };
            });
            if (event.type === "error") {
              setErrorMessage(event.message);
            }
            return;
          }

          if (event.type === "done") {
            void getAnalysis(event.analysisId)
              .then((latest) => {
                setActiveAnalysis((current) => {
                  if (!current || current.analysis.id !== latest.id) return current;
                  return {
                    analysis: latest,
                    liveText: latest.resultText ?? current.liveText,
                    toolActivity: current.toolActivity,
                  };
                });
                setAnalyses((current) => mergeSummary(current, toSummary(latest)));
              })
              .catch((error) => {
                setErrorMessage(error instanceof Error ? error.message : "Failed to refresh analysis.");
              })
              .finally(() => {
                closeStream();
                setIsSubmitting(false);
              });
          }
        };

        stream.onerror = () => {
          setErrorMessage("Live stream disconnected. Refreshing analysis state…");
          void getAnalysis(analysis.id)
            .then((latest) => {
              setActiveAnalysis((current) => {
                if (!current || current.analysis.id !== latest.id) return current;
                return {
                  analysis: latest,
                  liveText: latest.resultText ?? current.liveText,
                  toolActivity: current.toolActivity,
                };
              });
              setAnalyses((current) => mergeSummary(current, toSummary(latest)));
            })
            .catch((error) => {
              setErrorMessage(error instanceof Error ? error.message : "Failed to recover analysis state.");
            })
            .finally(() => {
              closeStream();
              setIsSubmitting(false);
            });
        };
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to create analysis.");
        setIsSubmitting(false);
      }
    },
    [closeStream, updateActiveStatus, workspaceId],
  );

  const value = useMemo<AnalysisContextValue>(
    () => ({
      workspaceId,
      apiBaseUrl: API_BASE_URL,
      apiConnectionStatus,
      recheckApiConnection,
      analyses,
      activeAnalysis,
      isSubmitting,
      isHistoryLoading,
      errorMessage,
      submitPrompt,
      clearActiveAnalysis,
      refreshAnalyses,
    }),
    [
      workspaceId,
      apiConnectionStatus,
      recheckApiConnection,
      analyses,
      activeAnalysis,
      isSubmitting,
      isHistoryLoading,
      errorMessage,
      submitPrompt,
      clearActiveAnalysis,
      refreshAnalyses,
    ],
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) throw new Error("useAnalysis must be used within AnalysisProvider");
  return context;
}
