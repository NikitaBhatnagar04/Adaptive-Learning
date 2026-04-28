import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings as SettingsIcon, Type, Volume2, Eye, Clock, Palette, Check, Loader2 } from "lucide-react";
import { getCurrentUserId } from "@/lib/api-extra";

type SettingsShape = {
  taskDurationSeconds: number;
  fontSize: string;
  audioEnabled: boolean;
  visualHighlights: boolean;
  simplifiedUi: boolean;
  breakFrequencyMinutes: number;
  colorTheme: string;
  currentDifficulty: number;
};

const SETTINGS_QK = ["adaptive-settings"] as const;

export default function Settings() {
  const queryClient = useQueryClient();
  const userId = getCurrentUserId();
  const [settings, setSettings] = useState<SettingsShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<number | null>(null);

  // Initial load (scoped by userId)
  useEffect(() => {
    let cancelled = false;
    const url = userId ? `/api/adaptive/settings?userId=${userId}` : `/api/adaptive/settings`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setSettings(data);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [userId]);

  const saveNow = async (next: SettingsShape) => {
    setSaveState("saving");
    try {
      const url = userId ? `/api/adaptive/settings?userId=${userId}` : `/api/adaptive/settings`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      // Invalidate any orval-generated settings cache and notify the SettingsContext
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey.some((k) => typeof k === "string" && k.includes("adaptive")),
      });
      window.dispatchEvent(new CustomEvent("brightways:settings-updated"));
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    } catch (e) {
      console.error("settings save failed", e);
      setSaveState("idle");
    }
  };

  const update = <K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) => {
    if (!settings) return;
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => saveNow(next), 350);
  };

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-slate-200 p-3 shadow-md">
          <SettingsIcon className="h-8 w-8 text-slate-700" />
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-black text-foreground">Play Settings</h1>
          <p className="text-lg font-medium text-muted-foreground">Customize how the games look and feel</p>
        </div>
        <div aria-live="polite" className="min-w-[110px] text-right">
          {saveState === "saving" && (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </span>
          )}
          {saveState === "saved" && (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </div>

      <Card className="shadow-lg border-2">
        <CardHeader className="bg-muted/30 border-b pb-6">
          <CardTitle className="text-2xl font-black flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" /> Visual & Audio
          </CardTitle>
          <CardDescription className="text-base font-medium">Make it easier to see and hear</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <Row label="Sound Effects & Voice" icon={<Volume2 className="h-5 w-5" />} hint="Play cheerful sounds and read instructions out loud.">
            <Switch
              checked={settings.audioEnabled}
              onCheckedChange={(v) => update("audioEnabled", v)}
              className="scale-125"
              data-testid="switch-audio"
            />
          </Row>

          <Row label="Visual Highlights" icon={<Eye className="h-5 w-5" />} hint="Add bright outlines to important things you need to click.">
            <Switch
              checked={settings.visualHighlights}
              onCheckedChange={(v) => update("visualHighlights", v)}
              className="scale-125"
              data-testid="switch-highlights"
            />
          </Row>

          <Row label="Simple View" icon={<SettingsIcon className="h-5 w-5" />} hint="Hide extra details to help you focus better.">
            <Switch
              checked={settings.simplifiedUi}
              onCheckedChange={(v) => update("simplifiedUi", v)}
              className="scale-125"
              data-testid="switch-simple-ui"
            />
          </Row>

          <div className="space-y-4 pt-4 border-t">
            <Label className="text-lg font-bold flex items-center gap-2 mb-4">
              <Type className="h-5 w-5" /> Text Size
            </Label>
            <RadioGroup
              value={settings.fontSize}
              onValueChange={(v) => update("fontSize", v)}
              className="flex flex-wrap gap-4"
              data-testid="radio-font-size"
            >
              {["small", "medium", "large", "xlarge"].map((size) => (
                <div key={size} className="flex items-center space-x-2 bg-muted/50 px-4 py-3 rounded-xl cursor-pointer hover:bg-muted">
                  <RadioGroupItem value={size} id={`font-${size}`} />
                  <Label htmlFor={`font-${size}`} className="cursor-pointer font-bold capitalize">{size}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Label className="text-lg font-bold flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5" /> Color Theme
            </Label>
            <RadioGroup
              value={settings.colorTheme}
              onValueChange={(v) => update("colorTheme", v)}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              data-testid="radio-color-theme"
            >
              {[
                { id: "default", label: "Default", colors: "bg-yellow-100 border-purple-500" },
                { id: "high_contrast", label: "High Contrast", colors: "bg-black border-yellow-400 text-white" },
                { id: "warm", label: "Warm & Calm", colors: "bg-orange-50 border-orange-400" },
                { id: "cool", label: "Cool & Focus", colors: "bg-blue-50 border-blue-400" },
              ].map((theme) => (
                <div key={theme.id}>
                  <RadioGroupItem value={theme.id} id={`theme-${theme.id}`} className="peer sr-only" />
                  <Label
                    htmlFor={`theme-${theme.id}`}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-4 cursor-pointer hover:opacity-90 peer-data-[state=checked]:ring-4 ring-primary ring-offset-2 transition-all ${theme.colors}`}
                  >
                    <span className="font-bold">{theme.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-2">
        <CardHeader className="bg-muted/30 border-b pb-6">
          <CardTitle className="text-2xl font-black flex items-center gap-2">
            <Clock className="h-6 w-6 text-secondary" /> Timing & Pacing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-bold">Game Length (seconds)</Label>
              <span className="font-black text-2xl text-primary">{settings.taskDurationSeconds}s</span>
            </div>
            <Slider
              value={[settings.taskDurationSeconds]}
              onValueChange={([v]) => update("taskDurationSeconds", v)}
              min={30}
              max={300}
              step={10}
              className="py-4"
              data-testid="slider-duration"
            />
            <p className="text-sm font-medium text-muted-foreground text-center">Shorter games are better for quick bursts of energy!</p>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground font-medium">
        Changes save automatically.
      </p>
    </div>
  );
}

function Row({ label, icon, hint, children }: { label: string; icon: React.ReactNode; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-bold flex items-center gap-2">
          {icon} {label}
        </Label>
        {children}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{hint}</p>
    </div>
  );
}
