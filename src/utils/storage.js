import { createInitialData } from "../data/seed";

const STORAGE_KEY = "whatsapp-web-clone";

export function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createInitialData();
    const parsed = JSON.parse(saved);
    const initial = createInitialData();
    const merged = { ...initial, ...parsed };
    merged.settings = { ...initial.settings, ...parsed.settings };
    merged.contacts = parsed.contacts?.length ? parsed.contacts : initial.contacts;
    merged.chats = parsed.chats?.length ? parsed.chats : initial.chats;
    merged.statuses = (parsed.statuses || initial.statuses).filter(
      (status) => Date.now() - new Date(status.createdAt).getTime() < 24 * 60 * 60 * 1000,
    );
    return merged;
  } catch (error) {
    console.error("Could not load saved WhatsApp data.", error);
    return createInitialData();
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Could not save WhatsApp data.", error);
    throw error;
  }
}
