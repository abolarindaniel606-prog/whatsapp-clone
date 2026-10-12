import Avatar from "./Avatar";
import Icon from "./Icon";

const navItems = [
  { id: "chats", label: "Chats", icon: "chats" },
  { id: "status", label: "Status", icon: "status" },
  { id: "calls", label: "Calls", icon: "calls" },
  { id: "communities", label: "Communities", icon: "communities" },
];

export default function Sidebar({ activeTab, setActiveTab, profile, onLogout }) {
  return (
    <aside className="app-rail" aria-label="Main navigation">
      <div className="rail-top">
        <button className="rail-logo" aria-label="WhatsApp home" onClick={() => setActiveTab("chats")}>w</button>
        <div className="rail-divider" />
        {navItems.map((item) => (
          <button key={item.id} className={`rail-button ${activeTab === item.id ? "selected" : ""}`} onClick={() => setActiveTab(item.id)} aria-label={item.label} title={item.label}>
            <Icon name={item.icon} size={21} />
            {item.id === "chats" && <span className="rail-unread">3</span>}
          </button>
        ))}
      </div>
      <div className="rail-bottom">
        <button className={`rail-button ${activeTab === "settings" ? "selected" : ""}`} onClick={() => setActiveTab("settings")} aria-label="Settings" title="Settings"><Icon name="settings" /></button>
        <button className="profile-button" onClick={() => setActiveTab("settings")} aria-label="Open profile settings" title={profile.name}><Avatar name={profile.name} color="#31a584" photo={profile.photo} size="small" /></button>
        <button className="rail-logout" onClick={onLogout} aria-label="Log out" title="Log out">↪</button>
      </div>
    </aside>
  );
}
