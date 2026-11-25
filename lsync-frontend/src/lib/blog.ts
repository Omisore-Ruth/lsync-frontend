/**
 * Blog content. Post 1 is the marketing team's article (LSync Website Blog Post 1), kept word for word.
 * Posts 2 and 3 are drafts written for the site and should be read and approved by the marketing team.
 * To add a post, add an object to POSTS with a new slug.
 */
export type Block =
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "features"; items: { title: string; text: string }[] }
  | { t: "audience"; items: { title: string; text: string }[] }
  | { t: "stats"; figures: { value: string; label: string }[]; caveat: string }
  | { t: "note"; text: string }
  | { t: "quote"; text: string };

export type Section = { id: string; title: string; blocks: Block[] };

export type Post = {
  slug: string;
  /** A short label on the card, such as "Learning habits". */
  tag: string;
  title: string;
  lede: string;
  author: string;
  readingMinutes: number;
  sections: Section[];
  closing: { text: string; cta: string; signoff: string };
};

export const POSTS: Post[] = [
  {
    slug: "take-control-of-your-online-learning-journey",
    tag: "Introducing LSync",
    title: "How to Take Control of Your Online Learning Journey: Discover LSync",
    lede: "Learning should move you forward, not leave you struggling to remember what you have studied, where you saved your resources or how much progress you have made.",
    author: "The LSync team",
    readingMinutes: 5,
    sections: [
      {
        id: "the-new-way-we-learn",
        title: "The New Way We Learn",
        blocks: [
          { t: "p", text: "Learning has changed significantly. Today, you do not have to sit in a traditional classroom to acquire valuable knowledge or develop new skills. With an internet connection and a desire to grow, you can learn almost anything from different online platforms." },
          { t: "p", text: "You can watch tutorials on YouTube, take professional courses on Coursera or Udemy, explore technical resources on GitHub, read educational articles and participate in online learning communities." },
          { t: "p", text: "These opportunities have made learning more flexible and accessible than ever before." },
          { t: "p", text: "But there is a challenge many learners face: how do you keep track of everything you are learning?" },
          { t: "p", text: "You may start a course on one platform, save useful videos on another, read articles from different websites and practise new skills through personal projects. Before long, your learning activities become scattered across multiple platforms." },
          { t: "p", text: "You may forget which lessons you have completed, lose track of useful resources or struggle to see how much progress you have made." },
          { t: "p", text: "Learning should be an organised journey. This is where LSync comes in." },
        ],
      },
      {
        id: "why-managing-online-learning-is-difficult",
        title: "Why Managing Your Online Learning Can Be Difficult",
        blocks: [
          { t: "p", text: "The freedom to learn from different sources is valuable, but managing multiple learning activities can become overwhelming. Consider some familiar situations:" },
          {
            t: "ul",
            items: [
              "You enrol in an online course but forget how far you have progressed.",
              "You watch several tutorials but cannot easily remember which ones you have completed.",
              "You find useful learning materials but struggle to locate them when you need them.",
              "You acquire new knowledge but find it difficult to organise the skills you are developing.",
              "You want to demonstrate what you have been learning but do not have one organised place to present your learning activities.",
            ],
          },
          { t: "p", text: "These challenges can make it difficult to maintain consistency and stay motivated." },
          { t: "p", text: "In an initial LSync user research survey involving 18 respondents, 44% said they had lost track of a course or their learning progress, while 33% said they had no way of tracking their learning progress." },
          { t: "p", text: "Interestingly, 72% said that seeing their personal progress motivates them to learn." },
          {
            t: "stats",
            figures: [
              { value: "44%", label: "had lost track of a course or their learning progress" },
              { value: "33%", label: "had no way of tracking their learning progress" },
              { value: "72%", label: "said seeing their personal progress motivates them to learn" },
            ],
            caveat: "Initial LSync user research survey, 18 respondents.",
          },
          { t: "p", text: "Although this was a small initial survey and not representative of all learners, it highlights an important point: people want to understand and see the progress they are making." },
        ],
      },
      {
        id: "introducing-lsync",
        title: "Introducing LSync: A More Organised Learning Experience",
        blocks: [
          { t: "p", text: "What if you could have a clearer view of your learning activities without constantly trying to remember where everything is?" },
          { t: "p", text: "LSync is designed to help you organise your online learning journey." },
          { t: "p", text: "It is a digital learning organisation platform intended to bring learning activities from supported online sources into a more organised view." },
          { t: "p", text: "Rather than treating every course, tutorial, article or learning activity as a separate experience, LSync aims to help you see more of your learning journey in one place." },
          { t: "p", text: "With its intended capabilities, LSync seeks to help learners:" },
          {
            t: "features",
            items: [
              { title: "Bring Learning Activities Together", text: "Learning happens across different platforms. LSync aims to help you organise activities from supported learning sources so that you can have a clearer view of what you are engaging with." },
              { title: "Track Your Learning Progress", text: "Knowing what you have started, what you have completed and what you are still working towards can make your learning journey easier to manage. LSync is designed to help you review your learning activity and gain a better understanding of your progress." },
              { title: "Organise Your Skills", text: "Every course, tutorial and practical exercise can contribute to developing a particular skill. Organising learning activities around relevant skills can help you understand the areas in which you are investing your time and effort." },
              { title: "Review Your Learning Journey", text: "Learning is a continuous process. Having an organised view of your activities can help you reflect on what you have learned and consider what you should focus on next." },
              { title: "Showcase Selected Learning Activities", text: "Your learning journey can be worth sharing. LSync's intended shareable learning profile provides a way to present selected learning information, with attention to user control over what is shared." },
            ],
          },
          { t: "note", text: "The availability of particular features and integrations depends on LSync's current product release. Please refer to the official platform for confirmed capabilities." },
        ],
      },
      {
        id: "who-can-benefit",
        title: "Who Can Benefit from LSync?",
        blocks: [
          {
            t: "audience",
            items: [
              { title: "Students", text: "You can supplement your formal education with online tutorials, courses and other learning resources while keeping your learning activities better organised." },
              { title: "Recent Graduates and Job Seekers", text: "As you prepare for employment opportunities, organising your learning activities can help you review the skills you have been developing." },
              { title: "Career Switchers", text: "Moving into a new profession often requires learning new skills. A more organised learning journey can help you follow your development." },
              { title: "Self-Taught Learners", text: "If you acquire knowledge from different websites and online resources, LSync aims to provide a more structured way to manage your learning activities." },
              { title: "Working Professionals", text: "Continuous learning is important in a changing workplace. Keeping track of your development can support your professional growth." },
            ],
          },
        ],
      },
      {
        id: "make-your-learning-journey-count",
        title: "Make Your Learning Journey Count",
        blocks: [
          { t: "p", text: "Learning requires time, commitment and consistency. Whether you spend thirty minutes watching a tutorial or several weeks completing a professional course, every learning activity can contribute to your development." },
          { t: "p", text: "However, it is not enough to keep learning without understanding what you have achieved." },
          { t: "p", text: "You should be able to look back and recognise the effort you have invested, the knowledge you have acquired and the skills you are working to develop." },
          { t: "p", text: "That is the kind of organised learning experience LSync aims to support." },
        ],
      },
      {
        id: "start-organising",
        title: "Start Organising Your Learning Journey with LSync",
        blocks: [
          { t: "p", text: "Imagine having a clearer picture of your learning activities, being able to review your progress and having a more organised way to present selected parts of your development." },
          { t: "p", text: "You do not have to leave your learning activities scattered and difficult to follow." },
          { t: "p", text: "Whether you are a student, a professional, a job seeker or someone who simply enjoys acquiring new knowledge, your learning journey deserves attention." },
          { t: "quote", text: "You are investing time and effort in learning. Wouldn't it be helpful to see how far you have come?" },
        ],
      },
    ],
    closing: {
      text: "Discover LSync and explore a more organised approach to managing your online learning journey.",
      cta: "Explore LSync",
      signoff: "Your Learning Journey. Better Organised. With LSync.",
    },
  },
  {
    slug: "why-you-forget-what-you-learn",
    tag: "Learning habits",
    title: "Why You Forget What You Learn Online (and a 10-Minute Habit That Helps)",
    lede: "You finished the course. A month later, you can barely explain what was in it. That is normal, and there is a simple routine that makes learning stay.",
    author: "The LSync team",
    readingMinutes: 4,
    sections: [
      {
        id: "the-course-you-cannot-remember",
        title: "The course you finished and cannot remember",
        blocks: [
          { t: "p", text: "Most of us have done it. You sit through a course, tick off the last lesson, feel proud, and move on. Weeks later someone asks what you learned, and the honest answer is a vague shrug." },
          { t: "p", text: "This is not a sign that you are bad at learning. Researchers have studied memory for more than a century, and one finding keeps coming back: new information fades quickly unless we come back to it. Watching a lesson feels like understanding, but understanding something once is not the same as being able to use it later." },
          { t: "p", text: "The good news is that the fix is not more hours. It is a few small habits, repeated." },
        ],
      },
      {
        id: "three-habits",
        title: "Three small habits that make learning stick",
        blocks: [
          {
            t: "features",
            items: [
              { title: "Recall before you re-read", text: "After a lesson, close the tab and write down what you remember in your own words. The effort of pulling it out of your head is what strengthens it. Checking your notes afterwards shows you the gaps." },
              { title: "Come back to it", text: "Revisit a topic the next day, then again a few days later, then a week later. Short, spaced visits beat one long cram, because each return tells your brain this is worth keeping." },
              { title: "Use it on something real", text: "Build a small project, explain it to a friend, or write a short post. Applying an idea shows you what you understood and what you only recognised." },
            ],
          },
        ],
      },
      {
        id: "why-a-record-helps",
        title: "Why keeping a record helps",
        blocks: [
          { t: "p", text: "Habits are easier to keep when you can see them. If you cannot remember what you studied last week, it is hard to know what to revisit. A simple record of what you studied, on which platform and for how long, turns vague effort into something you can look back on." },
          { t: "quote", text: "What you can see, you can improve." },
          { t: "p", text: "It also helps with motivation. Seeing a run of study days, or a skill that keeps growing, is a quiet reminder that you are moving forward, even on weeks when it does not feel that way." },
        ],
      },
      {
        id: "the-friday-review",
        title: "Try the 10-minute Friday review",
        blocks: [
          { t: "p", text: "You do not need a new system. Pick one time each week and spend ten minutes on this:" },
          {
            t: "ul",
            items: [
              "List what you studied this week. Include videos, courses, articles and practice.",
              "Pick the one idea that mattered most and explain it in two sentences without looking at your notes.",
              "Note one thing you want to revisit next week, so Monday starts with a plan.",
              "Record your sessions so the week is saved, not forgotten.",
            ],
          },
          { t: "note", text: "In LSync, each study session is a short learning log: the skill, the platform, the day and the minutes. Your dashboard then shows where your time is going, so your Friday review has something to look at." },
        ],
      },
    ],
    closing: {
      text: "Remembering more does not need more hours. It needs a little recall, a little repetition and a clear record of what you have done. Start with one week and see what you notice.",
      cta: "Start your learning record",
      signoff: "The LSync team",
    },
  },
  {
    slug: "turn-a-pile-of-courses-into-your-learning-story",
    tag: "Show what you know",
    title: "From a Pile of Courses to a Learning Story Anyone Can Understand",
    lede: "A long list of courses does not tell people what you can do. A short, honest story with evidence does. Here is how to build one.",
    author: "The LSync team",
    readingMinutes: 4,
    sections: [
      {
        id: "a-list-is-not-a-story",
        title: "A list of courses is not a story",
        blocks: [
          { t: "p", text: "Imagine you are talking to someone who could offer you an internship, a project or a job. You say you have done eleven online courses. They nod politely. Then they ask, what can you actually do?" },
          { t: "p", text: "Titles and certificates show that you were present. They do not show what you built, what you got stuck on, or how you grew. People remember stories and evidence far better than they remember lists." },
          { t: "p", text: "The good news is that if you have been learning for a while, you already have the raw material. It just needs shaping." },
        ],
      },
      {
        id: "the-three-line-story",
        title: "The three-line learning story",
        blocks: [
          { t: "p", text: "Try to describe your learning in three short lines. Each one answers a simple question:" },
          {
            t: "features",
            items: [
              { title: "Where I started", text: "What did you want to learn, and why? Be specific: not \"I wanted to learn tech\", but \"I wanted to build websites for small businesses\"." },
              { title: "What I did", text: "Which courses, tutorials and practice got you moving, and what did you make with them? Name one real thing." },
              { title: "Where I am heading", text: "What are you learning now, and what do you want to be able to do next? This shows direction, and direction is attractive." },
            ],
          },
        ],
      },
      {
        id: "evidence-beats-adjectives",
        title: "Evidence beats adjectives",
        blocks: [
          { t: "p", text: "Words like passionate, hardworking and fast learner are easy to write and easy to ignore. Evidence is harder to fake and easier to trust. Good evidence can be small:" },
          {
            t: "ul",
            items: [
              "A project you built, even a modest one, with a short note on what you learned.",
              "Commits and repositories that show you practising over weeks, not just once.",
              "A record of how many hours you gave to a skill, and how steadily.",
              "One thing you got wrong, and how you fixed it.",
            ],
          },
        ],
      },
      {
        id: "a-made-up-example",
        title: "An example (made up, but realistic)",
        blocks: [
          { t: "p", text: "Imagine a learner called Tolu. Here is how Tolu might tell their story:" },
          { t: "quote", text: "I wanted to build websites for small businesses in my area. I started with free tutorials, took a course on web basics, and built a site for a friend's bakery. Now I am learning how to make pages load faster, and I am looking for my first client project." },
          { t: "p", text: "It is three sentences. It is honest. It names a real project, shows steady practice, and points to what comes next. Nothing in it is exaggerated, and that is exactly why it works." },
        ],
      },
      {
        id: "keep-the-raw-material",
        title: "Keep the raw material as you go",
        blocks: [
          { t: "p", text: "The hard part of telling your story later is remembering the details. What did you study in March? How long did that course really take? Which skills did you spend the most time on? If you only try to recall it all when you need it, a lot will be missing." },
          { t: "note", text: "This is what LSync is for. Your logs, skills and GitHub activity stay in one place as you learn, so when you want to tell your story, the details are already there. A shareable learning profile, where you choose what appears, is planned." },
        ],
      },
    ],
    closing: {
      text: "You do not need to have done more than everyone else. You need to be able to say clearly what you set out to learn, what you did about it, and where you are going. Start collecting the evidence today, and your story will write itself.",
      cta: "Start collecting your story",
      signoff: "The LSync team",
    },
  },
];

export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);
