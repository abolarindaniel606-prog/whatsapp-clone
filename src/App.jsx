import { useState, useRef, useEffect } from "react";

const css = `
*{box-sizing:border-box;margin:0}
body{font-family:system-ui,sans-serif;background:#d1d7db}
.app{display:flex;height:100vh;max-width:1200px;margin:0 auto;background:#fff}
.side{width:340px;border-right:1px solid #e9edef;display:flex;flex-direction:column}
.side header,.main header{background:#f0f2f5;padding:14px 16px;font-weight:600;display:flex;align-items:center;gap:12px}
.search{padding:8px 12px;border-bottom:1px solid #e9edef}
.search input{width:100%;padding:8px 12px;border:none;background:#f0f2f5;border-radius:8px;outline:none}
.list{overflow-y:auto;flex:1}
.chat{display:flex;gap:12px;padding:12px 16px;cursor:pointer;border-bottom:1px solid #f0f2f5}
.chat:hover,.chat.active{background:#f0f2f5}
.avatar{width:44px;height:44px;border-radius:50%;background:#00a884;color:#fff;display:grid;place-items:center;font-weight:600;flex-shrink:0}
.meta{flex:1;min-width:0}
.row{display:flex;justify-content:space-between}
.name{font-weight:500}
.time{font-size:12px;color:#667781}
.preview{font-size:14px;color:#667781;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.main{flex:1;display:flex;flex-direction:column;background:#efeae2}
.msgs{flex:1;overflow-y:auto;padding:20px 8%;display:flex;flex-direction:column;gap:6px}
.bubble{max-width:65%;padding:7px 10px;border-radius:8px;font-size:14.5px;background:#fff;align-self:flex-start;box-shadow:0 1px 1px rgba(0,0,0,.1)}
.bubble.me{background:#d9fdd3;align-self:flex-end}
.bubble small{display:block;text-align:right;font-size:11px;color:#667781;margin-top:2px}
.composer{display:flex;gap:10px;padding:10px 16px;background:#f0f2f5}
.composer input{flex:1;padding:10px 14px;border:none;border-radius:8px;outline:none;font-size:15px}
.composer button{border:none;background:#00a884;color:#fff;padding:0 18px;border-radius:8px;cursor:pointer;font-weight:600}
.empty{margin:auto;color:#667781}
@media(max-width:700px){.side{width:100%}.main{display:none}.app.open .side{display:none}.app.open .main{display:flex}}
`;

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const initial = [
  { id: 1, name: "Ada", messages: [{ id: 1, text: "Hey Henry, how far?", me: false, time: "09:12" }] },
  { id: 2, name: "Tunde", messages: [{ id: 1, text: "Did you finish the assignment?", me: false, time: "08:40" }] },
  { id: 3, name: "Study Group", messages: [{ id: 1, text: "Meeting at 5pm today", me: false, time: "07:55" }] },
];

const replies = ["Okay, noted!", "Haha nice one", "Let's talk later", "Sure, sounds good", "Seen!"];

export default function App() {
  const [chats, setChats] = useState(initial);
  const [activeId, setActiveId] = useState(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const endRef = useRef(null);

  const active = chats.find((c) => c.id === activeId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, activeId]);

  const addMessage = (chatId, msg) =>
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, messages: [...c.messages, { id: Date.now() + Math.random(), ...msg, time: now() }] } : c
      )
    );

  const send = () => {
    if (!text.trim() || !active) return;
    const chatId = active.id;
    addMessage(chatId, { text: text.trim(), me: true });
    setText("");
    setTimeout(() => {
      addMessage(chatId, { text: replies[Math.floor(Math.random() * replies.length)], me: false });
    }, 1200);
  };

  const filtered = chats.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <style>{css}</style>
      <div className={"app" + (active ? " open" : "")}>
        <aside className="side">
          <header>Henry Chats</header>
          <div className="search">
            <input placeholder="Search or start new chat" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="list">
            {filtered.map((c) => {
              const last = c.messages[c.messages.length - 1];
              return (
                <div key={c.id} className={"chat" + (c.id === activeId ? " active" : "")} onClick={() => setActiveId(c.id)}>
                  <div className="avatar">{c.name[0]}</div>
                  <div className="meta">
                    <div className="row">
                      <span className="name">{c.name}</span>
                      <span className="time">{last.time}</span>
                    </div>
                    <div className="preview">{last.me ? "You: " : ""}{last.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="main">
          {active ? (
            <>
              <header>
                <div className="avatar">{active.name[0]}</div>
                {active.name}
              </header>
              <div className="msgs">
                {active.messages.map((m) => (
                  <div key={m.id} className={"bubble" + (m.me ? " me" : "")}>
                    {m.text}
                    <small>{m.time}{m.me ? " ✓✓" : ""}</small>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="composer">
                <input
                  placeholder="Type a message"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <button onClick={send}>Send</button>
              </div>
            </>
          ) : (
            <div className="empty">Select a chat to start messaging</div>
          )}
        </section>
      </div>
    </>
  );
}