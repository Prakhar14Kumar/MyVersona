import type { Post } from "../lib/firestoreService";

// Auto-import images — sorted alphabetically so index = image number
const eModules = import.meta.glob('../assets/demo-images/E*.{jpg,jpeg,png}', { eager: true, as: 'url' });
const crModules = import.meta.glob('../assets/demo-images/cr*.{jpg,jpeg,png}', { eager: true, as: 'url' });

// Sort keys so E1 → index 0, E2 → index 1, etc.
const eImages = Object.keys(eModules).sort().map(k => eModules[k] as string);
const crImages = Object.keys(crModules).sort().map(k => crModules[k] as string);

// Generate random dates within the last N days
const getDate = (daysAgo: number): Date => {
  const d = new Date();
  d.setHours(d.getHours() - Math.random() * 24 * daysAgo);
  return d;
};

// Indian Gen-Z / College Profiles
const P = [
  { userId: "demo1", userName: "Prakhar Kumar", userAvatar: "https://i.pravatar.cc/150?img=11", userCollege: "Verified Hacker 🇮🇳" },
  { userId: "demo2", userName: "Sanya Ruhela", userAvatar: "https://i.pravatar.cc/150?img=5", userCollege: "#nift" },
  { userId: "demo3", userName: "Asmita Suri", userAvatar: "https://i.pravatar.cc/150?img=33", userCollege: "#iitdelhi" },
  { userId: "demo4", userName: "Akshita Saini", userAvatar: "https://i.pravatar.cc/150?img=44", userCollege: "#bitspilani" },
  { userId: "demo5", userName: "Mohd Salman", userAvatar: "https://i.pravatar.cc/150?img=12", userCollege: "Verified Entrepreneur" },
  { userId: "demo6", userName: "Utkarsh Singh", userAvatar: "https://i.pravatar.cc/150?img=15", userCollege: "#vitvellore" },
];

// ─── ENTERTAINMENT: 9 posts, one per image E1–E9 ────────────────────────────
const entertainmentPosts: Post[] = [
  {
    id: "demo-ent-1", type: "entertainment", ...P[5],
    image: eImages[0], // E1
    content: "When the code finally compiles at 3 AM... but then you realize you broke 5 other things 😭🔥\n\n#CodingLife #DevMemes #LateNightVibes",
    likes: 420, comments: 69, likedBy: [], createdAt: getDate(1), updatedAt: getDate(1),
  },
  {
    id: "demo-ent-2", type: "entertainment", ...P[0],
    image: eImages[1], // E2
    content: "Beautiful evening at the campus cafe. Coffee + sunset = absolute perfection ☕🌅\n\n#CampusLife #Aesthetic #CollegeDiaries",
    likes: 1205, comments: 45, likedBy: [], createdAt: getDate(2), updatedAt: getDate(2),
  },
  {
    id: "demo-ent-3", type: "entertainment", ...P[1],
    image: eImages[2], // E3
    content: "Hostel maggi hits different when you have exams tomorrow and haven't started studying yet 🍜🫠\n\n#HostelLife #ExamSeason #Relatable",
    likes: 3890, comments: 212, likedBy: [], createdAt: getDate(1), updatedAt: getDate(1),
  },
  {
    id: "demo-ent-4", type: "entertainment", ...P[0],
    image: eImages[3], // E4
    content: "Fresher's party was INSANE! Huge shoutout to the organizing committee. What a night! 🎉✨\n\n#Freshers2026 #PartyTime #CollegeEvents",
    likes: 856, comments: 32, likedBy: [], createdAt: getDate(3), updatedAt: getDate(3),
  },
  {
    id: "demo-ent-5", type: "entertainment", ...P[1],
    image: eImages[4], // E5
    content: "My desk setup is finally complete! RGB makes the code run faster, right? 💻💡\n\n#DeskSetup #DevSpace #Techie",
    likes: 2450, comments: 115, likedBy: [], createdAt: getDate(1), updatedAt: getDate(1),
  },
  {
    id: "demo-ent-6", type: "entertainment", ...P[2],
    image: eImages[5], // E6
    content: "That post-exam feeling when you know you failed but you're just glad it's over 💀🚶‍♂️\n\n#ExamsAreOver #CollegeStruggles #Vibes",
    likes: 5670, comments: 430, likedBy: [], createdAt: getDate(4), updatedAt: getDate(4),
  },
  {
    id: "demo-ent-7", type: "entertainment", ...P[0],
    image: eImages[6], // E7
    content: "Weekend trip with the gang! Escaping assignments for a bit 🏔️🚗\n\n#TravelDiaries #WeekendGetaway #Friends",
    likes: 1890, comments: 67, likedBy: [], createdAt: getDate(2), updatedAt: getDate(2),
  },
  {
    id: "demo-ent-8", type: "entertainment", ...P[5],
    image: eImages[7], // E8
    content: "Gym bro spotted outside the library... wait, that's illegal! 🏋️‍♂️📚\n\n#GymLife #Gains #StudentLife",
    likes: 742, comments: 28, likedBy: [], createdAt: getDate(3), updatedAt: getDate(3),
  },
  {
    id: "demo-ent-9", type: "entertainment", ...P[5],
    image: eImages[8], // E9
    content: "POV: You're trying to find a table in the canteen during lunch hour 🕵️‍♀️🍔\n\n#CanteenDiaries #HungerGames #College",
    likes: 1240, comments: 89, likedBy: [], createdAt: getDate(1), updatedAt: getDate(1),
  },
];

// ─── CAREER: 8 posts, one per image cr1–cr8 ─────────────────────────────────
const careerPosts: Post[] = [
  {
    id: "demo-car-1", type: "career", ...P[0],
    image: crImages[0], // cr1
    content: "Thrilled to announce I'll be joining Google as a SWE Intern this summer! 🎉\n\nGrinding LeetCode finally paid off. Huge thanks to everyone who believed in me 💙\n\n#Internship #Google #SoftwareEngineering #CareerMilestone",
    likes: 12500, comments: 450, likedBy: [], createdAt: getDate(1), updatedAt: getDate(1),
  },
  {
    id: "demo-car-2", type: "career", ...P[5],
    image: crImages[1], // cr2
    content: "Resume Tip 💡: Stop putting skill progress bars on your resume!\n\nATS systems can't read them. List skills clearly and prove them with quantifiable achievements instead 📄✅\n\n#ResumeTips #CareerAdvice #Placements #JobHunt",
    likes: 3400, comments: 120, likedBy: [], createdAt: getDate(2), updatedAt: getDate(2),
  },
  {
    id: "demo-car-3", type: "career", ...P[1],
    image: crImages[2], // cr3
    content: "Just wrapped our AI startup's seed funding round! 🚀\n\nThe Indian startup ecosystem is booming. We're hiring founding engineers — DM me!\n\n#StartupLife #Funding #AI #FoundersIndia",
    likes: 8900, comments: 310, likedBy: [], createdAt: getDate(1), updatedAt: getDate(1),
  },
  {
    id: "demo-car-4", type: "career", ...P[4],
    image: crImages[3], // cr4
    content: "Placed! 🎓💼\n\nAfter 50+ rejections and countless sleepless nights I'm excited to share I've accepted an offer from Microsoft.\n\nTo everyone still hunting: your breakthrough is just around the corner 🙏\n\n#Placed #MicrosoftLife #NeverGiveUp",
    likes: 15600, comments: 890, likedBy: [], createdAt: getDate(3), updatedAt: getDate(3),
  },
  {
    id: "demo-car-5", type: "career", ...P[2],
    image: crImages[4], // cr5
    content: "How does WhatsApp handle 100 billion messages a day? 🏗️📲\n\nBreaking down the architecture so you can ace your next system design interview. Thread below!\n\n#SystemDesign #Architecture #TechTalk",
    likes: 4200, comments: 156, likedBy: [], createdAt: getDate(4), updatedAt: getDate(4),
  },
  {
    id: "demo-car-6", type: "career", ...P[0],
    image: crImages[5], // cr6
    content: "Just earned my Deep Learning Specialization from Coursera/deeplearning.ai! 🤖🧠\n\nHighly recommend to anyone building a strong neural-network foundation.\n\n#DeepLearning #AI #DataScience #ContinuousLearning",
    likes: 2100, comments: 85, likedBy: [], createdAt: getDate(2), updatedAt: getDate(2),
  },
  {
    id: "demo-car-7", type: "career", ...P[3],
    image: crImages[6], // cr7
    content: "Attended Web3 Summit in Bangalore today! Electric energy in the room 🌐⛓️\n\nMet incredible builders and got inspired to start my own dApp project.\n\n#Web3 #Blockchain #Networking #Bangalore",
    likes: 1800, comments: 45, likedBy: [], createdAt: getDate(1), updatedAt: getDate(1),
  },
  {
    id: "demo-car-8", type: "career", ...P[4],
    image: crImages[7], // cr8
    content: "My team won the Smart India Hackathon! 🏆💻\n\n48 hours of non-stop coding, 10 cups of coffee, and we built an AI-powered predictive healthcare solution.\n\n#HackathonWinner #SIH2026 #TechInnovation",
    likes: 9200, comments: 430, likedBy: [], createdAt: getDate(2), updatedAt: getDate(2),
  },
];

export const allDemoPosts: Post[] = [...entertainmentPosts, ...careerPosts];

export const getDemoPosts = (feedType: string): Post[] =>
  allDemoPosts
    .filter(p => p.type === feedType)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
