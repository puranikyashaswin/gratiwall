require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Note = require('./models/Note');

const PASSWORD = 'password123';

const daysAgo = (days, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, Math.floor(Math.random() * 50) + 5, 0, 0);
  return d;
};

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gratiwall';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`[seed] Connected to ${uri}`);

  await Promise.all([User.deleteMany({}), Note.deleteMany({})]);
  console.log('[seed] Cleared existing users and notes.');

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const users = await User.create([
    { name: 'Ananya Verma', email: 'admin@gratiwall.edu', passwordHash, role: 'admin', department: 'Administration' },
    { name: 'Aarav Mehta', email: 'aarav.mehta@gratiwall.edu', passwordHash, role: 'student', department: 'School of Technology' },
    { name: 'Ishita Reddy', email: 'ishita.reddy@gratiwall.edu', passwordHash, role: 'student', department: 'School of Technology' },
    { name: 'Rohan Deshmukh', email: 'rohan.deshmukh@gratiwall.edu', passwordHash, role: 'student', department: 'School of Technology' },
    { name: 'Kabir Singh Chauhan', email: 'kabir.chauhan@gratiwall.edu', passwordHash, role: 'student', department: 'School of Business' },
    { name: 'Sanya Kapoor', email: 'sanya.kapoor@gratiwall.edu', passwordHash, role: 'student', department: 'School of Business' },
    { name: 'Meera Nair', email: 'meera.nair@gratiwall.edu', passwordHash, role: 'student', department: 'Humanities' },
    { name: 'Dr. Priya Raghavan', email: 'priya.raghavan@gratiwall.edu', passwordHash, role: 'faculty', department: 'School of Technology' },
    { name: 'Prof. Vikram Joshi', email: 'vikram.joshi@gratiwall.edu', passwordHash, role: 'faculty', department: 'School of Business' },
    { name: 'Dr. Fatima Sheikh', email: 'fatima.sheikh@gratiwall.edu', passwordHash, role: 'faculty', department: 'Humanities' },
    { name: 'Ramesh Yadav', email: 'ramesh.yadav@gratiwall.edu', passwordHash, role: 'staff', department: 'Campus Services' },
    { name: 'Lakshmi Ammal', email: 'lakshmi.ammal@gratiwall.edu', passwordHash, role: 'staff', department: 'Campus Services' },
    { name: 'Suresh Patil', email: 'suresh.patil@gratiwall.edu', passwordHash, role: 'staff', department: 'Administration' },
  ]);

  const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));
  const admin = byEmail['admin@gratiwall.edu'];

  // [senderEmail, recipientEmail|null, recipientName, category, message, anonymous, status, daysAgo, rejectionReason?]
  const rows = [
    // --- Approved, spread across the last 8 weeks ---
    ['aarav.mehta@gratiwall.edu', 'priya.raghavan@gratiwall.edu', null, 'Student → Faculty',
      'Thank you, Dr. Raghavan, for staying back nearly an hour after class to walk me through dynamic programming. Your knapsack example finally made memoization click for me before the midsem.', false, 'approved', 3],
    ['ishita.reddy@gratiwall.edu', 'priya.raghavan@gratiwall.edu', null, 'Student → Faculty',
      'Ma’am, the way you connected our DBMS indexing lecture to how IRCTC handles tatkal bookings made the whole concept stick. Thank you for making theory feel real.', true, 'approved', 6],
    ['rohan.deshmukh@gratiwall.edu', null, 'Aditi Kulkarni (Final Year, CSE)', 'Peer-to-Peer',
      'Aditi, you spent two full evenings before the placement drive helping me rehearse system design answers and mock HR rounds. I cleared the first round at the product company, and this one is because of you.', false, 'approved', 9],
    ['kabir.chauhan@gratiwall.edu', 'vikram.joshi@gratiwall.edu', null, 'Student → Faculty',
      'Prof. Joshi, thank you for reviewing my business model canvas three times over the weekend before the entrepreneurship conclave. Your note about unit economics changed the entire pitch.', false, 'approved', 12],
    ['meera.nair@gratiwall.edu', 'fatima.sheikh@gratiwall.edu', null, 'Student → Faculty',
      'Dr. Sheikh, you noticed I had gone quiet in the literature seminar and checked on me after class. That small kindness, and your encouragement to submit my essay to the university journal, meant more than you know.', false, 'approved', 14],
    ['sanya.kapoor@gratiwall.edu', 'ramesh.yadav@gratiwall.edu', null, 'Staff Appreciation',
      'Ramesh bhaiya and the entire mess team: the Diwali dinner you put together for those of us who couldn’t go home was genuinely special. The kaju katli tasted like home. Thank you.', false, 'approved', 17],
    ['aarav.mehta@gratiwall.edu', 'lakshmi.ammal@gratiwall.edu', null, 'Staff Appreciation',
      'Thank you, Lakshmi ma’am, for tracking down the last reference copy of the algorithms textbook and keeping it aside for me at the library desk during exam week. You saved my revision.', true, 'approved', 19],
    ['ishita.reddy@gratiwall.edu', 'rohan.deshmukh@gratiwall.edu', null, 'Peer-to-Peer',
      'Rohan, thanks for sharing your neatly organised operating systems notes with the whole batch the night before the exam, and for patiently explaining page replacement algorithms in the hostel common room.', false, 'approved', 22],
    ['priya.raghavan@gratiwall.edu', 'aarav.mehta@gratiwall.edu', null, 'Faculty → Student',
      'Aarav, your final-year project demo on low-cost air quality sensors was one of the most thoughtfully engineered student projects I have mentored. Thank you for setting the bar high for your batch.', false, 'approved', 25],
    ['vikram.joshi@gratiwall.edu', 'sanya.kapoor@gratiwall.edu', null, 'Faculty → Student',
      'Sanya, the way you led your team through the marketing case competition, calmly reallocating work when a teammate fell ill, was leadership worth recognising. Thank you for representing the school so well.', false, 'approved', 28],
    ['meera.nair@gratiwall.edu', null, 'NCC Campus Volunteers', 'Peer-to-Peer',
      'To every volunteer who stood in the sun managing crowds during the founder’s day celebration: the event ran smoothly because of you, and most of us forgot to say it that day. Thank you.', false, 'approved', 31],
    ['kabir.chauhan@gratiwall.edu', 'suresh.patil@gratiwall.edu', null, 'Staff Appreciation',
      'Mr. Patil, thank you for sorting out my bonafide certificate on the same day so I could submit my internship paperwork before the deadline. You turned a week of anxiety into a five-minute visit.', false, 'approved', 34],
    ['sanya.kapoor@gratiwall.edu', 'meera.nair@gratiwall.edu', null, 'Peer-to-Peer',
      'Meera, you stayed up editing the cultural fest brochure until the layout was perfect, even though design isn’t even your committee. The fest looked world-class because of people like you.', true, 'approved', 38],
    ['rohan.deshmukh@gratiwall.edu', 'ramesh.yadav@gratiwall.edu', null, 'Staff Appreciation',
      'Thank you to the mess staff for quietly keeping a plate aside for me on the nights my lab ran past dinner time. That hot dal and rice after a long debug session kept me going this semester.', true, 'approved', 41],
    ['fatima.sheikh@gratiwall.edu', 'meera.nair@gratiwall.edu', null, 'Faculty → Student',
      'Meera, your essay on Partition narratives was read out in my postgraduate seminar as an example of honest, careful writing. Thank you for reminding me why teaching is worthwhile.', false, 'approved', 45],
    ['aarav.mehta@gratiwall.edu', null, 'Hostel B Night Wardens', 'Staff Appreciation',
      'A quiet thank-you to the night wardens of Hostel B, who check in on students burning midnight oil during exams and keep the common room kettle running. You make 2 a.m. feel a little less lonely.', false, 'approved', 50],
    ['ishita.reddy@gratiwall.edu', 'kabir.chauhan@gratiwall.edu', null, 'Peer-to-Peer',
      'Kabir, thank you for driving me to the railway station at 5 in the morning when I had to rush home for a family emergency, and for collecting my assignments without being asked. I won’t forget it.', false, 'approved', 53],

    // --- Pending in the moderation queue ---
    ['kabir.chauhan@gratiwall.edu', 'priya.raghavan@gratiwall.edu', null, 'Student → Faculty',
      'Ma’am, your guest lecture on machine learning for finance was the first time the maths felt approachable to a business student. Thank you for meeting us where we were.', false, 'pending', 1],
    ['meera.nair@gratiwall.edu', 'lakshmi.ammal@gratiwall.edu', null, 'Staff Appreciation',
      'Lakshmi ma’am, thank you for patiently teaching me how to use the archive catalogue for my dissertation research. Two hours of your time saved me weeks.', false, 'pending', 1],
    ['sanya.kapoor@gratiwall.edu', 'aarav.mehta@gratiwall.edu', null, 'Peer-to-Peer',
      'Aarav, thanks for helping our entire marketing team automate the fest registration sheet with that script you wrote overnight. 900 registrations and zero chaos.', true, 'pending', 2],
    ['aarav.mehta@gratiwall.edu', 'vikram.joshi@gratiwall.edu', null, 'Student → Faculty',
      'Sir, thank you for the recommendation letter you wrote on short notice for my exchange application. I got in.', false, 'pending', 0],

    // --- Rejected ---
    ['rohan.deshmukh@gratiwall.edu', 'sanya.kapoor@gratiwall.edu', null, 'Peer-to-Peer',
      'Sanya, thanks for nothing in the group project lol, at least the snacks you brought were decent. This note is definitely sincere, trust me.', false, 'rejected', 8,
      'Message reads as sarcastic rather than appreciative; please resubmit with a genuine note of thanks.'],
    ['kabir.chauhan@gratiwall.edu', null, 'The Exam Committee', 'Staff Appreciation',
      'Huge thanks to whoever scheduled two back-to-back exams on the same Monday. Really looking out for our sleep schedules. Legendary planning.', true, 'rejected', 15,
      'Sarcasm directed at an administrative body is outside the spirit of the wall.'],

    // --- Flagged ---
    ['ishita.reddy@gratiwall.edu', null, 'Rahul from Section C', 'Peer-to-Peer',
      'Rahul, everyone saw what you did in the canteen queue on Tuesday. Thank you SO much for it. Hope you are proud.', false, 'flagged', 5],
  ];

  const notes = rows.map(([senderEmail, recipientEmail, freeName, category, message, anonymous, status, days, reason]) => {
    const createdAt = daysAgo(days);
    const moderated = status !== 'pending';
    return {
      sender: byEmail[senderEmail]._id,
      senderAnonymous: anonymous,
      recipient: recipientEmail ? byEmail[recipientEmail]._id : null,
      recipientName: recipientEmail ? byEmail[recipientEmail].name : freeName,
      category,
      message,
      status,
      department: recipientEmail ? byEmail[recipientEmail].department : byEmail[senderEmail].department,
      applause: status === 'approved' ? (days * 3 + message.length) % 15 : 0,
      moderatedBy: moderated ? admin._id : null,
      moderatedAt: moderated ? new Date(createdAt.getTime() + 6 * 60 * 60 * 1000) : null,
      rejectionReason: reason || null,
      createdAt,
      updatedAt: moderated ? new Date(createdAt.getTime() + 6 * 60 * 60 * 1000) : createdAt,
    };
  });

  await Note.insertMany(notes, { timestamps: false });

  const counts = await Note.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  console.log(`[seed] Created ${users.length} users and ${notes.length} notes.`);
  console.log('[seed] Note status breakdown:', JSON.stringify(Object.fromEntries(counts.map((c) => [c._id, c.count]))));
  console.log('');
  console.log('[seed] Login credentials (all accounts share the same password):');
  console.log('  Admin:   admin@gratiwall.edu / password123');
  console.log('  Student: aarav.mehta@gratiwall.edu / password123');
  console.log('  Faculty: priya.raghavan@gratiwall.edu / password123');
  console.log('  Staff:   ramesh.yadav@gratiwall.edu / password123');
  console.log('  (every seeded user @gratiwall.edu uses password: password123)');

  await mongoose.disconnect();
  console.log('[seed] Done.');
}

main().catch((err) => {
  console.error('[seed] Failed:', err.message);
  process.exitCode = 1;
});
