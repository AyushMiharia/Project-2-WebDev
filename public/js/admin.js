// js/admin.js — Admin dashboard: member management
import { api } from "./modules/api.js";

// Sign out
document.getElementById("adminLogout").addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
});

// ── Stats ─────────────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const s = await api.adminGetStats();

    // Update live count in header
    document.getElementById("liveCount").textContent = `${s.totalUsers.toLocaleString()} members total`;

    document.getElementById("statCards").innerHTML = `
      ${sc("👥", s.totalUsers.toLocaleString(), "Total Members")}
      ${sc("🏋️", s.totalWorkouts.toLocaleString(), "Total Workouts")}
      ${sc("🏟", s.byGym[0]?._id || "—", "Top Gym")}
      ${sc("🎯", s.byStyle[0]?._id || "—", "Top Style")}
    `;
  } catch (err) {
    document.getElementById("statCards").innerHTML = `<p style="color:red">Stats error: ${err.message}</p>`;
  }
}

function sc(icon, val, label) {
  return `<div class="stat-card">
    <div style="font-size:22px;margin-bottom:4px">${icon}</div>
    <div class="stat-val">${val}</div>
    <div class="stat-lbl">${label}</div>
  </div>`;
}

// ── Users table ───────────────────────────────────────────────────────────────
let currentPage = 1;

async function loadUsers(page = 1) {
  currentPage = page;
  const search = document.getElementById("uSearch").value.trim();
  const el = document.getElementById("usersTable");
  el.innerHTML = '<div class="loading">Loading members...</div>';

  try {
    const data = await api.adminGetUsers({ page, search });

    if (!data.users.length) {
      el.innerHTML = `<div class="empty-state"><div class="icon">👥</div><p>No members found.</p></div>`;
      document.getElementById("uPager").innerHTML = "";
      return;
    }

    el.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Member</th>
            <th>Email</th>
            <th>Gym</th>
            <th>Training Style</th>
            <th>Joined</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${data.users.map((u, i) => {
            const initials = u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const joined = u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : new Date(u.createdAt).toLocaleDateString();
            return `
              <tr>
                <td style="color:var(--text-muted)">${(page - 1) * 50 + i + 1}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar-initial">${initials}</div>
                    <strong>${u.name}</strong>
                  </div>
                </td>
                <td style="color:var(--text-muted)">${u.email}</td>
                <td>${u.gym || "—"}</td>
                <td>${u.trainingStyle ? `<span class="tag tag-purple">${u.trainingStyle}</span>` : "—"}</td>
                <td style="color:var(--text-muted)">${joined}</td>
                <td>
                  <button class="del-btn" data-id="${u._id}" data-name="${u.name}">🗑 Remove</button>
                </td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
      <p class="record-count">Showing ${(page - 1) * 50 + 1}–${Math.min(page * 50, data.total)} of ${data.total.toLocaleString()} members</p>
    `;

    // Bind delete buttons
    el.querySelectorAll(".del-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteUser(btn.dataset.id, btn.dataset.name));
    });

    renderPager(data.page, data.pages);
  } catch (err) {
    el.innerHTML = `<p style="color:red;padding:20px">Error: ${err.message}</p>`;
  }
}

async function deleteUser(id, name) {
  if (!confirm(`Remove "${name}" from FitSync?\n\nThis will also delete all their workouts and connections. This cannot be undone.`)) return;

  try {
    await api.adminDeleteUser(id);
    // Refresh table and stats
    loadUsers(currentPage);
    loadStats();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

function renderPager(current, total) {
  const el = document.getElementById("uPager");
  if (total <= 1) { el.innerHTML = ""; return; }

  let pages = "";
  // Show up to 5 page buttons around current
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);

  if (start > 1) pages += `<button class="btn btn-secondary btn-sm" onclick="gotoPage(1)">1</button>`;
  if (start > 2) pages += `<span style="padding:0 4px;color:var(--text-muted)">…</span>`;

  for (let p = start; p <= end; p++) {
    pages += `<button class="btn ${p === current ? "btn-primary" : "btn-secondary"} btn-sm" onclick="gotoPage(${p})">${p}</button>`;
  }

  if (end < total - 1) pages += `<span style="padding:0 4px;color:var(--text-muted)">…</span>`;
  if (end < total) pages += `<button class="btn btn-secondary btn-sm" onclick="gotoPage(${total})">${total}</button>`;

  el.innerHTML = `
    <button class="btn btn-secondary btn-sm" ${current <= 1 ? "disabled" : ""} onclick="gotoPage(${current - 1})">← Prev</button>
    ${pages}
    <button class="btn btn-secondary btn-sm" ${current >= total ? "disabled" : ""} onclick="gotoPage(${current + 1})">Next →</button>
    <span>Page ${current} of ${total}</span>
  `;
}

// Expose to onclick handlers
window.gotoPage = (p) => loadUsers(p);

// ── Search ────────────────────────────────────────────────────────────────────
document.getElementById("uSearchBtn").addEventListener("click", () => loadUsers(1));
document.getElementById("uClearBtn").addEventListener("click", () => {
  document.getElementById("uSearch").value = "";
  loadUsers(1);
});
document.getElementById("uSearch").addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadUsers(1);
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadStats();
loadUsers(1);
