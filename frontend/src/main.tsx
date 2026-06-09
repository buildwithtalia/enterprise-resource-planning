import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'

// Initialize Sentry as early as possible so even render-time exceptions and
// stray async errors get captured. The DSN is the same project as the backend;
// distinguish source via the `environment` tag.
Sentry.init({
  dsn:
    import.meta.env.VITE_SENTRY_DSN ||
    'https://8e235c3ee781e56cd87e8b39357a21ec@o4511536666116096.ingest.us.sentry.io/4511536671883264',
  environment: import.meta.env.MODE || 'development',
  tracesSampleRate: 1.0,
  // sendDefaultPii: false is the default; keep PII out of breadcrumbs.
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
