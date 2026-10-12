# WhatsApp Web Clone

A responsive, local-first WhatsApp Web-inspired messaging app built with React, Vite, React Router, and plain CSS. No backend is required; app data is saved in the browser's local storage.

## Run locally

```sh
npm install
npm run dev
```

Use `npm run build` to create a production build, `npm run preview` to serve it locally, and `npm run lint` to run Oxlint.

## Sign in

Create an account at `/signup` with a name, phone number, and password of at least six characters. Accounts and their passwords are stored on this device in local storage, so use this demo only with non-sensitive test credentials. Sign out from the navigation rail or Settings.

## Project structure

- `src/components/` — navigation, avatar, and shared icon components
- `src/context/` — shared app data, auth session, and settings state
- `src/data/` — sample contacts, chats, calls, statuses, and communities
- `src/hooks/` — shared access to app context
- `src/pages/` — auth, chat, status, call, community, and settings screens
- `src/utils/storage.js` — local persistence boundary; replace this adapter to connect a database
- `src/app.css` and `src/index.css` — responsive app and global styles

## Included interactions

- Seeded sample conversations, unread counts, pinned/muted/archived filters, contact picker, and group creation
- Text, emoji, image and file sharing with previews, browser voice recording, reply/edit/forward/copy/star/delete actions, and simulated replies
- Status stories with 24-hour expiry, call history with simulated voice/video call controls, community/channel management, and profile/privacy/appearance settings
- Responsive mobile navigation and chat back navigation; Enter sends and Shift+Enter inserts a line break

All data stays in this browser's local storage. Media attachments are stored as data URLs and large files over 5 MB are rejected.
