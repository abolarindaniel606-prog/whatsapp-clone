import { useCallback, useEffect, useMemo, useState } from "react";
import { loadData, saveData } from "../utils/storage";
import { AppContext } from "./contextStore";

export function AppProvider({ children }) {
  const [data, setData] = useState(loadData);

  useEffect(() => {
    try {
      saveData(data);
    } catch (error) {
      console.error("WhatsApp data could not be persisted. Check available browser storage.", error);
    }
  }, [data]);

  const updateData = useCallback((updater) => setData((current) => typeof updater === "function" ? updater(current) : updater), []);
  const updateSettings = useCallback((settings) => setData((current) => ({ ...current, settings: { ...current.settings, ...settings } })), []);
  const updateProfile = useCallback((profile) => setData((current) => ({ ...current, profile: { ...current.profile, ...profile } })), []);
  const signIn = useCallback((user) => {
      const found = data.users.find((item) => item.phone === user.phone);
      if (!found) throw new Error("No account was found with that phone number.");
      if (found.password !== user.password) throw new Error("That password doesn't match. Please try again.");
      setData((current) => ({ ...current, session: { id: found.id }, profile: { ...current.profile, name: found.name, phone: found.phone } }));
    }, [data.users]);
  const signUp = useCallback((user) => {
      if (data.users.some((item) => item.phone === user.phone)) throw new Error("An account with this phone number already exists.");
      const created = { ...user, id: `user-${Date.now()}` };
      setData((current) => ({ ...current, users: [...current.users, created], session: { id: created.id }, profile: { ...current.profile, name: created.name, phone: created.phone } }));
    }, [data.users]);
  const signOut = useCallback(() => setData((current) => ({ ...current, session: null })), []);
  const value = useMemo(() => ({ data, updateData, updateSettings, updateProfile, signIn, signUp, signOut }), [data, updateData, updateSettings, updateProfile, signIn, signUp, signOut]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
