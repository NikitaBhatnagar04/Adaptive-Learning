import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";

export default function SocialScenario() {
  return (
    <GameWrapper
      gameType="social_scenario"
      title="Friend Choices"
      description="Read the story and choose the kindest thing to do. What would a good friend do?"
      difficulty={2}
    >
      {({ isActive, onComplete }) => <SocialScenarioGame isActive={isActive} onComplete={onComplete} />}
    </GameWrapper>
  );
}

const ALL_SCENARIOS = [
  {
    image: "😢",
    text: "Your friend drops their ice cream on the ground and looks very sad.",
    options: [
      { text: "Laugh at them", isCorrect: false, feedback: "Laughing makes them feel worse. A good friend stays kind." },
      { text: "Say 'I'm sorry!' and offer to share yours", isCorrect: true, feedback: "Amazing! Sharing shows you really care about your friend." },
      { text: "Ignore them and keep eating", isCorrect: false, feedback: "Ignoring a sad friend is not helpful. Try to cheer them up!" }
    ]
  },
  {
    image: "🎮",
    text: "You want to play video games but your sibling is watching their favourite show.",
    options: [
      { text: "Turn off the TV", isCorrect: false, feedback: "That would upset them. Wait your turn patiently!" },
      { text: "Ask nicely when they will be done", isCorrect: true, feedback: "Yes! Asking nicely and waiting shows respect." },
      { text: "Cry and scream", isCorrect: false, feedback: "It's better to use calm words to ask." }
    ]
  },
  {
    image: "🎨",
    text: "A classmate asks to borrow your favourite marker.",
    options: [
      { text: "Say 'No, it's mine!' rudely", isCorrect: false, feedback: "Being rude hurts feelings. Try to be kind." },
      { text: "Hide the marker", isCorrect: false, feedback: "Hiding things is not a friendly thing to do." },
      { text: "Say 'Sure, just give it back when done!'", isCorrect: true, feedback: "Great! You shared while also taking care of your things." }
    ]
  },
  {
    image: "🏃",
    text: "During a race, your friend falls and hurts their knee.",
    options: [
      { text: "Keep running to win", isCorrect: false, feedback: "A true friend stops to check if their friend is okay first." },
      { text: "Stop and ask if they are okay", isCorrect: true, feedback: "Wonderful! Being kind is more important than winning." },
      { text: "Laugh and point", isCorrect: false, feedback: "Laughing at someone who is hurt is very unkind." }
    ]
  },
  {
    image: "🎁",
    text: "It's your friend's birthday but you forgot to bring a gift.",
    options: [
      { text: "Pretend it's not their birthday", isCorrect: false, feedback: "It's better to be honest and still wish them well." },
      { text: "Say 'Happy Birthday! I forgot, but I'm happy for you!'", isCorrect: true, feedback: "Yes! A warm wish means a lot, even without a gift." },
      { text: "Avoid them the whole day", isCorrect: false, feedback: "Avoiding your friend on their special day would hurt their feelings." }
    ]
  },
  {
    image: "🧩",
    text: "A new student joins your class and looks scared and alone.",
    options: [
      { text: "Ignore them — they are new", isCorrect: false, feedback: "Remember how it feels to be new somewhere. Be kind." },
      { text: "Go say hello and invite them to play", isCorrect: true, feedback: "Super kind! You could be making a new best friend!" },
      { text: "Tell your friends not to talk to them", isCorrect: false, feedback: "That's very unkind. Everyone deserves to feel welcome." }
    ]
  },
  {
    image: "🍕",
    text: "At lunch you have lots of food but your friend forgot their lunch.",
    options: [
      { text: "Eat all your food while they watch", isCorrect: false, feedback: "Try to share — even a little bit helps a hungry friend." },
      { text: "Offer to share some of your lunch", isCorrect: true, feedback: "That's so thoughtful! Sharing food is a great act of kindness." },
      { text: "Tell them it's their fault", isCorrect: false, feedback: "Blaming doesn't help. Kindness does!" }
    ]
  },
  {
    image: "😠",
    text: "Your friend says something unkind to you by mistake.",
    options: [
      { text: "Shout back at them", isCorrect: false, feedback: "Shouting can make things worse. Take a deep breath!" },
      { text: "Tell them calmly that it hurt your feelings", isCorrect: true, feedback: "Great! Talking calmly is the best way to solve problems." },
      { text: "Never speak to them again", isCorrect: false, feedback: "Giving up on a friendship for one mistake isn't fair." }
    ]
  },
  {
    image: "📚",
    text: "Your classmate is struggling with homework and asks for help.",
    options: [
      { text: "Say 'Figure it out yourself!'", isCorrect: false, feedback: "That's not very friendly. Helping others is kind." },
      { text: "Help them understand, but don't give all the answers", isCorrect: true, feedback: "Perfect! Helping them learn is better than just giving answers." },
      { text: "Do all their homework for them", isCorrect: false, feedback: "Doing it for them stops them from learning." }
    ]
  },
  {
    image: "⚽",
    text: "You are playing football and your team is losing. A teammate misses a shot.",
    options: [
      { text: "Blame them loudly for missing", isCorrect: false, feedback: "Blaming teammates hurts confidence. We all miss sometimes!" },
      { text: "Say 'Don't worry, keep trying!'", isCorrect: true, feedback: "Yes! Being encouraging helps everyone do better." },
      { text: "Refuse to pass to them anymore", isCorrect: false, feedback: "Everyone needs a chance. Keep believing in your team!" }
    ]
  },
  {
    image: "🐶",
    text: "You notice your friend is very sad today but won't say why.",
    options: [
      { text: "Leave them alone and don't say anything", isCorrect: false, feedback: "Sometimes just being there matters even if they won't talk." },
      { text: "Sit with them and say 'I'm here if you need me'", isCorrect: true, feedback: "Lovely! Your presence and kindness can make a big difference." },
      { text: "Tell everyone your friend is sad", isCorrect: false, feedback: "Never share someone's private feelings without their permission." }
    ]
  },
  {
    image: "🎤",
    text: "Your friend is nervous about performing in the school show.",
    options: [
      { text: "Tell them they will probably mess up", isCorrect: false, feedback: "That makes nerves worse! Be encouraging instead." },
      { text: "Say 'You can do it! I believe in you!'", isCorrect: true, feedback: "Brilliant! Believing in your friend gives them confidence." },
      { text: "Don't come to watch them perform", isCorrect: false, feedback: "Showing up means a lot to your friend." }
    ]
  },
];

const ROUNDS_PER_GAME = 5;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function SocialScenarioGame({ isActive, onComplete }: { isActive: boolean; onComplete: (stats: any) => void }) {
  const [scenarios, setScenarios] = useState<typeof ALL_SCENARIOS>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const statsRef = useRef({ correct: 0, wrong: 0, startTime: 0 });

  useEffect(() => {
    if (!isActive) return;
    statsRef.current = { correct: 0, wrong: 0, startTime: Date.now() };
    setScore(0);
    setRound(0);
    setSelectedOption(null);
    setScenarios(shuffle(ALL_SCENARIOS).slice(0, ROUNDS_PER_GAME));
  }, [isActive]);

  const handleSelect = (index: number) => {
    if (selectedOption !== null || scenarios.length === 0) return;
    setSelectedOption(index);

    const isCorrect = scenarios[round].options[index].isCorrect;
    if (isCorrect) {
      statsRef.current.correct++;
      setScore((s) => s + 50);
    } else {
      statsRef.current.wrong++;
    }

    setTimeout(() => {
      if (round + 1 >= ROUNDS_PER_GAME) {
        onComplete({
          score: statsRef.current.correct * 50,
          accuracy: Math.round((statsRef.current.correct / ROUNDS_PER_GAME) * 100),
          wrongClicks: statsRef.current.wrong,
        });
      } else {
        setRound((r) => r + 1);
        setSelectedOption(null);
      }
    }, 3000);
  };

  if (scenarios.length === 0 || round >= scenarios.length) return null;
  const currentItem = scenarios[round];

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto gap-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-black text-muted-foreground">Story {round + 1} of {ROUNDS_PER_GAME}</span>
        <span className="text-lg font-black text-primary">⭐ {score} pts</span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${((round + (selectedOption !== null ? 1 : 0)) / ROUNDS_PER_GAME) * 100}%` }}
        />
      </div>

      {/* Scenario card */}
      <div className="flex flex-col items-center bg-card rounded-3xl p-6 md:p-8 shadow-md border-4 border-primary/10">
        <div className="text-7xl mb-4">{currentItem.image}</div>
        <h2 className="text-xl md:text-2xl font-bold text-center text-foreground max-w-xl leading-relaxed">
          {currentItem.text}
        </h2>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
        {currentItem.options.map((opt, idx) => (
          <motion.button
            key={`${round}-${idx}`}
            whileHover={selectedOption === null ? { scale: 1.02 } : {}}
            whileTap={selectedOption === null ? { scale: 0.98 } : {}}
            onClick={() => handleSelect(idx)}
            disabled={selectedOption !== null}
            className={`p-5 rounded-2xl text-left text-lg font-bold transition-all border-4 shadow-sm ${
              selectedOption === null
                ? "bg-muted/50 border-transparent hover:border-primary/50 hover:bg-primary/5"
                : selectedOption === idx
                ? opt.isCorrect
                  ? "bg-green-100 border-green-500 text-green-900"
                  : "bg-red-100 border-red-500 text-red-900"
                : opt.isCorrect
                ? "bg-green-50 border-green-300 opacity-70"
                : "bg-muted/30 border-transparent opacity-40"
            }`}
          >
            {opt.text}
          </motion.button>
        ))}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {selectedOption !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl text-lg font-bold text-center max-w-2xl mx-auto w-full ${
              currentItem.options[selectedOption].isCorrect
                ? "bg-green-500 text-white"
                : "bg-orange-100 text-orange-900 border-2 border-orange-300"
            }`}
          >
            {currentItem.options[selectedOption].isCorrect ? "🎉 " : "💡 "}
            {currentItem.options[selectedOption].feedback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
