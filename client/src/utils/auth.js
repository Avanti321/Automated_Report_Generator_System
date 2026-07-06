export function getUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    // JWT payload is the middle part, base64 encoded
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload; // { id, role }
  } catch {
    return null;
  }
}

export function getRole() {
  return getUser()?.role || null;
}

// Returns an Axios-ready headers object carrying the current JWT, e.g.
// axios.get(url, { headers: authHeader() })
export function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}