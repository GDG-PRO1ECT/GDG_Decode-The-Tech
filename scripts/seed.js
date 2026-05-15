// scripts/seed.js - Run with: node scripts/seed.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/decode-the-tech';

const round1Questions = [
  // MCQs (20 total from Image 3)
  { type: 'mcq', question: 'Main processor of the computer?', options: ['RAM', 'CPU', 'ROM', 'SSD'], correctAnswer: 'CPU', explanation: 'The CPU (Central Processing Unit) is the primary component of a computer that acts as its "control center."' },
  { type: 'mcq', question: 'Temporary memory for active tasks?', options: ['ROM', 'HDD', 'RAM', 'Cache'], correctAnswer: 'RAM', explanation: 'RAM (Random Access Memory) is volatile memory that stores data currently being used by the CPU.' },
  { type: 'mcq', question: 'Storage drive using flash memory?', options: ['HDD', 'SSD', 'Tape', 'Floppy'], correctAnswer: 'SSD', explanation: 'SSDs (Solid State Drives) use flash memory to store data, making them much faster than traditional HDDs.' },
  { type: 'mcq', question: 'System starting up the PC?', options: ['BIOS', 'OS', 'Kernel', 'Driver'], correctAnswer: 'BIOS', explanation: 'BIOS (Basic Input/Output System) is the firmware used to perform hardware initialization during the booting process.' },
  { type: 'mcq', question: 'Optical media for data storage?', options: ['Flash', 'CD', 'HDD', 'RAM'], correctAnswer: 'CD', explanation: 'A CD (Compact Disc) is a digital optical disc data storage format.' },
  { type: 'mcq', question: 'Circuit board connecting all hardware?', options: ['CPU', 'Motherboard', 'RAM', 'PSU'], correctAnswer: 'Motherboard', explanation: 'The motherboard is the main printed circuit board in general-purpose computers.' },
  { type: 'mcq', question: 'Device converting digital to analog?', options: ['Modem', 'Router', 'Switch', 'Hub'], correctAnswer: 'Modem', explanation: 'A modem (modulator-demodulator) converts digital data from a computer into analog signals for transmission over phone lines or cable.' },
  { type: 'mcq', question: 'Small high-speed memory area?', options: ['Disk', 'RAM', 'ROM', 'Cache'], correctAnswer: 'Cache', explanation: 'Cache is a smaller, faster memory which stores copies of the data from frequently used main memory locations.' },
  { type: 'mcq', question: 'Port for high-speed connectivity?', options: ['audio', 'VGA', 'Serial', 'USB'], correctAnswer: 'USB', explanation: 'USB (Universal Serial Bus) is an industry standard for cables and connectors for connection, communication, and power supply between computers and devices.' },
  { type: 'mcq', question: 'Hardware protecting network from threats?', options: ['Router', 'Switch', 'Firewall', 'Hub'], correctAnswer: 'Firewall', explanation: 'A firewall is a network security system that monitors and controls incoming and outgoing network traffic based on predetermined security rules.' },
  { type: 'mcq', question: 'Language for web structure design?', options: ['CSS', 'HTML', 'Java', 'SQL'], correctAnswer: 'HTML', explanation: 'HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser.' },
  { type: 'mcq', question: 'Styling language for web pages?', options: ['HTML', 'PHP', 'CSS', 'JS'], correctAnswer: 'CSS', explanation: 'CSS (Cascading Style Sheets) is used for describing the presentation of a document written in a markup language like HTML.' },
  { type: 'mcq', question: 'Language for client-side interactivity?', options: ['Python', 'JS', 'C++', 'SQL'], correctAnswer: 'JS', explanation: 'JavaScript is a programming language that enables interactive web pages and is an essential part of web applications.' },
  { type: 'mcq', question: 'Software converting source to machine?', options: ['Interpreter', 'Compiler', 'Linker', 'Debugger'], correctAnswer: 'Compiler', explanation: 'A compiler is a special program that processes statements written in a particular programming language and turns them into machine language or "code" that a computer\'s processor uses.' },
  { type: 'mcq', question: 'System managing database records efficiently?', options: ['DBMS', 'HTTP', 'HTML', 'URL'], correctAnswer: 'DBMS', explanation: 'A Database Management System (DBMS) is software for storing and retrieving users\' data while considering appropriate security measures.' },
  { type: 'mcq', question: 'Unique address for internet resources?', options: ['IP', 'Path', 'DNS', 'URL'], correctAnswer: 'URL', explanation: 'A URL (Uniform Resource Locator) is the address of a unique resource on the Web.' },
  { type: 'mcq', question: 'Rules for data transfer protocol?', options: ['HTML', 'HTTP', 'SQL', 'CSS'], correctAnswer: 'HTTP', explanation: 'HTTP (Hypertext Transfer Protocol) is an application-level protocol for distributed, collaborative, hypermedia information systems.' },
  { type: 'mcq', question: 'Program for browsing the web?', options: ['Server', 'Client', 'Browser', 'Compiler'], correctAnswer: 'Browser', explanation: 'A web browser is a software application for accessing information on the World Wide Web.' },
  { type: 'mcq', question: 'Errors in computer program code?', options: ['Bugs', 'Virus', 'Glitch', 'Malware'], correctAnswer: 'Bugs', explanation: 'A software bug is an error, flaw or fault in a computer program or system that causes it to produce an incorrect or unexpected result.' },
  { type: 'mcq', question: 'Program designed for harmful actions?', options: ['Virus', 'Utility', 'Driver', 'Patch'], correctAnswer: 'Virus', explanation: 'A computer virus is a type of computer program that, when executed, replicates itself by modifying other computer programs and inserting its own code.' },

  // Match The Following (10 total - Retained from original seed)
  { type: 'match', question: 'Match the Web Concepts', matchPairs: [{ left: 'DNS', right: 'Name to IP' }, { left: 'HTTP', right: 'Web Transfer' }, { left: 'URL', right: 'Web Address' }], explanation: 'Core protocols of the World Wide Web.' },
  { type: 'match', question: 'Match the Storage types', matchPairs: [{ left: 'SSD', right: 'Fast Flash' }, { left: 'HDD', right: 'Magnetic Disk' }, { left: 'RAM', right: 'Volatile Memory' }], explanation: 'Different ways computers store data.' },
  { type: 'match', question: 'Match the Cloud types', matchPairs: [{ left: 'SaaS', right: 'Software Service' }, { left: 'PaaS', right: 'Platform Service' }, { left: 'IaaS', right: 'Infrastructure Service' }], explanation: 'The three main cloud service models.' },
  { type: 'match', question: 'Match the Programming paradigms', matchPairs: [{ left: 'OOP', right: 'Object Oriented' }, { left: 'Functional', right: 'Pure Functions' }, { left: 'Imperative', right: 'Step Commands' }], explanation: 'Different styles of writing code.' },
  { type: 'match', question: 'Match the Cybersecurity terms', matchPairs: [{ left: 'Phishing', right: 'Fraudulent emails' }, { left: 'Firewall', right: 'Traffic filter' }, { left: 'VPN', right: 'Secure tunnel' }], explanation: 'Common security tools and threats.' },
  { type: 'match', question: 'Match the Data units', matchPairs: [{ left: 'Bit', right: '0 or 1' }, { left: 'Byte', right: '8 bits' }, { left: 'Nibble', right: '4 bits' }], explanation: 'Fundamental building blocks of digital data.' },
  { type: 'match', question: 'Match the Hardware ports', matchPairs: [{ left: 'USB-C', right: 'Universal port' }, { left: 'HDMI', right: 'Video/Audio' }, { left: 'Ethernet', right: 'Wired Network' }], explanation: 'Common physical connections for devices.' },
  { type: 'match', question: 'Match the OS examples', matchPairs: [{ left: 'Linux', right: 'Open Source' }, { left: 'Windows', right: 'Microsoft' }, { left: 'macOS', right: 'Apple' }], explanation: 'The most popular operating systems.' },
  { type: 'match', question: 'Match the UI components', matchPairs: [{ left: 'Navbar', right: 'Navigation' }, { left: 'Footer', right: 'Bottom info' }, { left: 'Sidebar', right: 'Side menu' }], explanation: 'Standard parts of a website layout.' },
  { type: 'match', question: 'Match the Dev tools', matchPairs: [{ left: 'IDE', right: 'Code Editor' }, { left: 'CLI', right: 'Text Terminal' }, { left: 'SDK', right: 'Dev Kit' }], explanation: 'Tools used by software engineers.' },
];

const round2Questions = [
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🦙 💻 🤖', options: ['GPT-4', 'Llama', 'Claude', 'Mistral'], correctAnswer: 'Llama', explanation: 'Meta\'s Llama AI model.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🦀 ⚙️ 🛡️', options: ['Python', 'Go', 'Rust', 'Swift'], correctAnswer: 'Rust', explanation: 'Rust programming language (mascot is a crab).' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🍿 📺 🔴', options: ['Hulu', 'Disney+', 'Netflix', 'Amazon Prime'], correctAnswer: 'Netflix', explanation: 'Netflix streaming service.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '☸️ 📦 🏗️', options: ['Docker', 'Kubernetes', 'Terraform', 'Ansible'], correctAnswer: 'Kubernetes', explanation: 'Kubernetes container orchestration.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🪟 🟦 💻', options: ['macOS', 'Linux', 'Windows', 'Android'], correctAnswer: 'Windows', explanation: 'Windows Operating System (among others listed).' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🐦 💻 🟧', options: ['Flutter', 'Kotlin', 'Swift', 'Objective-C'], correctAnswer: 'Swift', explanation: 'Swift programming language (or a Taylor Swift reference).' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🐘 📊 🔵', options: ['MongoDB', 'MySQL', 'Redis', 'PostgreSQL'], correctAnswer: 'PostgreSQL', explanation: 'PostgreSQL database (mascot is an elephant).' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🐋 📦 🚢', options: ['Kubernetes', 'Docker', 'Jenkins', 'AWS'], correctAnswer: 'Docker', explanation: 'Docker containers (mascot is a whale).' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🔍 🌈 🌐', options: ['Yahoo', 'Bing', 'Google', 'DuckDuckGo'], correctAnswer: 'Google', explanation: 'Google Search engine.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🌐 🕷️ 📒', options: ['API', 'Web Crawler', 'Bug', 'Web Scraper'], correctAnswer: 'Web Crawler', explanation: 'Web crawlers navigate the spider web of the internet.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🐙 💻 📁', options: ['GitLab', 'Bitbucket', 'GitHub', 'Stack Overflow'], correctAnswer: 'GitHub', explanation: 'GitHub (mascot is Octocat).' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🐦 🧵 💬', options: ['Twitter', 'X', 'Mastodon', 'Threads'], correctAnswer: 'Threads', explanation: 'Threads app by Meta.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🐍 💻 ⌨', options: ['Java', 'Python', 'C++', 'Ruby'], correctAnswer: 'Python', explanation: 'Python (as per clue in image).' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '📧 💠 🔵', options: ['Outlook', 'Gmail', 'Yahoo Mail', 'ProtonMail'], correctAnswer: 'Outlook', explanation: 'Microsoft Outlook email.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '💬 🛰️ 🔐', options: ['WhatsApp', 'Telegram', 'Signal', 'Viber'], correctAnswer: 'Signal', explanation: 'Signal secure messaging.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🤖 🟢 📱', options: ['iOS', 'Android', 'HarmonyOS', 'OxygenOS'], correctAnswer: 'Android', explanation: 'Android mobile OS.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🔊 ☁️ 🟧', options: ['Spotify', 'Apple Music', 'SoundCloud', 'Shazam'], correctAnswer: 'SoundCloud', explanation: 'SoundCloud audio platform.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '1️⃣ 🔋 ⚡ 🚗', options: ['Vinfast', 'BYD', 'Tesla', 'BMW'], correctAnswer: 'Tesla', explanation: 'Tesla electric vehicles.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🎮 🟣 💬', options: ['Slack', 'Discord', 'Twitch', 'Skype'], correctAnswer: 'Discord', explanation: 'Discord chat for gamers.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '👽 💬 ⬆️', options: ['Discord', 'Reddit', '4chan', 'Tumblr'], correctAnswer: 'Reddit', explanation: 'Reddit social platform (mascot is Snoo).' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '☁️ 📂 🔵🟢🟡', options: ['Google Drive', 'Dropbox', 'OneDrive', 'iCloud'], correctAnswer: 'Google Drive', explanation: 'Google Drive cloud storage.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🎵 🟢 🎧', options: ['Apple Music', 'Spotify', 'SoundCloud', 'Pandora'], correctAnswer: 'Spotify', explanation: 'Spotify music streaming.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '💼 👔 📈', options: ['LinkedIn', 'Indeed', 'Glassdoor', 'Monster'], correctAnswer: 'LinkedIn', explanation: 'LinkedIn professional network.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🦾 🐚 💻', options: ['Command Prompt', 'Terminal', 'PowerShell', 'Bash'], correctAnswer: 'PowerShell', explanation: 'Microsoft PowerShell.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '♊ 🤖', options: ['GPT-4', 'Bard', 'Claude', 'Gemini'], correctAnswer: 'Gemini', explanation: 'Google Gemini AI.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🔴 🎬 ▶', options: ['Vimeo', 'DailyMotion', 'YouTube', 'Twitch'], correctAnswer: 'YouTube', explanation: 'YouTube video platform.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '📍 📌 🖼️', options: ['Google Maps', 'Pinterest', 'Instagram', 'Yelp'], correctAnswer: 'Pinterest', explanation: 'Pinterest image sharing.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🟢 📞 💬', options: ['Telegram', 'Signal', 'WhatsApp', 'Discord'], correctAnswer: 'WhatsApp', explanation: 'WhatsApp messaging.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🎥 🟣 🎮', options: ['YouTube Gaming', 'Discord', 'Twitch', 'Steam'], correctAnswer: 'Twitch', explanation: 'Twitch live streaming.' },
  { question: 'Identify the app or platform from this emoji clue', emojiClue: '🔵 👥 📰', options: ['Twitter', 'Facebook', 'Reddit', 'Quora'], correctAnswer: 'Facebook', explanation: 'Facebook social network.' },
];

const round3Questions = [
  { question: 'Swiggy launched an "Incognito Mode" for private midnight orders.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: It hides orders from account history.' },
  { question: 'IRCTC introduced a premium "Tatkal Bot" to skip captcha for ₹50.', options: ['Real', 'Fake'], actualFact: 'Fake', correctAnswer: 'Real', explanation: 'FAKE: Captcha is still unavoidable.' },
  { question: 'Zomato lets you order food using a voice note like "Bring the usual."', options: ['Real', 'Fake'], actualFact: 'Fake', correctAnswer: 'Real', explanation: 'FAKE: Manual ordering is still required.' },
  { question: 'UPI allows transfers using Aadhaar number.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Helps users without smartphones.' },
  { question: 'Rapido launched a premium ride with Bluetooth helmet.', options: ['Real', 'Fake'], actualFact: 'Fake', correctAnswer: 'Real', explanation: 'FAKE: Even basic helmets are unreliable.' },
  { question: 'RBI introduced UPI Lite for payments under ₹500 without PIN.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Designed for faster small payments.' },
  { question: 'Rapido has a "Chitchat Mode" for silent rides.', options: ['Real', 'Fake'], actualFact: 'Fake', correctAnswer: 'Real', explanation: 'FAKE: Sadly not real.' },
  { question: 'DigiLocker stores digital driving license accepted by police.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Legally valid under IT Act.' },
  { question: 'IRCTC lets you order Domino\'s to your train seat.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Available via eCatering.' },
  { question: 'Instagram shows who stalks your profile.', options: ['Real', 'Fake'], actualFact: 'Fake', correctAnswer: 'Real', explanation: 'FAKE: No such official feature.' },
  { question: 'Python was released before Java.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Python (1991), Java (1995).' },
  { question: 'GitHub has an Arctic vault for open-source code.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Built to last 1000 years.' },
  { question: 'Discord was built for stockbrokers.', options: ['Real', 'Fake'], actualFact: 'Fake', correctAnswer: 'Real', explanation: 'FAKE: Built for gamers.' },
  { question: 'Apollo 11 code was written in JavaScript.', options: ['Real', 'Fake'], actualFact: 'Fake', correctAnswer: 'Real', explanation: 'FAKE: JavaScript came later.' },
  { question: 'USB ports need flipping multiple times by design.', options: ['Real', 'Fake'], actualFact: 'Fake', correctAnswer: 'Real', explanation: 'FAKE: Just bad luck and design limits.' },
  { question: 'Google uses goats for lawn mowing.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Eco-friendly solution.' },
  { question: 'ChatGPT was trained only on school essays.', options: ['Real', 'Fake'], actualFact: 'Fake', correctAnswer: 'Real', explanation: 'FAKE: Trained on diverse data.' },
  { question: 'Linux mascot chosen due to penguin bite.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Linus Torvalds story.' },
  { question: 'Firefox logo is a red panda, not a fox.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Name refers to red panda.' },
  { question: 'Samsung makes displays for iPhones.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Despite rivalry.' },
  { question: 'Apple sells a $19 polishing cloth.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Surprisingly popular.' },
  { question: 'Uber offers "Quiet Mode" for silent rides.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Available in premium rides.' },
  { question: 'Duolingo threatens to delete contacts for streak loss.', options: ['Real', 'Fake'], actualFact: 'Fake', correctAnswer: 'Real', explanation: 'FAKE: Only memes say that.' },
  { question: 'Google Maps can save your parking location.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Also tracks parking time.' },
  { question: 'Zoom has a "Touch Up My Appearance" filter.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Smooths skin tone.' },
  { question: 'Alexa whispers back if you whisper.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Whisper Mode exists.' },
  { question: 'WhatsApp has one-time voice notes.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Plays once only.' },
  { question: 'Airbnb has a "Zombie Apocalypse Safe" filter.', options: ['Real', 'Fake'], actualFact: 'Fake', correctAnswer: 'Real', explanation: 'FAKE: No such filter.' },
  { question: 'YouTube Music can identify songs by humming.', options: ['Real', 'Fake'], actualFact: 'Real', correctAnswer: 'Fake', explanation: 'REAL: Very accurate feature.' },
  { question: 'GitHub deletes inactive accounts after 1 year.', options: ['Real', 'Fake'], actualFact: 'Fake', correctAnswer: 'Real', explanation: 'FAKE: No such rule.' },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await mongoose.connection.collection('questions').deleteMany({});
  await mongoose.connection.collection('gamesessions').deleteMany({});
  console.log('Cleared old data');

  // Insert questions
  const allQuestions = [
    ...round1Questions.map((q, i) => ({ ...q, round: 1, questionNumber: i + 1, basePoints: 1, isActive: true })),
    ...round2Questions.map((q, i) => ({ ...q, round: 2, questionNumber: i + 1, basePoints: 1, isActive: true })),
    ...round3Questions.map((q, i) => ({ ...q, round: 3, questionNumber: i + 1, basePoints: 1, emojiClue: q.emojiClue || '', isActive: true })),
  ];

  await mongoose.connection.collection('questions').insertMany(allQuestions);
  console.log(`Inserted ${allQuestions.length} questions`);

  // Create game session
  await mongoose.connection.collection('gamesessions').insertOne({
    sessionId: 'main',
    status: 'waiting',
    currentRound: 0,
    roundDurations: { round1: 1200, round2: 1200, round3: 1500 },
    fastestAnswers: { round1: [], round2: [], round3: [] },
    settings: { fastestFingerBonus: 0, timeBonusEnabled: false, shuffleQuestions: true },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created game session');

  await mongoose.disconnect();
  console.log('Done! Database seeded successfully.');
}

seed().catch(console.error);
