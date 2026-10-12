import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";

const emojiList = ["😀", "😂", "🥹", "😍", "🥰", "😊", "🙌", "👏", "🙏", "❤️", "🔥", "✨", "🎉", "☕", "👍", "😎", "🤔", "💚"];
const groupIcons = ["👥", "🎉", "💼", "📚", "🎨", "🏡", "⚽", "🎵"];
const quickReplies = ["On my way! 🚗", "Haha, absolutely 😂", "Sounds good to me!", "I’ll get back to you soon 😊", "Thanks for letting me know!"];
const stamp = () => new Date().toISOString();
const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
const nextReply = () => quickReplies[Math.floor(Math.random() * quickReplies.length)];
const replyDelay = () => 1400 + Math.random() * 900;
const canEditMessage = (message) => Date.now() - new Date(message.createdAt).getTime() < 15 * 60 * 1000;
const clock = (value) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const dayLabel = (value) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
};

function makeMessage(text, extra = {}) {
  return { id: createId("m"), text, createdAt: stamp(), mine: true, status: "sent", ...extra };
}

function Dialog({ title, children, onClose, wide = false }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className={`dialog ${wide ? "dialog-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="dialog-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></header>
      {children}
    </section>
  </div>;
}

export default function ChatPage({ data, updateData, profile, onMobileOpen }) {
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState("");
  const [insideQuery, setInsideQuery] = useState("");
  const [text, setText] = useState("");
  const [reply, setReply] = useState(null);
  const [modal, setModal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [listFilter, setListFilter] = useState("all");
  const [newGroupMembers, setNewGroupMembers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupIcon, setGroupIcon] = useState(groupIcons[0]);
  const [searchMode, setSearchMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const recorderRef = useRef(null);
  const recordChunks = useRef([]);
  const active = data.chats.find((chat) => chat.id === activeId);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active?.messages.length, activeId]);
  useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => setVoiceDuration((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        setModal(null); setMenuOpen(false); setEmojiOpen(false); setSearchMode(false);
        onMobileOpen(false);
      }
      if (event.key === "Enter" && event.target?.tagName !== "TEXTAREA" && event.target?.tagName !== "INPUT" && !event.shiftKey) {
        setEmojiOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onMobileOpen]);

  const chats = useMemo(() => data.chats
    .filter((chat) => listFilter === "archived" ? chat.archived : !chat.archived)
    .filter((chat) => listFilter === "unread" ? chat.unread > 0 : true)
    .filter((chat) => listFilter === "starred" ? chat.messages.some((message) => message.starred) : true)
    .filter((chat) => `${chat.name} ${chat.messages.at(-1)?.text || ""}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.messages.at(-1)?.createdAt || 0) - new Date(a.messages.at(-1)?.createdAt || 0)), [data.chats, listFilter, query]);
  const visibleMessages = active?.messages.filter((message) => `${message.text || ""} ${message.sender || ""}`.toLowerCase().includes(insideQuery.toLowerCase())) || [];

  function patchChat(chatId, updater) {
    updateData((current) => ({ ...current, chats: current.chats.map((chat) => chat.id === chatId ? updater(chat) : chat) }));
  }

  function sendMessage(message, shouldReply = true) {
    if (!active || active.blocked) return;
    const chatId = active.id;
    patchChat(chatId, (chat) => ({ ...chat, unread: 0, messages: [...chat.messages, message] }));
    setText("");
    setReply(null);
    setEmojiOpen(false);
    window.setTimeout(() => {
      updateData((current) => ({ ...current, chats: current.chats.map((chat) => chat.id === chatId ? {
        ...chat, messages: chat.messages.map((item) => item.id === message.id ? { ...item, status: "delivered" } : item),
      } : chat) }));
    }, 650);
    if (shouldReply && !active.group) {
      setTyping(true);
      window.setTimeout(() => {
        const response = nextReply();
        updateData((current) => ({ ...current, chats: current.chats.map((chat) => chat.id === chatId ? {
          ...chat,
          messages: [...chat.messages.map((item) => item.id === message.id && current.settings.readReceipts ? { ...item, status: "read" } : item), { id: createId("r"), text: response, createdAt: stamp(), mine: false }],
        } : chat) }));
        setTyping(false);
      }, replyDelay());
    }
  }

  function submitMessage(event) {
    if (event) event.preventDefault();
    if (!text.trim() || !active) return;
    sendMessage(makeMessage(text.trim(), reply ? { replyTo: { id: reply.id, text: reply.text, sender: reply.mine ? "You" : reply.sender || active.name } } : {}));
  }

  function selectContact(contact, isGroup = false) {
    if (isGroup) {
      setNewGroupMembers((members) => members.includes(contact.id) ? members.filter((id) => id !== contact.id) : [...members, contact.id]);
      return;
    }
    let existing = data.chats.find((chat) => chat.contactId === contact.id);
    if (!existing) {
      existing = { id: createId(`chat-${contact.id}`), name: contact.name, contactId: contact.id, color: contact.color, unread: 0, pinned: false, muted: false, archived: false, blocked: false, group: false, messages: [] };
      updateData((current) => ({ ...current, chats: [existing, ...current.chats] }));
    }
    setActiveId(existing.id);
    setModal(null);
    onMobileOpen(true);
  }

  function createGroup() {
    if (!groupName.trim() || newGroupMembers.length < 2) return;
    const group = {
      id: createId("group"), name: groupName.trim(), color: "#178c70", icon: groupIcon, group: true, members: newGroupMembers,
      unread: 0, pinned: false, muted: false, archived: false, blocked: false,
      messages: [{ id: createId("welcome"), text: `${profile.name} created the group`, createdAt: stamp(), mine: false, system: true }],
    };
    updateData((current) => ({ ...current, chats: [group, ...current.chats] }));
    setActiveId(group.id); setModal(null); setGroupName(""); setNewGroupMembers([]); onMobileOpen(true);
  }

  async function toggleRecording() {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      window.alert("Voice recording is not supported by this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recordChunks.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) recordChunks.current.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        if (recordChunks.current.length && active) {
          const audioBlob = new Blob(recordChunks.current, { type: recorder.mimeType || "audio/webm" });
          const reader = new FileReader();
          reader.onerror = () => window.alert("The voice note could not be saved.");
          reader.onload = () => sendMessage(makeMessage("", { audioUrl: reader.result, duration: voiceDuration }));
          reader.readAsDataURL(audioBlob);
        }
        setVoiceDuration(0);
      };
      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Unable to start voice recording.", error);
      window.alert("Microphone access was denied or unavailable.");
    }
  }

  function attachFile(file) {
    if (!file || !active) return;
    if (file.size > 5_000_000) {
      window.alert("Files must be smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => window.alert("That file could not be read.");
    reader.onload = () => setModal({ type: "attachment-preview", fileName: file.name, fileType: file.type, dataUrl: reader.result, image: file.type.startsWith("image/") });
    reader.readAsDataURL(file);
  }

  async function copyMessage(message) {
    try { await navigator.clipboard.writeText(message.text || message.fileName || ""); }
    catch (error) { console.error("Clipboard access failed.", error); }
  }

  function messageAction(action, message) {
    if (action === "reply") setReply(message);
    if (action === "star") patchChat(active.id, (chat) => ({ ...chat, messages: chat.messages.map((item) => item.id === message.id ? { ...item, starred: !item.starred } : item) }));
    if (action === "copy") void copyMessage(message);
    if (action === "edit") { setReply({ ...message, editing: true }); setText(message.text); }
    if (action === "delete") setModal({ type: "delete-message", message });
    if (action === "forward") setModal({ type: "forward", message });
  }

  function saveEditedMessage() {
    if (!reply?.editing || !active) return;
    if (!canEditMessage(reply)) { window.alert("Messages can only be edited for 15 minutes."); setReply(null); setText(""); return; }
    patchChat(active.id, (chat) => ({ ...chat, messages: chat.messages.map((item) => item.id === reply.id ? { ...item, text: text.trim(), edited: true } : item) }));
    setReply(null); setText("");
  }

  function chatAction(action) {
    if (!active) return;
    if (action === "info") setModal({ type: "info" });
    if (action === "clear") patchChat(active.id, (chat) => ({ ...chat, messages: [] }));
    if (action === "delete") { updateData((current) => ({ ...current, chats: current.chats.filter((chat) => chat.id !== active.id) })); setActiveId(null); }
    if (["pin", "mute", "archive", "block"].includes(action)) {
      patchChat(active.id, (chat) => ({ ...chat, [action === "pin" ? "pinned" : action === "mute" ? "muted" : action === "archive" ? "archived" : "blocked"]: action === "block" ? !chat.blocked : !chat[action === "pin" ? "pinned" : action === "mute" ? "muted" : "archived"] }));
      if (action === "archive") setActiveId(null);
    }
    setMenuOpen(false);
  }

  function forwardTo(chat) {
    const message = modal.message;
    updateData((current) => ({
      ...current,
      chats: current.chats.map((item) => item.id === chat.id
        ? {
          ...item,
          messages: [...item.messages, {
            ...makeMessage(message.text || "Shared attachment", {
              forwarded: true,
              imageUrl: message.imageUrl,
              fileName: message.fileName,
            }),
            id: createId("forward"),
          }],
        }
        : item),
    }));
    setModal(null);
  }

  function handleFileChange(event) {
    attachFile(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }

  return (
    <div className={`chat-workspace ${active ? "has-active-chat" : ""}`}>
      <section className="chat-list-panel" aria-label="Chats">
        <header className="list-heading"><div><h1>Chats</h1><span className="list-heading-sub">Stay connected, always</span></div>
          <div className="heading-actions"><button className="icon-button" aria-label="New chat" title="New chat" onClick={() => setModal({ type: "contacts" })}><Icon name="plus" /></button><button className="icon-button" aria-label="New group" title="New group" onClick={() => setModal({ type: "group" })}><Icon name="communities" /></button></div>
        </header>
        <label className="search-field"><Icon name="search" size={17} /><input aria-label="Search chats" placeholder="Search or start a new chat" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button className="clear-search" onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" size={15} /></button>}</label>
        <div className="filter-strip" aria-label="Filter chats">
          {[["all", "All"], ["unread", "Unread"], ["starred", "Favourites"], ["archived", "Archived"]].map(([filter, label]) => <button key={filter} className={listFilter === filter ? "filter-active" : ""} onClick={() => setListFilter(filter)}>{label}</button>)}
        </div>
        <div className="chat-items">
          {chats.length ? chats.map((chat) => {
            const last = chat.messages.at(-1);
            const contact = data.contacts.find((person) => person.id === chat.contactId);
            return <button key={chat.id} className={`chat-list-item ${activeId === chat.id ? "chat-selected" : ""}`} onClick={() => { setActiveId(chat.id); setInsideQuery(""); if (chat.unread) patchChat(chat.id, (current) => ({ ...current, unread: 0 })); onMobileOpen(true); }}>
              <Avatar name={chat.name} color={chat.color} photo={chat.photo} icon={chat.icon} online={Boolean(contact?.online)} />
              <span className="chat-item-info"><span className="chat-item-top"><strong>{chat.name}</strong><time>{last ? clock(last.createdAt) : ""}</time></span>
                <span className="chat-item-bottom"><span className="chat-last-message">{last?.mine ? <span className="last-you">You: </span> : ""}{last?.text || (last?.imageUrl ? "📷 Photo" : last?.audioUrl ? "🎤 Voice message" : "Start a conversation")}</span>
                  <span className="chat-item-icons">{chat.pinned && <span title="Pinned">📌</span>}{chat.muted && <span title="Muted">🔕</span>}{chat.unread > 0 && <b>{chat.unread}</b>}</span></span>
            </span></button>;
          }) : <div className="empty-card"><div className="empty-illustration">⌕</div><strong>{listFilter === "archived" ? "No archived chats" : "No chats found"}</strong><p>Start a conversation with someone in your contacts.</p><button className="text-button" onClick={() => setModal({ type: "contacts" })}>Start a chat</button></div>}
        </div>
        <footer className="list-footer"><span className="secure-lock">♧</span> Your personal messages are end-to-end encrypted</footer>
      </section>

      <section className="conversation-panel" aria-label="Conversation">
        {active ? <>
          <header className="conversation-header">
            <button className="mobile-back icon-button" onClick={() => onMobileOpen(false)} aria-label="Back to chats"><Icon name="back" /></button>
            <Avatar name={active.name} color={active.color} photo={active.photo} icon={active.icon} />
            <button className="conversation-identity" onClick={() => setModal({ type: "info" })}><strong>{active.name}</strong><span>{typing ? "typing…" : active.blocked ? "Blocked" : active.group ? `${active.members?.length || 0} members` : data.contacts.find((item) => item.id === active.contactId)?.online ? "online" : "last seen recently"}</span></button>
            <div className="conversation-actions">
              {searchMode ? <label className="inline-search"><Icon name="search" size={16} /><input autoFocus placeholder="Search messages" value={insideQuery} onChange={(event) => setInsideQuery(event.target.value)} /><button className="clear-search" onClick={() => { setSearchMode(false); setInsideQuery(""); }} aria-label="Close search"><Icon name="close" size={16} /></button></label> : <>
                <button className="icon-button" aria-label="Search in conversation" title="Search messages" onClick={() => setSearchMode(true)}><Icon name="search" /></button>
                <button className="call-button" onClick={() => window.dispatchEvent(new CustomEvent("start-call", { detail: { chat: active, kind: "video" } }))} aria-label="Video call" title="Video call"><Icon name="video" /></button>
                <button className="icon-button" onClick={() => window.dispatchEvent(new CustomEvent("start-call", { detail: { chat: active, kind: "voice" } }))} aria-label="Voice call" title="Voice call"><Icon name="phone" /></button>
                <div className="menu-holder"><button className="icon-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Chat menu"><Icon name="more" /></button>{menuOpen && <div className="popup-menu">
                  <button onClick={() => chatAction("info")}>Contact info</button><button onClick={() => chatAction("mute")}>{active.muted ? "Unmute" : "Mute"} notifications</button><button onClick={() => chatAction("pin")}>{active.pinned ? "Unpin" : "Pin"} chat</button><button onClick={() => chatAction("archive")}>Archive chat</button><button onClick={() => chatAction("clear")}>Clear messages</button><button onClick={() => chatAction("block")}>{active.blocked ? "Unblock contact" : "Block contact"}</button><button className="danger-option" onClick={() => chatAction("delete")}>Delete chat</button>
                </div>}</div>
              </>}
            </div>
          </header>
          <div className={`message-scroll wallpaper-${data.settings.wallpaper}`} role="log" aria-live="polite">
            {visibleMessages.map((message, index) => {
              const previous = visibleMessages[index - 1];
              const showDay = !previous || dayLabel(previous.createdAt) !== dayLabel(message.createdAt);
              return <div key={message.id}>
                {showDay && <div className="day-divider"><span>{dayLabel(message.createdAt)}</span></div>}
                {message.system ? <div className="system-message">{message.text}</div> : <article className={`message-row ${message.mine ? "message-mine" : ""}`}>
                  <div className="message-bubble">
                    {active.group && !message.mine && <strong className="message-sender">{message.sender || data.contacts.find((person) => person.id === active.contactId)?.name || "Member"}</strong>}
                    {message.forwarded && <span className="forwarded-label">↪ Forwarded</span>}
                    {message.replyTo && <div className="quoted-message"><strong>{message.replyTo.sender}</strong><span>{message.replyTo.text}</span></div>}
                    {message.imageUrl && <img className="message-image" src={message.imageUrl} alt={message.fileName || "Shared image"} />}
                    {message.audioUrl && <div className="voice-message"><span className="wave-icon">▂▅▃▇▅▂▆▃</span><audio controls src={message.audioUrl} aria-label="Voice message" /><small>{message.duration}s</small></div>}
                    {message.fileName && !message.imageUrl && !message.audioUrl && <a className="file-attachment" href={message.fileUrl} download={message.fileName}><span>📄</span><span><strong>{message.fileName}</strong><small>Download file</small></span></a>}
                    {message.text && <p>{message.text}</p>}
                    <footer><span>{message.edited ? "edited · " : ""}{clock(message.createdAt)}</span>{message.mine && <span className={`message-ticks ${data.settings.readReceipts && message.status === "read" ? "read" : ""}`} aria-label={data.settings.readReceipts ? message.status : "sent"}>{message.status === "sent" ? "✓" : "✓✓"}</span>}{message.starred && <span title="Starred">★</span>}</footer>
                    <div className="message-actions" aria-label="Message actions">
                      <button title="Reply" aria-label="Reply" onClick={() => messageAction("reply", message)}>↩</button><button title="Forward" aria-label="Forward" onClick={() => messageAction("forward", message)}>↪</button><button title={message.starred ? "Unstar" : "Star"} aria-label="Star message" onClick={() => messageAction("star", message)}>☆</button><button title="Copy" aria-label="Copy message" onClick={() => messageAction("copy", message)}>▢</button>
                        {message.mine && canEditMessage(message) && <button title="Edit" aria-label="Edit message" onClick={() => messageAction("edit", message)}>✎</button>}
                        <button title="Delete message" aria-label="Delete message" onClick={() => messageAction("delete", message)}>⌫</button>
                    </div>
                  </div>
                </article>}
              </div>;
            })}
            {typing && <div className="typing-bubble" aria-label="Contact is typing"><i /><i /><i /></div>}
            {active.messages.length === 0 && <div className="conversation-empty"><span>👋</span><strong>Say hello to {active.name.split(" ")[0]}</strong><p>Your messages will appear here.</p></div>}
            <div ref={endRef} />
          </div>
          {active.blocked ? <div className="blocked-banner">You blocked this contact. <button onClick={() => chatAction("block")}>Unblock</button></div> : <form className="composer" onSubmit={reply?.editing ? (event) => { event.preventDefault(); saveEditedMessage(); } : submitMessage}>
            {reply && <div className="reply-bar"><div><strong>{reply.editing ? "Editing message" : `Replying to ${reply.mine ? "yourself" : reply.sender || active.name}`}</strong><span>{reply.text}</span></div><button type="button" className="icon-button" onClick={() => { setReply(null); setText(""); }} aria-label="Cancel reply"><Icon name="close" size={17} /></button></div>}
            {emojiOpen && <div className="emoji-picker" aria-label="Emoji picker">{emojiList.map((emoji) => <button key={emoji} type="button" onClick={() => setText((value) => value + emoji)}>{emoji}</button>)}</div>}
            <button type="button" className={`icon-button composer-emoji ${emojiOpen ? "active" : ""}`} onClick={() => setEmojiOpen((value) => !value)} aria-label="Add emoji"><Icon name="smile" /></button>
            <button type="button" className="icon-button composer-attach" onClick={() => fileRef.current?.click()} aria-label="Attach a file"><Icon name="attach" /></button>
            <input ref={fileRef} type="file" hidden accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileChange} />
            <textarea aria-label="Type a message" placeholder={recording ? `Recording voice note · 0:${String(voiceDuration).padStart(2, "0")}` : "Type a message"} value={text} rows="1" onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (reply?.editing) saveEditedMessage();
                else submitMessage(event);
              }
            }} />
            {text.trim() ? <button type="submit" className="send-button" aria-label={reply?.editing ? "Save edit" : "Send message"}><Icon name={reply?.editing ? "check" : "send"} /></button> : <button type="button" className={`send-button ${recording ? "recording" : ""}`} onClick={() => void toggleRecording()} aria-label={recording ? "Stop and send recording" : "Record voice message"}><Icon name="mic" /></button>}
          </form>}
        </> : <div className="welcome-panel"><div className="welcome-art"><span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" /><div className="welcome-phone"><div className="phone-notch" /><span>☘</span></div></div><h2>WhatsApp Web</h2><p>Send and receive messages without keeping your phone online.<br />Use WhatsApp on up to 4 linked devices at the same time.</p><div className="welcome-encryption"><span>♧</span> End-to-end encrypted</div></div>}
      </section>

      {modal?.type === "contacts" && <Dialog title="New chat" onClose={() => setModal(null)}>
        <div className="dialog-search"><Icon name="search" size={16} /><input autoFocus placeholder="Search contacts" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="contact-picker"><button className="contact-row create-group-row" onClick={() => setModal({ type: "group" })}><span className="contact-plus"><Icon name="communities" /></span><strong>New group</strong></button>
          {data.contacts.filter((contact) => contact.name.toLowerCase().includes(query.toLowerCase())).map((contact) => <button key={contact.id} className="contact-row" onClick={() => selectContact(contact)}><Avatar name={contact.name} color={contact.color} /><span><strong>{contact.name}</strong><small>{contact.about}</small></span><span className="contact-status-dot" /></button>)}
        </div>
      </Dialog>}
      {modal?.type === "group" && <Dialog title="Create a group" onClose={() => { setModal(null); setNewGroupMembers([]); setGroupName(""); }}>
        <label className="field-label">Group name<input autoFocus value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Give your group a name" maxLength="40" /></label>
        <fieldset className="group-icon-picker"><legend>Choose a group icon</legend>{groupIcons.map((icon) => <button key={icon} type="button" className={groupIcon === icon ? "group-icon-selected" : ""} onClick={() => setGroupIcon(icon)} aria-label={`Use ${icon} as group icon`}>{icon}</button>)}</fieldset>
        <p className="section-overline">Add at least 2 members</p>
        <div className="contact-picker group-picker">{data.contacts.map((contact) => <label key={contact.id} className="contact-row"><Avatar name={contact.name} color={contact.color} /><span><strong>{contact.name}</strong><small>{contact.phone}</small></span><input type="checkbox" checked={newGroupMembers.includes(contact.id)} onChange={() => selectContact(contact, true)} aria-label={`Add ${contact.name}`} /></label>)}</div>
        <div className="dialog-footer"><button className="primary-button" disabled={!groupName.trim() || newGroupMembers.length < 2} onClick={createGroup}>Create group</button></div>
      </Dialog>}
      {modal?.type === "info" && <Dialog title="Contact info" onClose={() => setModal(null)}>
        <div className="contact-info"><Avatar name={active.name} color={active.color} size="large" /><h2>{active.name}</h2><p>{active.group ? `Group · ${active.members?.length || 0} members` : data.contacts.find((person) => person.id === active.contactId)?.phone}</p><div className="info-about"><small>About</small><span>{data.contacts.find((person) => person.id === active.contactId)?.about || "Group conversation"}</span></div><div className="info-buttons"><button onClick={() => chatAction("mute")}>🔕 {active.muted ? "Unmute" : "Mute"}</button><button onClick={() => chatAction("block")}>🚫 {active.blocked ? "Unblock" : "Block"}</button></div></div>
      </Dialog>}
      {modal?.type === "forward" && <Dialog title="Forward message to…" onClose={() => setModal(null)}>
        <div className="contact-picker">{data.chats.filter((chat) => chat.id !== activeId).map((chat) => <button key={chat.id} className="contact-row" onClick={() => forwardTo(chat)}><Avatar name={chat.name} color={chat.color} /><strong>{chat.name}</strong><Icon name="send" size={17} /></button>)}</div>
      </Dialog>}
      {modal?.type === "delete-message" && <Dialog title="Delete message?" onClose={() => setModal(null)}>
        <p className="delete-prompt">Choose whether to remove this message from your chat or for everyone.</p>
        <div className="delete-actions"><button className="secondary-button" onClick={() => { patchChat(active.id, (chat) => ({ ...chat, messages: chat.messages.filter((item) => item.id !== modal.message.id) })); setModal(null); }}>Delete for me</button>{modal.message.mine && <button className="primary-button delete-everyone" onClick={() => { patchChat(active.id, (chat) => ({ ...chat, messages: chat.messages.map((item) => item.id === modal.message.id ? { ...item, text: "This message was deleted", imageUrl: null, fileName: null, audioUrl: null, deleted: true } : item) })); setModal(null); }}>Delete for everyone</button>}</div>
      </Dialog>}
      {modal?.type === "attachment-preview" && <Dialog title={modal.image ? "Preview photo" : "Preview file"} onClose={() => setModal(null)}>
        {modal.image ? <img className="attachment-preview-image" src={modal.dataUrl} alt="Attachment preview" /> : <div className="attachment-preview-file"><span>📄</span><strong>{modal.fileName}</strong><small>{modal.fileType || "File"}</small></div>}
        <div className="dialog-footer"><button className="secondary-button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" onClick={() => { const attachment = modal; sendMessage(makeMessage("", attachment.image ? { imageUrl: attachment.dataUrl, fileName: attachment.fileName } : { fileUrl: attachment.dataUrl, fileName: attachment.fileName, fileType: attachment.fileType })); }}>Send</button></div>
      </Dialog>}
    </div>
  );
}
