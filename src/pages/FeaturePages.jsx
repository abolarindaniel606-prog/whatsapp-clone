import { useEffect, useRef, useState } from "react";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";

const age = (date) => {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return "Yesterday";
};

export function StatusPage({ data, updateData }) {
  const [story, setStory] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const imageRef = useRef(null);
  const ownStatus = data.statuses.filter((item) => item.own);
  const others = data.statuses.filter((item) => !item.own).filter((item) => item.name.toLowerCase().includes(filter.toLowerCase()));

  useEffect(() => {
    const expire = () => updateData((current) => {
      const fresh = current.statuses.filter((item) => Date.now() - new Date(item.createdAt).getTime() < 24 * 60 * 60 * 1000);
      return fresh.length === current.statuses.length ? current : { ...current, statuses: fresh };
    });
    const timer = window.setInterval(expire, 60_000);
    return () => window.clearInterval(timer);
  }, [updateData]);
  useEffect(() => {
    const closePanel = (event) => {
      if (event.key === "Escape") { setStory(null); setComposerOpen(false); }
    };
    window.addEventListener("keydown", closePanel);
    return () => window.removeEventListener("keydown", closePanel);
  }, []);

  function addStatus(extra = {}) {
    if (!statusText.trim() && !extra.imageUrl) return;
    updateData((current) => ({ ...current, statuses: [{ id: `status-${Date.now()}`, name: data.profile.name, color: "#128c7e", text: statusText.trim(), own: true, createdAt: new Date().toISOString(), ...extra }, ...current.statuses] }));
    setStatusText(""); setComposerOpen(false);
  }

  function selectImage(file) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5_000_000) {
      window.alert("Choose an image smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => window.alert("That image could not be read.");
    reader.onload = () => addStatus({ imageUrl: reader.result });
    reader.readAsDataURL(file);
  }

  function openStory(item) {
    setStory(item);
    updateData((current) => ({ ...current, statuses: current.statuses.map((status) => status.id === item.id ? { ...status, viewed: true } : status) }));
  }

  return <section className="feature-page status-page">
    <header className="feature-header"><div><h1>Status</h1><p>Share a moment with your contacts</p></div><label className="search-field feature-search"><Icon name="search" size={17} /><input aria-label="Search status updates" placeholder="Search updates" value={filter} onChange={(event) => setFilter(event.target.value)} /></label></header>
    <div className="status-layout">
      <div className="status-column">
        <h2>My status</h2>
        <div className="my-status-row">
          <button className="status-avatar-wrap" onClick={() => setComposerOpen(true)} aria-label="Add to my status"><Avatar name={data.profile.name} color="#128c7e" photo={data.profile.photo} size="large" /><span className="status-add">+</span></button>
          <button className="status-row-copy" onClick={() => ownStatus.length ? openStory(ownStatus[0]) : setComposerOpen(true)}><strong>{ownStatus.length ? "My status" : "Add a status update"}</strong><small>{ownStatus.length ? age(ownStatus[0].createdAt) : "Share a photo or text"}</small></button>
          <button className="icon-button" aria-label="Create status" onClick={() => setComposerOpen(true)}><Icon name="plus" /></button>
        </div>
        {ownStatus.length > 0 && <div className="own-status-preview">{ownStatus[0].imageUrl ? <img src={ownStatus[0].imageUrl} alt="Your latest status" /> : <p>{ownStatus[0].text}</p>}<span>Visible to your contacts · disappears in 24 hours</span></div>}
        <h2 className="recent-title">Recent updates <span>{others.length}</span></h2>
        {others.length ? others.map((item) => <button key={item.id} className="status-row" onClick={() => openStory(item)}>
          <span className={`story-ring ${item.viewed ? "story-seen" : ""}`}><Avatar name={item.name} color={item.color} /></span>
          <span className="status-row-copy"><strong>{item.name}</strong><small>{age(item.createdAt)}</small></span><span className="status-preview">{item.text || "Photo update"}</span>
        </button>) : <div className="feature-empty"><div>◷</div><strong>All caught up</strong><p>New status updates from your contacts will appear here.</p></div>}
      </div>
      <div className="status-side-note"><div className="status-phone-art"><span>◉</span><i>◌</i></div><h3>Share everyday moments</h3><p>Status updates disappear after 24 hours. Only your contacts can see them.</p></div>
    </div>
    {composerOpen && <div className="modal-backdrop"><section className="dialog status-composer" role="dialog" aria-modal="true" aria-label="Add status"><header className="dialog-header"><h2>My status</h2><button className="icon-button" onClick={() => setComposerOpen(false)} aria-label="Close"><Icon name="close" /></button></header>
      <textarea autoFocus aria-label="Status text" placeholder="What’s on your mind?" value={statusText} onChange={(event) => setStatusText(event.target.value)} maxLength="700" />
      <div className="dialog-footer"><button className="secondary-button" onClick={() => imageRef.current?.click()}>＋ Add a photo</button><input ref={imageRef} hidden type="file" accept="image/*" onChange={(event) => { selectImage(event.target.files?.[0]); event.target.value = ""; }} /><button className="primary-button" onClick={() => addStatus()} disabled={!statusText.trim()}>Share status</button></div>
    </section></div>}
    {story && <div className="story-viewer" role="dialog" aria-modal="true" aria-label={`${story.name}'s status`} onClick={() => setStory(null)} style={story.imageUrl ? { backgroundImage: `url(${story.imageUrl})` } : {}}>
      <div className="story-progress"><span /></div><div className="story-viewer-head"><Avatar name={story.name} color={story.color} size="small" /><strong>{story.own ? "My status" : story.name}</strong><small>{age(story.createdAt)}</small><button onClick={() => setStory(null)} aria-label="Close status"><Icon name="close" /></button></div>
      {!story.imageUrl && <div className="story-text">{story.text}</div>}
      <div className="story-viewer-caption">{story.text}</div>
    </div>}
  </section>;
}

export function CallsPage({ data, updateData, startCall }) {
  const contactLookup = (id) => data.contacts.find((contact) => contact.id === id);
  const startHistoryCall = (call, kind = call.kind) => startCall({ name: call.name, color: contactLookup(call.contactId)?.color || "#128c7e", kind });
  return <section className="feature-page">
    <header className="feature-header"><div><h1>Calls</h1><p>Stay close, wherever you are</p></div><button className="primary-button" onClick={() => startCall({ name: "New call", kind: "voice" })}><Icon name="plus" size={17} /> New call</button></header>
    <div className="calls-content"><div className="calls-invite"><span className="call-art">⌕</span><div><h2>Make a call</h2><p>Voice and video calls are private and secure.</p></div><button className="text-button" onClick={() => startCall({ name: "New call", kind: "voice" })}>Start a call</button></div>
      <div className="history-header"><h2>Recent</h2><button className="text-button" onClick={() => updateData((current) => ({ ...current, calls: [] }))}>Clear call log</button></div>
      <div className="call-history">{data.calls.length ? data.calls.map((call) => {
        const contact = contactLookup(call.contactId);
        return <article className="call-row" key={call.id}><Avatar name={call.name} color={contact?.color || "#128c7e"} /><div className="call-row-info"><strong>{call.name}</strong><span className={call.direction === "missed" ? "missed-call" : ""}><i>{call.direction === "incoming" ? "↙" : call.direction === "missed" ? "↙" : "↗"}</i>{call.direction === "missed" ? "Missed" : call.direction === "incoming" ? "Incoming" : "Outgoing"} · {age(call.createdAt)}</span></div>{call.duration && <small>{call.duration}</small>}<button className="icon-button call-redial" aria-label={`Call ${call.name}`} onClick={() => startHistoryCall(call)}><Icon name="phone" /></button><button className="icon-button call-redial" aria-label={`Video call ${call.name}`} onClick={() => startHistoryCall(call, "video")}><Icon name="video" /></button></article>;
      }) : <div className="feature-empty"><div>◉</div><strong>No recent calls</strong><p>Your call history will show up here.</p></div>}</div>
    </div>
  </section>;
}

export function CommunitiesPage({ data, updateData }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expanded, setExpanded] = useState(null);
  useEffect(() => {
    const closePanel = (event) => { if (event.key === "Escape") setCreating(false); };
    window.addEventListener("keydown", closePanel);
    return () => window.removeEventListener("keydown", closePanel);
  }, []);
  function createCommunity(event) {
    event.preventDefault();
    if (!name.trim()) return;
    const community = { id: `community-${Date.now()}`, name: name.trim(), description: description.trim() || "A place to connect with your community", color: "#6378d6", channels: ["Announcements", "General"] };
    updateData((current) => ({ ...current, communities: [...current.communities, community] }));
    setName(""); setDescription(""); setCreating(false); setExpanded(community.id);
  }
  function addChannel(community) {
    const channel = window.prompt("Name your new group channel");
    if (!channel?.trim()) return;
    updateData((current) => ({ ...current, communities: current.communities.map((item) => item.id === community.id ? { ...item, channels: [...item.channels, channel.trim()] } : item) }));
  }
  return <section className="feature-page">
    <header className="feature-header"><div><h1>Communities</h1><p>Bring your groups together in one place</p></div><button className="primary-button" onClick={() => setCreating(true)}><Icon name="plus" size={17} /> New community</button></header>
    <div className="community-intro"><div className="community-art"><Icon name="communities" size={44} /></div><div><h2>Organize your groups</h2><p>Communities bring members together with announcements and channels for all the conversations that matter.</p></div></div>
    <h2 className="community-heading">Your communities <span>{data.communities.length}</span></h2>
    <div className="community-list">{data.communities.length ? data.communities.map((community) => <article className="community-card" key={community.id}>
      <button className="community-summary" onClick={() => setExpanded(expanded === community.id ? null : community.id)}><Avatar name={community.name} color={community.color} size="large" /><span><strong>{community.name}</strong><small>{community.description} · {community.channels.length} groups</small></span><span className="community-chevron">{expanded === community.id ? "⌃" : "⌄"}</span></button>
      {expanded === community.id && <div className="community-channels"><div className="announcement-channel"><span className="announcement-icon">📣</span><span><strong>Announcements</strong><small>Only admins can send messages</small></span></div>{community.channels.filter((channel) => channel !== "Announcements").map((channel) => <div className="channel-row" key={channel}><span className="channel-icon">#</span><strong>{channel}</strong><span>›</span></div>)}<button className="add-channel" onClick={() => addChannel(community)}><Icon name="plus" size={17} /> Add group</button></div>}
    </article>) : <div className="feature-empty"><div>♧</div><strong>No communities yet</strong><p>Create one to connect your groups.</p></div>}</div>
    {creating && <div className="modal-backdrop"><form className="dialog" onSubmit={createCommunity}><header className="dialog-header"><h2>Create a community</h2><button type="button" className="icon-button" onClick={() => setCreating(false)} aria-label="Close"><Icon name="close" /></button></header><label className="field-label">Community name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Neighbourhood" maxLength="50" required /></label><label className="field-label">Description<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this community about?" maxLength="100" /></label><div className="dialog-footer"><button className="primary-button" type="submit" disabled={!name.trim()}>Create community</button></div></form></div>}
  </section>;
}

export function SettingsPage({ data, updateSettings, updateProfile, onLogout }) {
  const profileImage = useRef(null);
  const [profileDraft, setProfileDraft] = useState(data.profile);
  function updatePhoto(file) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2_000_000) { window.alert("Choose an image smaller than 2 MB."); return; }
    const reader = new FileReader();
    reader.onerror = () => window.alert("That profile photo could not be read.");
    reader.onload = () => { const photo = reader.result; setProfileDraft((current) => ({ ...current, photo })); updateProfile({ photo }); };
    reader.readAsDataURL(file);
  }
  return <section className="feature-page settings-page">
    <header className="feature-header"><div><h1>Settings</h1><p>Make WhatsApp feel like yours</p></div></header>
    <div className="settings-layout">
      <div className="settings-profile-card"><button className="profile-photo-edit" onClick={() => profileImage.current?.click()} aria-label="Change profile photo"><Avatar name={profileDraft.name} color="#178c70" photo={profileDraft.photo} size="large" /><span>✎</span></button><input ref={profileImage} type="file" hidden accept="image/*" onChange={(event) => { updatePhoto(event.target.files?.[0]); event.target.value = ""; }} /><h2>{data.profile.name}</h2><p>{data.profile.phone || "Your phone number"}</p><button className="secondary-button" onClick={onLogout}>Log out</button></div>
      <div className="settings-sections">
        <section className="settings-card"><div className="settings-section-heading"><span className="settings-icon">♙</span><div><h2>Profile</h2><p>Your name and about info</p></div></div>
          <label className="field-label">Name<input value={profileDraft.name} maxLength="35" onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))} onBlur={() => profileDraft.name.trim() && updateProfile({ name: profileDraft.name.trim() })} /></label>
          <label className="field-label">About<input value={profileDraft.about || ""} maxLength="140" onChange={(event) => setProfileDraft((current) => ({ ...current, about: event.target.value }))} onBlur={() => updateProfile({ about: profileDraft.about })} /></label>
        </section>
        <section className="settings-card"><div className="settings-section-heading"><span className="settings-icon">◉</span><div><h2>Privacy</h2><p>Choose who can see your information</p></div></div>
          <label className="setting-row"><span><strong>Last seen and online</strong><small>Who can see when you’re online</small></span><select value={data.settings.lastSeen} onChange={(event) => updateSettings({ lastSeen: event.target.value })}><option>Everyone</option><option>My contacts</option><option>Nobody</option></select></label>
          <label className="setting-row"><span><strong>Read receipts</strong><small>Show blue ticks when messages are read</small></span><input type="checkbox" checked={data.settings.readReceipts} onChange={(event) => updateSettings({ readReceipts: event.target.checked })} /></label>
          <label className="setting-row"><span><strong>Notifications</strong><small>Allow desktop notification alerts</small></span><input type="checkbox" checked={data.settings.notifications} onChange={(event) => updateSettings({ notifications: event.target.checked })} /></label>
        </section>
        <section className="settings-card"><div className="settings-section-heading"><span className="settings-icon">◐</span><div><h2>Appearance</h2><p>Personalize your chats</p></div></div>
          <label className="setting-row"><span><strong>Theme</strong><small>Choose your preferred appearance</small></span><select value={data.settings.theme} onChange={(event) => updateSettings({ theme: event.target.value })}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></label>
          <label className="setting-row"><span><strong>Chat wallpaper</strong><small>Set a background for your conversations</small></span><select value={data.settings.wallpaper} onChange={(event) => updateSettings({ wallpaper: event.target.value })}><option value="default">Classic</option><option value="mint">Mint</option><option value="lavender">Lavender</option><option value="sunset">Sunset</option></select></label>
          <label className="setting-row"><span><strong>Font size</strong><small>Adjust the size of chat messages</small></span><select value={data.settings.fontSize} onChange={(event) => updateSettings({ fontSize: event.target.value })}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>
        </section>
      </div>
    </div>
  </section>;
}

export function CallOverlay({ call, onEnd }) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  useEffect(() => { const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => window.clearInterval(timer); }, []);
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return <div className={`call-overlay ${call.kind === "video" ? "video-call" : ""}`} role="dialog" aria-modal="true" aria-label={`${call.kind} call with ${call.name}`}>
    {call.kind === "video" && <div className="video-placeholder"><span>{cameraOn ? "Camera preview" : "Camera off"}</span><div className="self-preview">You</div></div>}
    <div className="call-person"><Avatar name={call.name} color={call.color} size="call" /><h2>{call.name}</h2><p>{clock} · {muted ? "Muted" : call.kind === "video" ? "Video call" : "Voice call"}</p></div>
    <div className="call-controls"><button className={muted ? "control-on" : ""} onClick={() => setMuted((value) => !value)} aria-label={muted ? "Unmute microphone" : "Mute microphone"}><Icon name="mic" /><span>{muted ? "Unmute" : "Mute"}</span></button>{call.kind === "video" && <button className={!cameraOn ? "control-on" : ""} onClick={() => setCameraOn((value) => !value)} aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}><Icon name="video" /><span>Camera</span></button>}<button className="end-call" onClick={() => onEnd(seconds)} aria-label="End call">☎<span>End call</span></button></div>
  </div>;
}
