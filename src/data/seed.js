const ago = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();

const message = (id, text, minutes, mine = false, extra = {}) => ({
  id,
  text,
  createdAt: ago(minutes),
  mine,
  status: mine ? "read" : undefined,
  ...extra,
});

export const createInitialData = () => ({
  users: [],
  session: null,
  profile: { name: "Danny", phone: "", about: "Available", photo: "" },
  settings: {
    theme: "light",
    notifications: true,
    readReceipts: true,
    lastSeen: "Everyone",
    fontSize: "medium",
    wallpaper: "default",
  },
  contacts: [
    { id: "ada", name: "Ada Okafor", phone: "+234 803 111 2040", about: "At work", color: "#a855f7", online: true },
    { id: "tunde", name: "Tunde Bakare", phone: "+234 802 305 9182", about: "Busy", color: "#e87957", online: false },
    { id: "zara", name: "Zara Bello", phone: "+234 810 909 2281", about: "Using WhatsApp", color: "#d4547b", online: true },
    { id: "chidi", name: "Chidi Nwosu", phone: "+234 706 421 9330", about: "In a meeting", color: "#429488", online: false },
    { id: "mariam", name: "Mariam Yusuf", phone: "+234 813 554 8177", about: "😊", color: "#df994a", online: false },
    { id: "kunle", name: "Kunle Adeyemi", phone: "+234 809 570 2118", about: "Available", color: "#4382bc", online: false },
  ],
  chats: [
    {
      id: "chat-ada", name: "Ada Okafor", contactId: "ada", color: "#a855f7", unread: 2,
      pinned: true, muted: false, archived: false, blocked: false, group: false,
      messages: [
        message("a1", "Hey! Are we still on for coffee this afternoon?", 178, false),
        message("a2", "Absolutely ☕ I know a great new spot near the office.", 172, true),
        message("a3", "Perfect, see you there at 4!", 169, false),
      ],
    },
    {
      id: "chat-tunde", name: "Tunde Bakare", contactId: "tunde", color: "#e87957", unread: 0,
      pinned: false, muted: false, archived: false, blocked: false, group: false,
      messages: [
        message("t1", "Did you get a chance to look at the design?", 340, false),
        message("t2", "Just sent over the updated version. Let me know what you think!", 330, true),
      ],
    },
    {
      id: "chat-design", name: "Weekend Plans 🎉", color: "#29a77b", unread: 4,
      pinned: false, muted: true, archived: false, blocked: false, group: true,
      members: ["ada", "zara", "chidi", "mariam"],
      messages: [
        message("g1", "Saturday works for me!", 680, false, { sender: "Zara" }),
        message("g2", "I can bring snacks 😄", 612, false, { sender: "Mariam" }),
        message("g3", "Beach or rooftop? I vote rooftop.", 25, false, { sender: "Chidi" }),
      ],
    },
    {
      id: "chat-zara", name: "Zara Bello", contactId: "zara", color: "#d4547b", unread: 0,
      pinned: false, muted: false, archived: false, blocked: false, group: false,
      messages: [
        message("z1", "That playlist you shared is so good 🎶", 1420, false),
        message("z2", "Right? I have a few more if you want them!", 1398, true),
      ],
    },
    {
      id: "chat-project", name: "Project Launch 🚀", color: "#408fc5", unread: 0,
      pinned: false, muted: false, archived: false, blocked: false, group: true,
      members: ["tunde", "kunle", "mariam"],
      messages: [
        message("p1", "Quick update: we're on track for Friday.", 60, false, { sender: "Kunle" }),
        message("p2", "Amazing work, team! 🙌", 45, true),
      ],
    },
    {
      id: "chat-chidi", name: "Chidi Nwosu", contactId: "chidi", color: "#429488", unread: 0,
      pinned: false, muted: false, archived: false, blocked: false, group: false,
      messages: [message("c1", "I'll send you the notes after the meeting.", 2880, false)],
    },
  ],
  statuses: [
    { id: "s-ada", contactId: "ada", name: "Ada Okafor", color: "#a855f7", text: "A little sunshine goes a long way ☀️", createdAt: ago(38), viewed: false },
    { id: "s-zara", contactId: "zara", name: "Zara Bello", color: "#d4547b", text: "Weekend state of mind 🌴", createdAt: ago(95), viewed: false },
    { id: "s-kunle", contactId: "kunle", name: "Kunle Adeyemi", color: "#4382bc", text: "Big things are coming...", createdAt: ago(210), viewed: true },
  ],
  calls: [
    { id: "call-1", contactId: "ada", name: "Ada Okafor", kind: "voice", direction: "incoming", createdAt: ago(85), duration: "4 min" },
    { id: "call-2", contactId: "tunde", name: "Tunde Bakare", kind: "video", direction: "outgoing", createdAt: ago(310), duration: "12 min" },
    { id: "call-3", contactId: "zara", name: "Zara Bello", kind: "voice", direction: "missed", createdAt: ago(1360), duration: "" },
  ],
  communities: [
    { id: "community-work", name: "Work Buddies", color: "#6679d8", description: "Your people, all in one place", channels: ["Announcements", "General", "Project Launch"] },
  ],
});
