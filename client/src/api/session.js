const KEY = "apsara_session_id";

export function getSessionId() {
  return localStorage.getItem(KEY) || "";
}

export function setSessionId(id) {
  if (id) localStorage.setItem(KEY, id);
}
