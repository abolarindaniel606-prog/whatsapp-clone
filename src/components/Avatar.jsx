export default function Avatar({ name, color = "#8a9aa2", size = "normal", photo, icon, online = false }) {
  return (
    <div className={`avatar avatar-${size}`} style={{ backgroundColor: photo ? "transparent" : color }} aria-label={name}>
      {photo ? <img src={photo} alt="" /> : <span>{icon || name?.trim()?.charAt(0)?.toUpperCase() || "?"}</span>}
      {online && <i className="online-dot" />}
    </div>
  );
}
