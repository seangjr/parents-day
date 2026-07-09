import type { QuizAnswer } from "@/lib/love-styles";

export interface QuizOptionDef {
  letter: QuizAnswer;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOptionDef[];
}

/**
 * The five forced-choice questions. Every question offers exactly one option per
 * Love Style, mapped by letter (A Sayang · B Lepak · C Help · D Tapau · E Hug —
 * SPEC "Answer → style map") so the shared scoring engine (lib/scoring) tallies
 * answers directly. Copy is Malaysian-inflected per the brief.
 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "long-day",
    prompt: "It’s been a long day. What lands as love from your family?",
    options: [
      { letter: "A", text: "A message: “so proud of you, sayang.”" },
      { letter: "B", text: "Someone free to just lepak and talk story." },
      { letter: "C", text: "Finding a chore already quietly done for you." },
      { letter: "D", text: "Your favourite kuih tapau-ed home just for you." },
      { letter: "E", text: "A long, warm hug the moment you walk in." },
    ],
  },
  {
    id: "show-love",
    prompt: "How do you most naturally show someone you sayang them?",
    options: [
      { letter: "A", text: "I tell them, out loud, exactly why they matter." },
      { letter: "B", text: "I make the time to be there and hang out." },
      { letter: "C", text: "I quietly sort out whatever they need doing." },
      { letter: "D", text: "I tapau their favourite food or grab a little something." },
      { letter: "E", text: "I pull them in for a big hug." },
    ],
  },
  {
    id: "celebrate",
    prompt: "Your family is celebrating you. The best version is…",
    options: [
      { letter: "A", text: "Everyone sharing kind words around the table." },
      { letter: "B", text: "A whole evening just lepak-ing together, no rush." },
      { letter: "C", text: "They handle all the cooking and the clearing-up." },
      { letter: "D", text: "A thoughtful gift, or a spread tapau-ed from your spot." },
      { letter: "E", text: "Plenty of hugs and everyone sitting close." },
    ],
  },
  {
    id: "far-away",
    prompt: "You miss someone far away. What do you wish for most?",
    options: [
      { letter: "A", text: "A voice note telling you they love you." },
      { letter: "B", text: "A long call, just to be together a while." },
      { letter: "C", text: "Them offering to take something off your plate." },
      { letter: "D", text: "A surprise parcel of snacks in the post." },
      { letter: "E", text: "A real, proper hug — finally." },
    ],
  },
  {
    id: "gather",
    prompt: "When the whole family gathers, you feel most loved when…",
    options: [
      { letter: "A", text: "Someone says the words you needed to hear." },
      { letter: "B", text: "You get unhurried time together." },
      { letter: "C", text: "Someone lightens your load without being asked." },
      { letter: "D", text: "There’s food and little gifts to share around." },
      { letter: "E", text: "There’s warmth — hands held, hugs given freely." },
    ],
  },
];
