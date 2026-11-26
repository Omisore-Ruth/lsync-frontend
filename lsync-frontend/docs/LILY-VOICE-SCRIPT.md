# Lily's voice script

> **Pronunciation:** say the name as the letter "L", then the word "sync" (el-sink), as in "El Sync". In the browser voice this is handled automatically. If you record clips, say it the same way. "edX" is "ed-X".


Lily speaks with the browser's own voice by default. The voice a visitor hears depends on their device, so it is not always Canadian.
To make her sound the same, and Canadian, for everyone, record the lines below once with a Canadian English text-to-speech voice
(for example the Canadian voices in Azure Speech or Google Cloud Text-to-Speech, or ElevenLabs), save each line as an MP3, and list it in the manifest.

## How to switch the recordings on

1. Save each recording in `public/lily/` using the file name shown below (for example `welcome.mp3`).
2. Open `public/lily/manifest.json` and list the clips you made, for example:

```json
{
  "welcome": "/lily/welcome.mp3",
  "what": "/lily/what.mp3"
}
```

3. Commit and sync. Any line that is not listed keeps using the browser voice, so you can add clips a few at a time.

Tips: ask for a soft, warm, unhurried delivery. Keep the exact words, because the text on screen is the same. Do not record "demo" (it changes with demo mode).

## The lines

| Id | File name | Say this |
| --- | --- | --- |
| welcome | welcome.mp3 | Hi, I'm Lily. Welcome to LSync, your unified learning portfolio. If you learn on YouTube, Coursera, Udemy, edX, GitHub, or just by reading, LSync brings it together in one place, so you can see your progress, organise your skills, and choose what to share. Take a look around, or tap a platform to see how it works. Tap the little microphone once and allow it, then you can just say, Hey Lily, and I'll be right here. |
| welcome-tap | welcome-tap.mp3 | Hi, I'm Lily. Welcome to LSync, your unified learning portfolio. If you learn on YouTube, Coursera, Udemy, edX, GitHub, or just by reading, LSync brings it together in one place, so you can see your progress, organise your skills, and choose what to share. Take a look around, or tap a platform to see how it works. Whenever you need anything, just tap me, and I'll be right here. |
| blog | blog.mp3 | Our blog has articles on keeping track of what you learn online, and how to turn it into something you can show. Here is where to find them. |
| signin | signin.mp3 | You can sign in here. If you forget your password, there is a reset link on that page. |
| password | password.mp3 | If you forgot your password, choose Forgot password on the sign-in page and enter your email. You will get a link to set a new one. |
| start | start.mp3 | Select Get started and create your account. Next you will see a page to link your learning sources. You can skip it and connect them later from your dashboard. |
| what | what.mp3 | LSync is your unified learning portfolio. It brings what you learn on different platforms into one organised view, so you can track your progress, organise your skills, and choose what you want to share. |
| how | how.mp3 | Three steps. First, connect the places you learn. Second, log what you study, and every log counts towards a skill. Third, see your progress, skills and activity together on your dashboard. |
| platforms | platforms.mp3 | GitHub, YouTube, Coursera, Udemy, edX, and blogs or docs. GitHub connects directly, so your commits become learning activity. For the others, you link your profile and add what you finish, because most learning platforms don't share learner data publicly. |
| github | github.mp3 | GitHub is the one that connects directly. You sign in with GitHub, and your commits and repositories show up as learning activity in LSync. |
| others | others.mp3 | For Coursera, Udemy, edX and YouTube, you link your profile and then log what you finish. Those platforms don't share learner data publicly, so we ask you to add it yourself, and it only takes a moment. |
| who | who.mp3 | Students, recent graduates and job seekers, career switchers, self-taught learners, and working professionals. Anyone who learns online and wants to see how far they have come. |
| private | private.mp3 | You stay in control of what is shared. Your portfolio is private by default, and a shareable learning profile is planned, where you choose what appears on it. |
| survey | survey.mp3 | In our first small survey of eighteen learners, forty four percent said they had lost track of a course or their progress, and seventy two percent said seeing their progress motivates them. It is a small survey, so treat it as a signal, not a verdict. |
| pricing | pricing.mp3 | Good question. I don't have pricing details, so I won't guess. What I can tell you is that creating an account doesn't ask you for any payment, and you can try the demo first. The team will share pricing when it's decided. |
| demo | demo.mp3 | You can create an account and try it yourself. |
| features | features.mp3 | You can connect your sources, log what you learn, track progress by skill, review your activity and analytics, and see how other learners are doing. A shareable profile is planned. |
| skills | skills.mp3 | Every log you add counts towards a skill, so your dashboard shows where your time is going, which skills are growing, and how active you have been lately. |
| different | different.mp3 | LSync isn't a social network, and it doesn't replace the courses you take. It's one private place where your learning from many platforms comes together, and you decide what to share. |
| device | device.mp3 | LSync works in your browser, including on a phone. There isn't a separate app to download yet. |
| team | team.mp3 | LSync is a capstone project from the BeTechified programme, built by a team of designers, developers and marketers. |
| help | help.mp3 | You can ask me things like: what is LSync, how does it work, which platforms can I connect, is it free, is it private, or how do I get started. You can also say, take me to the blog. |
| me | me.mp3 | I'm Lily, LSync's voice guide. I'm an automated assistant, not a person. I can tell you about LSync, how it works, and where to start. |
| thanks | thanks.mp3 | You're welcome. I'm here if you need anything else. |
| hello | hello.mp3 | Hi there. What would you like to know about LSync? |
| wake-1 | wake-1.mp3 | Yes? |
| wake-2 | wake-2.mp3 | I'm here. |
| wake-3 | wake-3.mp3 | Go ahead, I'm listening. |

"welcome" is used when the visitor's browser can listen for "Hey Lily" (Chrome and Edge). "welcome-tap" is used otherwise.
