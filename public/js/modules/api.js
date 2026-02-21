// js/modules/api.js
const BASE = "/api";

async function req(method, url, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + url, opts);
  const data = await res.json();
  if (res.status === 401) { window.location.href = "/login"; return; }
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // Auth
  login: (body) => req("POST", "/auth/login", body),
  signup: (body) => req("POST", "/auth/signup", body),
  logout: () => req("POST", "/auth/logout"),
  me: () => req("GET", "/auth/me"),
  adminLogin: (password) => req("POST", "/auth/admin-login", { password }),

  // Workouts (Ayush)
  getWorkouts: (p = {}) => req("GET", `/workouts?${new URLSearchParams(p)}`),
  getWorkout: (id) => req("GET", `/workouts/${id}`),
  getWorkoutStats: () => req("GET", "/workouts/stats"),
  createWorkout: (b) => req("POST", "/workouts", b),
  updateWorkout: (id, b) => req("PUT", `/workouts/${id}`, b),
  deleteWorkout: (id) => req("DELETE", `/workouts/${id}`),

  // Connections (Siddharth)
  getConnections: (p = {}) => req("GET", `/connections?${new URLSearchParams(p)}`),
  getConnection: (id) => req("GET", `/connections/${id}`),
  getConnectionStats: () => req("GET", "/connections/stats"),
  lookupUserByEmail: (email) => req("GET", `/connections/lookup?email=${encodeURIComponent(email)}`),
  createConnection: (b) => req("POST", "/connections", b),
  updateConnection: (id, b) => req("PUT", `/connections/${id}`, b),
  deleteConnection: (id) => req("DELETE", `/connections/${id}`),

  // Admin
  adminGetStats: () => req("GET", "/admin/stats"),
  adminGetUsers: (p = {}) => req("GET", `/admin/users?${new URLSearchParams(p)}`),
  adminDeleteUser: (id) => req("DELETE", `/admin/users/${id}`),
};
