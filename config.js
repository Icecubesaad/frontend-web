// Edit this to point at your backend.
// For the express-clone in this same repo: http://localhost:8000
// For the FastAPI full-stack-app: http://localhost:8000
// For a deployed env: set this to the deployed URL, e.g. https://api.example.com
window.APP_CONFIG = {
  apiUrl: "http://localhost:8000",
  // The endpoint to call for chat. The original used /chat (non-streaming) and /chat/stream (SSE).
  // We use /chat for simplicity (no WebSocket, no streaming).
  chatEndpoint: "/chat",
  // Optional: list conversations via GET /conversations
  conversationsEndpoint: "/conversations",
  // Optional: delete a conversation via DELETE /conversations/{id}
  deleteConversationEndpoint: "/conversations",
};
