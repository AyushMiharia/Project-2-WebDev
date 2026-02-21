// js/modules/nav.js
export function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll(".nav-links a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === path);
  });
}

export async function loadNavUser() {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return;
    const data = await res.json();
    const el = document.getElementById("navUser");
    if (el) el.textContent = data.name;
    const btn = document.getElementById("logoutBtn");
    if (btn) btn.addEventListener("click", async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    });
  } catch { /* ignore */ }
}
