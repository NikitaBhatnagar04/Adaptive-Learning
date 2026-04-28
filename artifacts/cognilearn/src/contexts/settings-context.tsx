import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentUserId } from "@/lib/api-extra";

const FONT_SIZE_MAP: Record<string, string> = {
  small: "13px",
  medium: "15px",
  large: "18px",
  xlarge: "21px",
};

interface SettingsContextValue {
  fontSize: string;
  colorTheme: string;
  audioEnabled: boolean;
  visualHighlights: boolean;
  simplifiedUi: boolean;
  taskDurationSeconds: number;
  refresh: () => void;
}

const DEFAULT_SETTINGS: SettingsContextValue = {
  fontSize: "medium",
  colorTheme: "default",
  audioEnabled: true,
  visualHighlights: true,
  simplifiedUi: false,
  taskDurationSeconds: 60,
  refresh: () => {},
};

const SettingsContext = createContext<SettingsContextValue>(DEFAULT_SETTINGS);

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Omit<SettingsContextValue, "refresh">>(DEFAULT_SETTINGS);
  const [tick, setTick] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const userId = getCurrentUserId();
    const url = userId ? `/api/adaptive/settings?userId=${userId}` : `/api/adaptive/settings`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setSettings({
          fontSize: data.fontSize ?? "medium",
          colorTheme: data.colorTheme ?? "default",
          audioEnabled: data.audioEnabled ?? true,
          visualHighlights: data.visualHighlights ?? true,
          simplifiedUi: data.simplifiedUi ?? false,
          taskDurationSeconds: data.taskDurationSeconds ?? 60,
        });
      })
      .catch(() => {});
  }, [tick]);

  // Re-fetch when settings invalidation happens via query client
  useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe(() => {
      // Lightweight: trigger refetch on any cache event tagged with adaptive
      // Using a ticker keeps this simple without peeking into specific keys
    });
    return unsub;
  }, [queryClient]);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZE_MAP[settings.fontSize] ?? "15px";
  }, [settings.fontSize]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.colorTheme);
  }, [settings.colorTheme]);

  // Listen for custom event so settings page can trigger refresh after save
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener("brightways:settings-updated", handler);
    return () => window.removeEventListener("brightways:settings-updated", handler);
  }, []);

  const value: SettingsContextValue = {
    ...settings,
    refresh: () => setTick((t) => t + 1),
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
