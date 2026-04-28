import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Target, Zap, Shuffle, Music, Type, Eye, BookOpen, Users, Smile,
  ShieldAlert, Play, Star, Sparkles, GitBranch, ListOrdered, Headphones, Mic, Camera,
} from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Category = "All" | "Attention" | "Dyslexia" | "Autism" | "Voice & Camera";

const GAMES = [
  // Attention / ADHD
  { id: "attention-response", title: "Catch the Green!", description: "Click fast when you see green, stop when you see red.", icon: Target, color: "from-green-400 to-emerald-600", emoji: "🟢", skill: "Attention", category: "Attention" },
  { id: "continuous-performance", title: "Symbol Stream", description: "Spot your special symbol in a moving stream.", icon: Zap, color: "from-blue-400 to-indigo-600", emoji: "⚡", skill: "Focus", category: "Attention" },
  { id: "task-switching", title: "Rule Switcher", description: "Pay attention! The rules might change suddenly.", icon: Shuffle, color: "from-purple-400 to-violet-600", emoji: "🔀", skill: "Flexibility", category: "Attention" },
  { id: "visual-tracking", title: "Star Tracker", description: "Follow the moving star carefully with your mouse.", icon: Eye, color: "from-cyan-400 to-sky-600", emoji: "🌠", skill: "Tracking", category: "Attention" },
  { id: "sensory-filtering", title: "Laser Focus", description: "Ignore the bouncy distractions and click the target!", icon: ShieldAlert, color: "from-indigo-400 to-purple-700", emoji: "🎯", skill: "Filtering", category: "Attention" },

  // Dyslexia
  { id: "letter-recognition", title: "Letter Hunt", description: "Find the matching letter — watch out for tricky look-alikes!", icon: Sparkles, color: "from-fuchsia-400 to-pink-600", emoji: "🔤", skill: "Letters", category: "Dyslexia", isNew: true },
  { id: "letter-sound", title: "Sound Match", description: "Listen closely and pick the right letter sound.", icon: Music, color: "from-yellow-400 to-amber-600", emoji: "🎵", skill: "Reading", category: "Dyslexia" },
  { id: "word-formation", title: "Word Builder", description: "Drag the letters to spell the secret word.", icon: Type, color: "from-orange-400 to-red-600", emoji: "📝", skill: "Spelling", category: "Dyslexia" },
  { id: "highlighted-reading", title: "Read Along", description: "Follow the highlighted words as they are read to you.", icon: BookOpen, color: "from-rose-400 to-pink-600", emoji: "📖", skill: "Reading", category: "Dyslexia" },
  { id: "audio-word-match", title: "Hear It, Pick It", description: "Listen carefully and tap the spoken word.", icon: Headphones, color: "from-teal-400 to-cyan-600", emoji: "🎧", skill: "Listening", category: "Dyslexia", isNew: true },

  // Autism
  { id: "social-scenario", title: "Friend Choices", description: "What would you do? Pick the best friendly response.", icon: Users, color: "from-teal-400 to-emerald-600", emoji: "🤝", skill: "Social", category: "Autism" },
  { id: "emotion-recognition", title: "Face Feelings", description: "Look at the faces and guess how they are feeling.", icon: Smile, color: "from-pink-400 to-rose-600", emoji: "😊", skill: "Emotions", category: "Autism" },
  { id: "pattern-recognition", title: "Pattern Power", description: "What comes next? Find the missing piece in the pattern.", icon: GitBranch, color: "from-purple-400 to-fuchsia-600", emoji: "🧩", skill: "Patterns", category: "Autism", isNew: true },
  { id: "sequencing-task", title: "In Order, Please!", description: "Drag the steps so they happen in the right order.", icon: ListOrdered, color: "from-amber-400 to-orange-600", emoji: "🪜", skill: "Sequencing", category: "Autism", isNew: true },

  // Voice & Camera
  { id: "speech-echo", title: "Say It Right", description: "Listen to the word, then say it out loud!", icon: Mic, color: "from-red-400 to-rose-700", emoji: "🎤", skill: "Speech", category: "Voice & Camera", isNew: true },
  { id: "mirror-match", title: "Mirror Mirror", description: "Use the camera to copy the action shown.", icon: Camera, color: "from-sky-400 to-blue-700", emoji: "📷", skill: "Movement", category: "Voice & Camera", isNew: true },
];

const CATEGORIES: Category[] = ["All", "Attention", "Dyslexia", "Autism", "Voice & Camera"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function GamesHub() {
  const [filter, setFilter] = useState<Category>("All");

  const visible = filter === "All" ? GAMES : GAMES.filter((g) => g.category === filter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 text-center items-center justify-center py-6">
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
          <Star className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Game Playground
        </h1>
        <p className="text-xl text-muted-foreground font-medium max-w-2xl">
          Pick a game to play and train your brain! All games adapt to how you play.
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Category)} className="flex justify-center">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-2xl">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c} className="rounded-xl font-bold px-4 py-2" data-testid={`filter-${c}`}>
              {c}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <motion.div
        key={filter}
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {visible.map((game) => (
          <motion.div key={game.id} variants={item}>
            <Link href={`/games/${game.id}`}>
              <Card className="group h-full cursor-pointer overflow-hidden border-4 border-transparent bg-card transition-all hover:border-primary/50 hover:shadow-xl hover:-translate-y-1">
                <CardContent className="p-0">
                  <div className={`relative bg-gradient-to-br ${game.color} p-6 flex justify-center items-center h-44`}>
                    <span className="text-7xl drop-shadow-lg transition-transform group-hover:scale-110 duration-300">
                      {game.emoji}
                    </span>
                    <game.icon className="absolute top-3 left-3 h-6 w-6 text-white/70" />
                    {game.isNew && (
                      <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-black rounded-full px-2 py-1 shadow">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="p-6 relative">
                    <div className="absolute -top-4 right-4 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-md text-foreground">
                      {game.skill}
                    </div>
                    <h3 className="mb-2 text-2xl font-black text-foreground">{game.title}</h3>
                    <p className="text-muted-foreground font-medium mb-6 min-h-[3rem]">{game.description}</p>

                    <Button className="w-full rounded-xl text-lg font-bold shadow-md group-hover:bg-primary" size="lg" data-testid={`btn-play-${game.id}`}>
                      <Play className="mr-2 h-5 w-5" fill="currentColor" /> Play Game
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
