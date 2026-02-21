// js/ayush/workouts.js — Ayush's workout management
import { api } from "../modules/api.js";
import { showToast } from "../modules/toast.js";
import { openModal, closeModal } from "../modules/modal.js";
import { setActiveNav, loadNavUser } from "../modules/nav.js";
import { formatDate, toInputDate } from "../modules/dates.js";

setActiveNav();
loadNavUser();

const COLORS = { Chest: "#4f46e5", Back: "#0891b2", Legs: "#16a34a", Shoulders: "#d97706", Arms: "#dc2626", Core: "#7c3aed", "Full Body": "#0284c7", Cardio: "#db2777" };
let allConnections = [];

async function init() {
  allConnections = await api.getConnections().catch(() => []);
  loadWorkouts();
  setupFilters();
  document.getElementById("newBtn").addEventListener("click", () => openForm());
}

function getFilters() {
  return {
    search: document.getElementById("fSearch").value,
    muscleGroup: document.getElementById("fMuscle").value,
    type: document.getElementById("fType").value,
    dateFrom: document.getElementById("fFrom").value,
    dateTo: document.getElementById("fTo").value,
    duration: document.getElementById("fDuration").value,
  };
}

async function loadWorkouts(params = {}) {
  const el = document.getElementById("workoutsList");
  el.innerHTML = '<div class="loading">Loading...</div>';
  try {
    const workouts = await api.getWorkouts(params);
    if (!workouts.length) {
      el.innerHTML = `<div class="empty-state"><div class="icon">🏋️</div><p>No workouts found. Log your first session!</p></div>`;
      return;
    }
    el.innerHTML = `<div class="workouts-grid">${workouts.map(renderCard).join("")}</div>`;
    el.querySelectorAll(".workout-card").forEach((c) => {
      c.addEventListener("click", (e) => { if (!e.target.closest("button")) viewWorkout(c.dataset.id); });
    });
    el.querySelectorAll(".edit-btn").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); openForm(b.dataset.id); }));
    el.querySelectorAll(".del-btn").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); deleteWorkout(b.dataset.id); }));
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

function renderCard(w) {
  const color = COLORS[w.muscleGroup] || "#4f46e5";
  const partners = (w.trainingPartners || []).slice(0, 3);
  const exNames = (w.exercises || []).slice(0, 3).map((e) => e.name).join(", ");
  const isShared = !w.isOwner && w.sharedBy;
  return `
    <div class="workout-card" data-id="${w._id}">
      <div class="workout-card-top">
        <span class="workout-date">${formatDate(w.date)}</span>
        <span class="tag tag-blue">${w.type}</span>
      </div>
      ${isShared ? `<div style="font-size:11px;color:#7c3aed;font-weight:700;margin-bottom:4px">📤 Shared by ${w.sharedBy.name}</div>` : ""}
      <div class="workout-muscle" style="color:${color}">${w.muscleGroup}</div>
      <div class="workout-tags">
        <span class="tag tag-purple">⏱ ${w.duration} min</span>
        ${w.exercises?.length ? `<span class="tag tag-green">${w.exercises.length} exercises</span>` : ""}
        ${isShared ? `<span class="tag" style="background:#f5f3ff;color:#7c3aed">👥 Shared</span>` : ""}
      </div>
      ${exNames ? `<div class="workout-exercises">📌 ${exNames}${w.exercises?.length > 3 ? "…" : ""}</div>` : ""}
      ${partners.length ? `<div class="workout-partners">${partners.map((p) => `<span class="partner-chip">🤝 ${p.name || "Partner"}</span>`).join("")}</div>` : ""}
      ${w.notes ? `<div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-style:italic">"${w.notes.slice(0, 70)}${w.notes.length > 70 ? "…" : ""}"</div>` : ""}
      <div class="card-actions">
        <button class="btn btn-secondary btn-sm edit-btn" data-id="${w._id}">✏️ Edit</button>
        <button class="btn btn-danger btn-sm del-btn" data-id="${w._id}">🗑 Delete</button>
        ${isShared ? `<span style="font-size:11px;color:var(--text-muted)">by ${w.sharedBy?.name}</span>` : ""}
      </div>
    </div>`;
}

async function viewWorkout(id) {
  try {
    const w = await api.getWorkout(id);
    const exHtml = (w.exercises || []).map((e) =>
      `<div style="background:var(--bg);border-radius:7px;padding:8px 12px;margin-bottom:5px;display:flex;gap:12px;font-size:13px;align-items:center">
        <strong style="flex:2">${e.name}</strong>
        <span style="color:var(--text-muted)">${e.sets}×${e.reps} @ ${e.weight}lbs</span>
      </div>`
    ).join("") || "<em style='color:var(--text-muted)'>No exercises logged</em>";
    const partners = (w.trainingPartners || []).map((p) => `<span class="partner-chip">🤝 ${p.name}</span>`).join(" ") || "<em>None</em>";
    openModal(`
      <div class="modal-header">
        <span class="modal-title">${w.muscleGroup} – ${formatDate(w.date)}</span>
        <button class="close-btn" onclick="document.querySelector('.modal-overlay').remove()">✕</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <span class="tag tag-blue">${w.type}</span>
        <span class="tag tag-purple">⏱ ${w.duration} min</span>
      </div>
      <p style="font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px">Exercises</p>
      ${exHtml}
      <p style="font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin:14px 0 8px">Training Partners</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${partners}</div>
      ${w.notes ? `<p style="font-size:13px;color:var(--text-muted);margin-top:12px;font-style:italic">"${w.notes}"</p>` : ""}
    `);
  } catch (err) { showToast(err.message, "error"); }
}

async function openForm(id = null) {
  let w = null;
  if (id) { try { w = await api.getWorkout(id); } catch { showToast("Could not load workout", "error"); return; } }

  const isOwner = !id || w?.isOwner;

  const partnersHtml = allConnections.length
    ? allConnections.map((c) => {
        const checked = w?.trainingPartners?.some((p) => (p._id || p).toString() === c._id.toString()) ? "checked" : "";
        return `<label class="partner-check-item"><input type="checkbox" value="${c._id}" ${checked} />${c.name}</label>`;
      }).join("")
    : `<em style="font-size:13px;color:var(--text-muted)">No connections yet. Add some on the Connections page first.</em>`;

  // For non-owners, show who's tagged but don't allow changing it
  const currentPartners = (w?.trainingPartners || []).map((p) => `<span class="partner-chip">🤝 ${p.name || "Partner"}</span>`).join(" ") || "<em style='color:var(--text-muted)'>None</em>";

  const exRows = (w?.exercises || []).map((e) => exRowHtml(e.name, e.sets, e.reps, e.weight)).join("");

  const modal = openModal(`
    <div class="modal-header">
      <span class="modal-title">${id ? "Edit Workout" : "New Workout"}</span>
      <button class="close-btn" onclick="document.querySelector('.modal-overlay').remove()">✕</button>
    </div>
    ${!isOwner ? `<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:9px 12px;margin-bottom:14px;font-size:13px;color:#6d28d9">✏️ You are editing a shared workout. You can change exercises and notes, but not who's tagged.</div>` : ""}
    <form id="wForm">
      <div class="form-row">
        <div class="form-group"><label>Date *</label><input type="date" name="date" required value="${w ? toInputDate(w.date) : new Date().toISOString().split("T")[0]}" /></div>
        <div class="form-group"><label>Duration (min) *</label><input type="number" name="duration" min="1" max="300" required value="${w?.duration || ""}" placeholder="60" /></div>
        <div class="form-group"><label>Muscle Group *</label>
          <select name="muscleGroup" required>
            ${["Chest","Back","Legs","Shoulders","Arms","Core","Full Body","Cardio"].map((m) => `<option ${w?.muscleGroup === m ? "selected" : ""}>${m}</option>`).join("")}
          </select>
        </div>
        <div class="form-group"><label>Type *</label>
          <select name="type" required>
            ${["Strength","Cardio","Flexibility","HIIT","Powerlifting"].map((t) => `<option ${w?.type === t ? "selected" : ""}>${t}</option>`).join("")}
          </select>
        </div>
        <div class="form-group form-full"><label>Notes</label><textarea name="notes" rows="2" placeholder="How did it feel?">${w?.notes || ""}</textarea></div>
      </div>
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <label style="margin:0">Exercises</label>
          <button type="button" class="btn btn-secondary btn-sm" id="addExBtn">+ Add</button>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">Name / Sets / Reps / Weight(lbs)</div>
        <div id="exList">${exRows}</div>
      </div>
      <div style="margin-bottom:16px">
        <label style="margin-bottom:8px">Training Partners</label>
        ${isOwner
          ? `<div class="partner-check-grid">${partnersHtml}</div>`
          : `<div style="display:flex;gap:6px;flex-wrap:wrap;padding:10px;background:var(--bg);border-radius:8px">${currentPartners}</div>`
        }
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button type="button" class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">Cancel</button>
        <button type="submit" class="btn btn-primary">${id ? "Save Changes" : "Log Workout"}</button>
      </div>
    </form>
  `);

  modal.querySelector("#addExBtn").addEventListener("click", () => {
    modal.querySelector("#exList").insertAdjacentHTML("beforeend", exRowHtml());
    bindRemove(modal);
  });
  bindRemove(modal);

  modal.querySelector("#wForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const exercises = [...modal.querySelectorAll(".ex-row")].map((r) => ({
      name: r.querySelector(".ex-name").value,
      sets: Number(r.querySelector(".ex-sets").value),
      reps: Number(r.querySelector(".ex-reps").value),
      weight: Number(r.querySelector(".ex-weight").value),
    })).filter((ex) => ex.name);

    const body = { date: f.date.value, muscleGroup: f.muscleGroup.value, type: f.type.value, duration: f.duration.value, notes: f.notes.value, exercises };

    // Only include trainingPartners if owner — partners can't change who's tagged
    if (isOwner) {
      body.trainingPartners = [...modal.querySelectorAll(".partner-check-grid input:checked")].map((c) => c.value);
    }

    try {
      if (id) { await api.updateWorkout(id, body); showToast("Workout updated!", "success"); }
      else { await api.createWorkout(body); showToast("Workout logged! 💪", "success"); }
      closeModal();
      loadWorkouts(getFilters());
    } catch (err) { showToast(err.message, "error"); }
  });
}

function exRowHtml(name = "", sets = "", reps = "", weight = "") {
  return `<div class="exercise-row ex-row">
    <input class="ex-name" placeholder="Exercise name" value="${name}" />
    <input class="ex-sets" type="number" placeholder="Sets" min="1" value="${sets}" />
    <input class="ex-reps" type="number" placeholder="Reps" min="1" value="${reps}" />
    <input class="ex-weight" type="number" placeholder="lbs" min="0" value="${weight}" />
    <button type="button" class="remove-ex">×</button>
  </div>`;
}

function bindRemove(modal) {
  modal.querySelectorAll(".remove-ex").forEach((btn) => {
    btn.onclick = () => btn.closest(".ex-row").remove();
  });
}

async function deleteWorkout(id) {
  if (!confirm("Delete this workout?")) return;
  try { await api.deleteWorkout(id); showToast("Deleted", "info"); loadWorkouts(getFilters()); }
  catch (err) { showToast(err.message, "error"); }
}

function setupFilters() {
  let timer;
  ["fSearch", "fMuscle", "fType", "fFrom", "fTo", "fDuration"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => {
      clearTimeout(timer); timer = setTimeout(() => loadWorkouts(getFilters()), 300);
    });
  });
  document.getElementById("clearBtn").addEventListener("click", () => {
    ["fSearch", "fMuscle", "fType", "fFrom", "fTo", "fDuration"].forEach((id) => document.getElementById(id).value = "");
    loadWorkouts();
  });
}

init();
