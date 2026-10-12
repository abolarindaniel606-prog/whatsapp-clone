import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../hooks/useApp";

export default function AuthPage({ mode = "login" }) {
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { signIn, signUp } = useApp();
  const navigate = useNavigate();

  function submit(event) {
    event.preventDefault();
    setError("");
    const normalizedPhone = phone.trim().replace(/[^\d+]/g, "");
    if (!/^\+?\d{8,15}$/.test(normalizedPhone)) {
      setError("Enter a valid phone number (8–15 digits).");
      return;
    }
    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }
    if (isSignup && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setBusy(true);
    try {
      const credentials = { name: name.trim(), phone: normalizedPhone, password };
      if (isSignup) signUp(credentials);
      else signIn(credentials);
      navigate("/app", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-green" />
      <section className="auth-card">
        <div className="brand-mark">w</div>
        <p className="eyebrow">WHATSAPP WEB</p>
        <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-subtitle">{isSignup ? "Connect with the people who matter." : "Sign in to pick up right where you left off."}</p>
        <form onSubmit={submit}>
          {isSignup && <label>Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Danny Gold" required /></label>}
          <label>Phone number<input inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+234 800 000 0000" required /></label>
          <label>Password<input type="password" autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button auth-submit" disabled={busy}>{busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}</button>
        </form>
        <p className="auth-switch">{isSignup ? "Already have an account?" : "New to WhatsApp?"} <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Create an account"}</Link></p>
        <p className="auth-footnote">Your messages are saved securely on this device.</p>
      </section>
    </main>
  );
}
