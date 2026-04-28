import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Shell } from "@/components/layout/Shell";
import Home from "@/pages/home";
import GamesHub from "@/pages/games/index";
import Progress from "@/pages/progress";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Assistant from "@/pages/assistant";
import Leaderboard from "@/pages/leaderboard";
import { useEffect } from "react";
import AttentionResponse from "@/pages/games/attention-response";
import ContinuousPerformance from "@/pages/games/continuous-performance";
import TaskSwitching from "@/pages/games/task-switching";
import LetterSound from "@/pages/games/letter-sound";
import WordFormation from "@/pages/games/word-formation";
import VisualTracking from "@/pages/games/visual-tracking";
import HighlightedReading from "@/pages/games/highlighted-reading";
import SocialScenario from "@/pages/games/social-scenario";
import EmotionRecognition from "@/pages/games/emotion-recognition";
import SensoryFiltering from "@/pages/games/sensory-filtering";
import LetterRecognition from "@/pages/games/letter-recognition";
import PatternRecognition from "@/pages/games/pattern-recognition";
import SequencingTask from "@/pages/games/sequencing-task";
import AudioWordMatch from "@/pages/games/audio-word-match";
import SpeechEcho from "@/pages/games/speech-echo";
import MirrorMatch from "@/pages/games/mirror-match";
import { SettingsProvider } from "@/contexts/settings-context";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!localStorage.getItem("brightways_user_id")) {
      setLocation("/login");
    }
  }, [setLocation]);
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route>
        <AuthGuard>
          <Shell>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/games" component={GamesHub} />
              <Route path="/progress" component={Progress} />
              <Route path="/leaderboard" component={Leaderboard} />
              <Route path="/assistant" component={Assistant} />
              <Route path="/settings" component={Settings} />

              <Route path="/games/attention-response" component={AttentionResponse} />
              <Route path="/games/continuous-performance" component={ContinuousPerformance} />
              <Route path="/games/task-switching" component={TaskSwitching} />
              <Route path="/games/letter-sound" component={LetterSound} />
              <Route path="/games/word-formation" component={WordFormation} />
              <Route path="/games/visual-tracking" component={VisualTracking} />
              <Route path="/games/highlighted-reading" component={HighlightedReading} />
              <Route path="/games/social-scenario" component={SocialScenario} />
              <Route path="/games/emotion-recognition" component={EmotionRecognition} />
              <Route path="/games/sensory-filtering" component={SensoryFiltering} />
              <Route path="/games/letter-recognition" component={LetterRecognition} />
              <Route path="/games/pattern-recognition" component={PatternRecognition} />
              <Route path="/games/sequencing-task" component={SequencingTask} />
              <Route path="/games/audio-word-match" component={AudioWordMatch} />
              <Route path="/games/speech-echo" component={SpeechEcho} />
              <Route path="/games/mirror-match" component={MirrorMatch} />

              <Route component={NotFound} />
            </Switch>
          </Shell>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
