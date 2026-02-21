// js/ayush/stats.js — Ayush's workout statistics
import { api } from "../modules/api.js";
import { setActiveNav, loadNavUser } from "../modules/nav.js";

setActiveNav();
loadNavUser();

const COLORS = ["#4f46e5", "#0891b2", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0284c7", "#db2777"];

async function init() {
  const el = document.getElementById("statsContent");
  try {
    const s = await api.getWorkoutStats();
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-bottom:28px">
        ${statCard("🏋️", s.total, "Total Workouts")}
        ${statCard("⏱", s.avgDuration + " min", "Avg Duration")}
        ${statCard("💪", s.topMuscle, "Top Muscle")}
        ${statCard("📅", weeklyAvg(s.byWeek), "Workouts/Week")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="card">
          <p style="font-weight:700;font-size:13px;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px;margin-bottom:14px">By Muscle Group</p>
          ${barChart(s.byMuscle)}
        </div>
        <div class="card">
          <p style="font-weight:700;font-size:13px;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px;margin-bottom:14px">By Type</p>
          ${barChart(s.byType)}
        </div>
        <div class="card" style="grid-column:1/-1">
          <p style="font-weight:700;font-size:13px;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px;margin-bottom:14px">Weekly Frequency (last 12 weeks)</p>
          ${barChart(s.byWeek.map((w) => ({ _id: "Wk " + (w._id?.split("-")[1] || ""), count: w.count })))}
        </div>
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

function statCard(icon, val, label) {
  return `<div class="card" style="text-align:center">
    <div style="font-size:28px;margin-bottom:4px">${icon}</div>
    <div style="font-size:28px;font-weight:900;color:var(--accent)">${val}</div>
    <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px">${label}</div>
  </div>`;
}

function barChart(data) {
  if (!data?.length) return `<em style="color:var(--text-muted);font-size:13px">No data yet</em>`;
  const max = Math.max(...data.map((d) => d.count));
  return `<div class="bar-chart">${data.map((d, i) => {
    const pct = max ? Math.round((d.count / max) * 100) : 0;
    return `<div class="bar-row">
      <span class="bar-label">${d._id || "—"}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${COLORS[i % COLORS.length]}"></div></div>
      <span class="bar-count">${d.count}</span>
    </div>`;
  }).join("")}</div>`;
}

function weeklyAvg(byWeek) {
  if (!byWeek?.length) return "—";
  const avg = byWeek.reduce((s, w) => s + w.count, 0) / byWeek.length;
  return avg.toFixed(1);
}

init();
