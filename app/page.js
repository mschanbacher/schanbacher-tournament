'use client'
// The // vN deployment hack is no longer needed — App.jsx has been split into
// separate component files, so Next.js properly detects changes to any of them.
import App from '../components/App'

export default function Page() {
  return <App />
}
