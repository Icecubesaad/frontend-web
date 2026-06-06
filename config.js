// ============================================================================
// Backend target: repo-for-testing/full-stack-app/backend (FastAPI).
//
// Local dev:  start the FastAPI backend on its default port 8000:
//               cd ../full-stack-app/backend
//               uvicorn main:app --reload --port 8000
//             then serve THIS folder on port 3000 (the backend's default
//             CORS_ORIGINS) — e.g.:
//               cd ..
//               python -m http.server 3000
//             open http://localhost:3000 in your browser.
//
// Deployed:   set apiUrl to the public backend URL (e.g. the ALB DNS name
//             or the custom domain behind CloudFront), and set
//             CORS_ORIGINS on the backend to this site's URL.
// ============================================================================

const OVERRIDE = new URLSearchParams(window.location.search).get("api");

window.APP_CONFIG = {
  apiUrl: "http://opsynth-alb-43e91f2b312e-9296701.us-east-1.elb.amazonaws.com/",

  // Endpoints. These match the FastAPI backend at
  // repo-for-testing/full-stack-app/backend/main.py.
  healthEndpoint:          "/health",
  chatEndpoint:            "/chat",
  conversationsEndpoint:   "/conversations",
  deleteConversationEndpoint: "/conversations",
};
