/**
 * What Lily knows. Everything here is scripted on purpose: she can only say things we have checked,
 * so she can't make up features or prices. To teach her something, add an intent below.
 * Facts come from the marketing article and from what the app really does today.
 */
import { USE_MOCKS } from "@/lib/api/endpoints";

export type Intent = {
  id: string;
  /** Shown as a tappable question under Lily's message. */
  chip?: string;
  /** Each pattern that matches adds one point. The intent with the most points answers. */
  match: RegExp[];
  /** Patterns that are a clear signal of this topic. Each one adds three points, so a single clear word beats a vague one. */
  strong?: RegExp[];
  answer: string;
  /** What she adds when someone says "tell me more" right after this answer. */
  more?: string;
  /** A page Lily can send people to. She only goes there on request ("take me to...") and otherwise offers a button. */
  href?: string;
  hrefLabel?: string;
  /** Stops her speaking. */
  stop?: boolean;
};

/** "Take me to", "open", "show me": the words that mean "go there now". */
export const GO_VERB = /\b(take me|bring me|go to|open|show me|navigate|head to|send me)\b/i;

export const WAKE_REPLIES = ["Yes?", "I'm here.", "Go ahead, I'm listening."];

export function welcomeText(canListen: boolean): string {
  const close = canListen
    ? "Whenever you need anything, just say, Hey Lily, and I'll be right here. Tap the little microphone to switch that on."
    : "Whenever you need anything, just tap me, and I'll be right here.";
  return `Hi, I'm Lily. Welcome to LSync, your unified learning portfolio. If you learn on YouTube, Coursera, Udemy, edX, GitHub, or just by reading, LSync brings it together in one place, so you can see your progress, organise your skills, and choose what to share. Take a look around, or tap a platform to see how it works. ${close}`;
}

export const FALLBACK =
  "I'm not sure I got that one, and I'd rather not guess. I can tell you what LSync is, how it works, which platforms connect, whether it's free, who it's for, or how your information is kept private. Which would you like?";

/** Said when someone asks for help or what she can do. */
const HELP =
  "You can ask me things like: what is LSync, how does it work, which platforms can I connect, is it free, is it private, or how do I get started. You can also say, take me to the blog.";

export const INTENTS: Intent[] = [
  { id: "stop", match: [/\b(stop|pause|quiet|silence|shush|enough)\b/i, /\bbe quiet\b/i], strong: [/\b(stop talking|be quiet|shut up)\b/i], answer: "Okay, I'll stay quiet. Tap my name whenever you want me again.", stop: true },
  {
    id: "blog",
    chip: "Read the blog",
    match: [/\barticles?\b/i, /\bread (more|the)\b/i, /\bposts?\b/i],
    strong: [/\bblogs?\b/i],
    answer: "Our blog has articles on keeping track of what you learn online, and how to turn it into something you can show. Here is where to find them.",
    href: "/blog",
    hrefLabel: "Open the blog",
  },
  {
    id: "signin",
    match: [/\bi already have an account\b/i],
    strong: [/\bsign ?in\b/i, /\blog ?in\b/i, /\blog me in\b/i],
    answer: "You can sign in here. If you forget your password, there is a reset link on that page.",
    href: "/login",
    hrefLabel: "Go to sign in",
  },
  {
    id: "password",
    match: [/\bpassword\b/i, /\bcan'?t (get in|sign in|log in)\b/i, /\blocked out\b/i],
    strong: [/\bforgot(ten)?\b/i, /\breset\b/i],
    answer: "If you forgot your password, choose Forgot password on the sign-in page and enter your email. You will get a link to set a new one.",
    href: "/forgot-password",
    hrefLabel: "Reset my password",
  },
  {
    id: "start",
    chip: "How do I start?",
    match: [/\b(start|begin|join)\b/i, /\bhow (do|can) i (start|begin|join|use)\b/i, /\bnew here\b/i],
    strong: [/\bget started\b/i, /\bsign ?up\b/i, /\bregister\b/i, /\bcreate (an |my )?account\b/i, /\bopen an account\b/i],
    answer:
      "Select Get started and create your account. Next you will see a page to link your learning sources. You can skip it and connect them later from your dashboard.",
    more: "It takes a minute. You need a name, a username, your email and a password. After that you land on your dashboard.",
    href: "/register",
    hrefLabel: "Get started",
  },
  {
    id: "what",
    chip: "What is LSync?",
    match: [/\btell me about\b/i, /\bexplain\b/i, /\bwhat do you do\b/i, /\bwhat('?s| is)? (this|it)\b/i, /\bwhat('?s| is) this (site|website|page|app)\b/i, /\bpurpose\b/i],
    strong: [/\bwhat('?s| is| are)? (is )?lsync\b/i, /\bwhat does lsync do\b/i, /\babout lsync\b/i, /\bwhat is this (site|website|app|platform)\b/i],
    answer:
      "LSync is your unified learning portfolio. It brings what you learn on different platforms into one organised view, so you can track your progress, organise your skills, and choose what you want to share.",
    more: "Think of it as one home for your learning. Instead of checking five sites to remember what you did, you see your progress, skills and activity together.",
  },
  {
    id: "how",
    chip: "How does it work?",
    match: [/\bsteps?\b/i, /\bprocess\b/i, /\bhow (do|can) i use\b/i],
    strong: [/\bhow (does|do) (it|lsync|this|the (site|app|platform)) work/i, /\bhow it works\b/i, /\bhow does it\b/i, /\bhow to use\b/i],
    answer:
      "Three steps. First, connect the places you learn. Second, log what you study, and every log counts towards a skill. Third, see your progress, skills and activity together on your dashboard.",
    more: "A log is simple: the skill, the platform, the day, and how long you studied. You can add as many as you like, and your charts update as you go.",
  },
  {
    id: "platforms",
    chip: "Which platforms?",
    match: [/\bplatforms?\b/i, /\bsources?\b/i, /\bwebsites?\b/i, /\blink (my|a|an)\b/i, /\bconnect\b/i, /\bwork with\b/i],
    strong: [/\bwhich (platforms?|sites?|websites?|sources?)\b/i, /\bintegrat/i, /\bsupport(ed)?\b/i],
    answer:
      "GitHub, YouTube, Coursera, Udemy, edX, and blogs or docs. GitHub connects directly, so your commits become learning activity. For the others, you link your profile and add what you finish, because most learning platforms don't share learner data publicly.",
    more: "So GitHub is automatic, and the rest are one quick log each time you finish something. We'd rather be clear about that than promise a sync that doesn't exist.",
  },
  {
    id: "github",
    match: [/\bcommits?\b/i, /\brepos?(itories|itory)?\b/i, /\bcode\b/i],
    strong: [/\bgithub\b/i, /\bgit hub\b/i],
    answer:
      "GitHub is the one that connects directly. You sign in with GitHub, and your commits and repositories show up as learning activity in LSync.",
  },
  {
    id: "others",
    match: [/\bcourses?\b/i, /\bcertificates?\b/i],
    strong: [/\b(coursera|udemy|edx|youtube|you tube)\b/i],
    answer:
      "For Coursera, Udemy, edX and YouTube, you link your profile and then log what you finish. Those platforms don't share learner data publicly, so we ask you to add it yourself, and it only takes a moment.",
    more: "Certificates aren't uploaded yet. For now you record the course as a log, with the skill, the date and the time you spent.",
  },
  {
    id: "who",
    chip: "Who is it for?",
    match: [/\bstudents?\b/i, /\bgraduates?\b/i, /\bjob seekers?\b/i, /\bcareer\b/i, /\bprofessionals?\b/i, /\bself[- ]taught\b/i, /\bteachers?\b/i, /\bbeginners?\b/i],
    strong: [/\bwho (is it|is this|can|should|uses?)\b/i, /\bwho is lsync for\b/i, /\bis it for me\b/i, /\bfor (me|beginners)\b/i],
    answer:
      "Students, recent graduates and job seekers, career switchers, self-taught learners, and working professionals. Anyone who learns online and wants to see how far they have come.",
  },
  {
    id: "private",
    chip: "Is it private?",
    match: [/\bshare\b/i, /\bpublic\b/i, /\bsafe\b/i, /\bsecure\b/i, /\bshowcase\b/i, /\bdata\b/i, /\bsee my\b/i],
    strong: [/\bprivacy\b/i, /\bprivate\b/i, /\bwho can see\b/i, /\bis my (data|information) (safe|secure)\b/i],
    answer:
      "You stay in control of what is shared. Your portfolio is private by default, and a shareable learning profile is planned, where you choose what appears on it.",
    more: "You can delete your account from your profile whenever you like.",
  },
  {
    id: "survey",
    match: [/\bresearch\b/i, /\bstatistics?\b/i, /\bpercent\b/i, /\brespondents?\b/i, /\b(44|72)\b/i, /\bnumbers\b/i],
    strong: [/\bsurvey\b/i],
    answer:
      "In our first small survey of eighteen learners, forty four percent said they had lost track of a course or their progress, and seventy two percent said seeing their progress motivates them. It is a small survey, so treat it as a signal, not a verdict.",
  },
  {
    id: "pricing",
    match: [/\bfees?\b/i, /\bsubscri/i, /\bplans?\b/i, /\bpremium\b/i, /\bupgrade\b/i],
    strong: [/\bpric(e|es|ing)\b/i, /\bcosts?\b/i, /\bfree\b/i, /\bpay(ing|ment|ments)?\b/i, /\bpaid\b/i, /\bcharge[sd]?\b/i, /\bhow much\b/i, /\bafford/i, /\bmoney\b/i, /\b(need|have|got) to pay\b/i],
    answer:
      "Good question. I don't have pricing details, so I won't guess. What I can tell you is that creating an account doesn't ask you for any payment, and you can try the demo first. The team will share pricing when it's decided.",
    href: "/register",
    hrefLabel: "Create an account",
  },
  {
    id: "demo",
    match: [/\bsample\b/i, /\btest account\b/i, /\bexample\b/i, /\bpreview\b/i],
    strong: [/\bdemo\b/i, /\btry (it|this|out|lsync)\b/i, /\bcan i try\b/i],
    answer: USE_MOCKS
      ? "This is a demo. Sign in with demo at lsync dot app, and the password Demo1234, or create a new account to see the empty first-time experience."
      : "You can create an account and try it yourself.",
    href: "/login",
    hrefLabel: "Go to sign in",
  },
  {
    id: "features",
    match: [/\bcapabilit/i, /\bbenefits?\b/i, /\bwhy (use|should)\b/i],
    strong: [/\bfeatures?\b/i, /\bwhat can (i|you)\b/i, /\bwhat (do|will) i get\b/i],
    answer: "You can connect your sources, log what you learn, track progress by skill, review your activity and analytics, and see how other learners are doing. A shareable profile is planned.",
  },
  {
    id: "skills",
    match: [/\bprogress\b/i, /\btrack(ing)?\b/i, /\bdashboard\b/i, /\banalytics\b/i, /\bcharts?\b/i],
    strong: [/\bskills?\b/i, /\bhow do i (log|add|record)\b/i, /\blog(s|ging)?\b/i],
    answer:
      "Every log you add counts towards a skill, so your dashboard shows where your time is going, which skills are growing, and how active you have been lately.",
    more: "Each log has the skill, the platform, the day and the minutes you studied. Your dashboard, skills and activity pages are built from those.",
  },
  {
    id: "different",
    match: [/\blinkedin\b/i, /\bnotion\b/i, /\bspreadsheet\b/i, /\bcompare\b/i, /\bunique\b/i],
    strong: [/\bdifferent\b/i, /\bwhy lsync\b/i, /\bhow is (it|this|lsync) different\b/i, /\bsocial (network|media)\b/i],
    answer:
      "LSync isn't a social network, and it doesn't replace the courses you take. It's one private place where your learning from many platforms comes together, and you decide what to share.",
  },
  {
    id: "device",
    match: [/\bmobile\b/i, /\bphone\b/i, /\bandroid\b/i, /\biphone\b/i, /\bdownload\b/i, /\binstall\b/i, /\bapp store\b/i],
    strong: [/\bis there an app\b/i, /\bmobile app\b/i],
    answer:
      "LSync works in your browser, including on a phone. There isn't a separate app to download yet.",
  },
  {
    id: "team",
    match: [/\bbetechified\b/i, /\bcapstone\b/i, /\bteam\b/i],
    strong: [/\bwho (made|built|created|designed)\b/i, /\bcreators?\b/i, /\bbehind (lsync|this)\b/i],
    answer:
      "LSync is a capstone project from the BeTechified programme, built by a team of designers, developers and marketers.",
  },
  {
    id: "help",
    match: [/\bhelp\b/i, /\bwhat can i ask\b/i, /\bwhat can you (do|say|tell)\b/i, /\bwhat do you know\b/i],
    strong: [/\bhelp me\b/i, /\bwhat can you do\b/i],
    answer: HELP,
  },
  { id: "me", match: [/\byour name\b/i], strong: [/\bwho are you\b/i, /\bare you (a |an )?(real|human|person|ai|robot|bot)\b/i], answer: "I'm Lily, LSync's voice guide. I'm an automated assistant, not a person. I can tell you about LSync, how it works, and where to start." },
  { id: "thanks", match: [/\bthank/i, /\bcheers\b/i, /\bappreciate\b/i, /\bgreat\b/i, /\bnice\b/i], answer: "You're welcome. I'm here if you need anything else." },
  { id: "hello", match: [/^\s*(hi|hello|hey|good (morning|afternoon|evening)|how are you)\b/i], answer: "Hi there. What would you like to know about LSync?" },
];

export const CHIPS = INTENTS.filter((i) => i.chip);

/** "Tell me more", "go on", "and?": a follow-up to whatever she said last. */
const MORE = /^\s*(tell me more|more|go on|and\??|continue|carry on|what else|anything else|explain( that)?( more)?|can you explain|how so|really\??)\s*[.?!]*\s*$/i;

function score(intent: Intent, text: string): number {
  let n = 0;
  for (const re of intent.match) if (re.test(text)) n += 1;
  for (const re of intent.strong ?? []) if (re.test(text)) n += 3;
  return n;
}

/**
 * Picks the intent that best fits. A clear word counts for more than a vague one,
 * so "do I have to pay before using the platform?" is about price, not platforms.
 * `last` is the intent she answered before, so "tell me more" can continue it.
 */
export function matchIntent(text: string, last?: string | null): Intent | null {
  if (last && MORE.test(text)) {
    const prev = INTENTS.find((i) => i.id === last);
    if (prev?.more) return { id: `${prev.id}-more`, match: [], answer: prev.more };
    if (prev) return { id: `${prev.id}-more`, match: [], answer: "That's all I have on that one. Ask me about another part of LSync, or say help and I'll list what I can answer." };
  }
  let best: Intent | null = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    const s = score(intent, text);
    if (s > bestScore) {
      best = intent;
      bestScore = s;
    }
  }
  return best;
}
