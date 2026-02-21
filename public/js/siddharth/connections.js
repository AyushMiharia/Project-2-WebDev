// js/siddharth/connections.js — Siddharth's training partners & community
import { api } from "../modules/api.js";
import { showToast } from "../modules/toast.js";
import { openModal, closeModal } from "../modules/modal.js";
import { setActiveNav, loadNavUser } from "../modules/nav.js";
import { formatDate } from "../modules/dates.js";

setActiveNav();
loadNavUser();

async function init() {
  loadConnections();
  setupFilters();
  document.getElementById("newBtn").addEventListener("click", () => openAddModal());
}

function getFilters() {
  return {
    search: document.getElementById("fSearch").value,
    gym: document.getElementById("fGym").value,
    trainingStyle: document.getElementById("fStyle").value,
    howMet: document.getElementById("fHowMet").value,
  };
}

// ── Load & render connections ──────────────────────────────────────────────────

async function loadConnections(params = {}) {
  const el = document.getElementById("connectionsList");
  el.innerHTML = '<div class="loading">Loading...</div>';
  try {
    const conns = await api.getConnections(params);
    if (!conns.length) {
      el.innerHTML = `<div class="empty-state"><div class="icon">🤝</div>
        <p>No connections yet.</p>
        <p style="font-size:13px;margin-top:6px">Click <strong>+ Add Connection</strong> and enter a FitSync user's email address.</p>
      </div>`;
      return;
    }
    el.innerHTML = `<div class="connections-grid">${conns.map(renderCard).join("")}</div>`;
    el.querySelectorAll(".conn-card").forEach((c) => {
      c.addEventListener("click", (e) => { if (!e.target.closest("button")) viewConnection(c.dataset.id); });
    });
    el.querySelectorAll(".edit-conn").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); openEditModal(b.dataset.id); }));
    el.querySelectorAll(".del-conn").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); deleteConn(b.dataset.id); }));
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

function renderCard(c) {
  const initials = c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const styleColors = { Powerlifting: "tag-purple", Bodybuilding: "tag-blue", CrossFit: "tag-green", Calisthenics: "tag-orange", "General Fitness": "tag-green", "Olympic Lifting": "tag-purple" };
  return `
    <div class="conn-card" data-id="${c._id}">
      <div class="conn-avatar">${initials}</div>
      <div class="conn-name">${c.name}</div>
      <div class="conn-gym" style="font-size:12px;color:var(--text-muted);margin-bottom:4px">✉️ ${c.email}</div>
      <div class="conn-gym">📍 ${c.gym}</div>
      <div class="conn-tags">
        <span class="tag ${styleColors[c.trainingStyle] || "tag-blue"}">${c.trainingStyle}</span>
        ${c.howMet ? `<span class="tag tag-orange" style="font-size:11px">${c.howMet}</span>` : ""}
      </div>
      ${c.notes ? `<div class="conn-notes">💬 ${c.notes}</div>` : ""}
      <div class="card-actions" style="margin-top:10px;display:flex;gap:6px;justify-content:flex-end">
        <button class="btn btn-secondary btn-sm edit-conn" data-id="${c._id}">✏️ Edit</button>
        <button class="btn btn-danger btn-sm del-conn" data-id="${c._id}">🗑 Delete</button>
      </div>
    </div>`;
}

// ── View connection detail ─────────────────────────────────────────────────────

async function viewConnection(id) {
  try {
    const c = await api.getConnection(id);

    const workoutsHtml = (c.workouts || []).length
      ? c.workouts.map((w) => `
          <div class="shared-item">
            <span>🏋️ ${w.muscleGroup} (${w.type})</span>
            <span style="color:var(--text-muted)">${formatDate(w.date)}</span>
          </div>`).join("")
      : `<em style="color:var(--text-muted);font-size:13px">No shared workouts yet. Log a workout and tag them as a training partner!</em>`;

    openModal(`
      <div class="modal-header">
        <span class="modal-title">🤝 ${c.name}</span>
        <button class="close-btn" onclick="document.querySelector('.modal-overlay').remove()">✕</button>
      </div>

      <!-- User info -->
      <div style="background:var(--bg);border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:13px">
        <div style="margin-bottom:4px">✉️ <strong>${c.email}</strong></div>
        ${c.addedBy ? `<div style="color:var(--text-muted)">➕ Added by: <strong style="color:var(--text)">${c.addedBy.name}</strong> (${c.addedBy.email})</div>` : ""}
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <span class="tag tag-purple">${c.trainingStyle}</span>
        <span class="tag tag-blue">📍 ${c.gym}</span>
        ${c.howMet ? `<span class="tag tag-orange">Met: ${c.howMet}</span>` : ""}
      </div>

      ${c.notes ? `<p style="font-size:13px;color:var(--text-muted);margin-bottom:14px;font-style:italic">"${c.notes}"</p>` : ""}

      <p style="font-size:13px;font-weight:700;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px;margin-bottom:10px">
        Shared Workouts
      </p>
      <div class="shared-list">${workoutsHtml}</div>
    `);
  } catch (err) { showToast(err.message, "error"); }
}

// ── Add connection — 2-step: email lookup → confirm & fill details ─────────────

function openAddModal() {
  const modal = openModal(`
    <div class="modal-header">
      <span class="modal-title">➕ Add Connection</span>
      <button class="close-btn" onclick="document.querySelector('.modal-overlay').remove()">✕</button>
    </div>

    <!-- Step 1: Email lookup -->
    <div id="step1">
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
        Enter the email address of a FitSync user to add them as a training partner.
      </p>
      <div class="form-group">
        <label>Email Address *</label>
        <input type="email" id="lookupEmail" placeholder="e.g. alex@fitsync.app" autofocus />
      </div>
      <div id="lookupError" style="display:none;color:var(--danger);font-size:13px;margin-bottom:10px;padding:8px 12px;background:#fef2f2;border-radius:7px;border:1px solid #fecaca"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button type="button" class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">Cancel</button>
        <button type="button" class="btn btn-primary" id="lookupBtn">Look Up →</button>
      </div>
    </div>

    <!-- Step 2: Fill in details (shown after successful lookup) -->
    <div id="step2" style="display:none">
      <!-- User preview box -->
      <div id="userPreview" style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:18px;font-size:13px"></div>

      <form id="connForm">
        <input type="hidden" name="email" id="connEmail" />
        <div class="form-row">
          <div class="form-group">
            <label>Gym / Location *</label>
            <select name="gym" required>
              ${["Planet Fitness","LA Fitness","Gold's Gym","Equinox","24 Hour Fitness","YMCA","Home Gym","Other"]
                .map((g) => `<option>${g}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Training Style *</label>
            <select name="trainingStyle" required>
              ${["Powerlifting","Bodybuilding","CrossFit","Calisthenics","General Fitness","Olympic Lifting"]
                .map((s) => `<option>${s}</option>`).join("")}
            </select>
          </div>
          <div class="form-group form-full">
            <label>How You Met</label>
            <select name="howMet">
              ${["","At the gym","Through a friend","University rec center","Online community","Sports team","Personal trainer"]
                .map((h) => `<option>${h}</option>`).join("")}
            </select>
          </div>
          <div class="form-group form-full">
            <label>Notes</label>
            <textarea name="notes" rows="2" placeholder="What do you train together? Any highlights?"></textarea>
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button type="button" class="btn btn-secondary" id="backBtn">← Back</button>
          <button type="submit" class="btn btn-primary">Add Connection ✓</button>
        </div>
      </form>
    </div>
  `);

  // Step 1 — lookup
  const lookupBtn = modal.querySelector("#lookupBtn");
  const lookupEmail = modal.querySelector("#lookupEmail");
  const lookupError = modal.querySelector("#lookupError");

  // Allow pressing Enter in email field
  lookupEmail.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); lookupBtn.click(); } });

  lookupBtn.addEventListener("click", async () => {
    const email = lookupEmail.value.trim();
    lookupError.style.display = "none";
    if (!email) { lookupError.textContent = "Please enter an email address."; lookupError.style.display = "block"; return; }

    lookupBtn.textContent = "Looking up...";
    lookupBtn.disabled = true;

    try {
      const user = await api.lookupUserByEmail(email);

      // Show user preview
      modal.querySelector("#userPreview").innerHTML = `
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;flex-shrink:0">
            ${user.name.split(" ").map((n) => n[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <div>
            <div style="font-weight:700;font-size:15px">${user.name}</div>
            <div style="color:var(--text-muted)">✉️ ${user.email}</div>
            ${user.gym ? `<div style="color:var(--text-muted)">📍 ${user.gym}</div>` : ""}
          </div>
          <span class="tag tag-green" style="margin-left:auto">✓ Found</span>
        </div>
      `;

      // Pre-select gym/style from user's profile if available
      if (user.gym) {
        const gymSelect = modal.querySelector("select[name=gym]");
        [...gymSelect.options].forEach((o) => { if (o.value === user.gym) o.selected = true; });
      }
      if (user.trainingStyle) {
        const styleSelect = modal.querySelector("select[name=trainingStyle]");
        [...styleSelect.options].forEach((o) => { if (o.value === user.trainingStyle) o.selected = true; });
      }

      // Set hidden email field
      modal.querySelector("#connEmail").value = user.email;

      // Switch to step 2
      modal.querySelector("#step1").style.display = "none";
      modal.querySelector("#step2").style.display = "block";

    } catch (err) {
      lookupError.textContent = err.message;
      lookupError.style.display = "block";
    } finally {
      lookupBtn.textContent = "Look Up →";
      lookupBtn.disabled = false;
    }
  });

  // Back button
  modal.querySelector("#backBtn").addEventListener("click", () => {
    modal.querySelector("#step2").style.display = "none";
    modal.querySelector("#step1").style.display = "block";
  });

  // Step 2 — submit
  modal.querySelector("#connForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const body = {
      email: modal.querySelector("#connEmail").value,
      gym: f.gym.value,
      trainingStyle: f.trainingStyle.value,
      howMet: f.howMet.value,
      notes: f.notes.value,
    };
    try {
      await api.createConnection(body);
      showToast("Connection added! 🤝", "success");
      closeModal();
      loadConnections(getFilters());
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

// ── Edit connection (only gym, style, howMet, notes — name/email are fixed) ────

async function openEditModal(id) {
  let c;
  try { c = await api.getConnection(id); } catch { showToast("Could not load", "error"); return; }

  const modal = openModal(`
    <div class="modal-header">
      <span class="modal-title">✏️ Edit Connection</span>
      <button class="close-btn" onclick="document.querySelector('.modal-overlay').remove()">✕</button>
    </div>

    <!-- Fixed user info (can't change) -->
    <div style="background:var(--bg);border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:13px;color:var(--text-muted)">
      <strong style="color:var(--text)">${c.name}</strong> · ${c.email}
      <span style="font-size:11px;margin-left:6px">(name & email are fixed)</span>
    </div>

    <form id="editForm">
      <div class="form-row">
        <div class="form-group">
          <label>Gym / Location *</label>
          <select name="gym" required>
            ${["Planet Fitness","LA Fitness","Gold's Gym","Equinox","24 Hour Fitness","YMCA","Home Gym","Other"]
              .map((g) => `<option ${c.gym === g ? "selected" : ""}>${g}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label>Training Style *</label>
          <select name="trainingStyle" required>
            ${["Powerlifting","Bodybuilding","CrossFit","Calisthenics","General Fitness","Olympic Lifting"]
              .map((s) => `<option ${c.trainingStyle === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <div class="form-group form-full">
          <label>How You Met</label>
          <select name="howMet">
            ${["","At the gym","Through a friend","University rec center","Online community","Sports team","Personal trainer"]
              .map((h) => `<option ${c.howMet === h ? "selected" : ""}>${h}</option>`).join("")}
          </select>
        </div>
        <div class="form-group form-full">
          <label>Notes</label>
          <textarea name="notes" rows="3">${c.notes || ""}</textarea>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button type="button" class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>
  `);

  modal.querySelector("#editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      await api.updateConnection(id, { gym: f.gym.value, trainingStyle: f.trainingStyle.value, howMet: f.howMet.value, notes: f.notes.value });
      showToast("Connection updated!", "success");
      closeModal();
      loadConnections(getFilters());
    } catch (err) { showToast(err.message, "error"); }
  });
}

// ── Delete ─────────────────────────────────────────────────────────────────────

async function deleteConn(id) {
  if (!confirm("Remove this connection?")) return;
  try { await api.deleteConnection(id); showToast("Connection removed", "info"); loadConnections(getFilters()); }
  catch (err) { showToast(err.message, "error"); }
}

// ── Filters ────────────────────────────────────────────────────────────────────

function setupFilters() {
  let timer;
  ["fSearch", "fGym", "fStyle", "fHowMet"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => {
      clearTimeout(timer); timer = setTimeout(() => loadConnections(getFilters()), 300);
    });
  });
  document.getElementById("clearBtn").addEventListener("click", () => {
    ["fSearch", "fGym", "fStyle", "fHowMet"].forEach((id) => document.getElementById(id).value = "");
    loadConnections();
  });
}

init();
