// js/siddharth/network.js — Siddharth's networking statistics
import { api } from "../modules/api.js";
import { setActiveNav, loadNavUser } from "../modules/nav.js";

setActiveNav();
loadNavUser();

const COLORS = ["#7c3aed", "#4f46e5", "#0891b2", "#16a34a", "#d97706", "#dc2626"];

async function init() {
  const el = document.getElementById("networkContent");
  try {
    const s = await api.getConnectionStats();
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-bottom:28px">
        ${statCard("🤝", s.total, "Total Partners")}
        ${statCard("🏟", s.byGym[0]?._id || "—", "Top Gym")}
        ${statCard("🎯", s.byStyle[0]?._id || "—", "Top Style")}
        ${statCard("🌐", s.byGym.length, "Gyms Represented")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="card">
          <p style="font-weight:700;font-size:13px;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px;margin-bottom:14px">Partners per Gym</p>
          ${barChart(s.byGym, "#7c3aed")}
        </div>
        <div class="card">
          <p style="font-weight:700;font-size:13px;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px;margin-bottom:14px">Partners by Training Style</p>
          ${barChart(s.byStyle, "#4f46e5")}
        </div>
        <div class="card" style="grid-column:1/-1">
          <p style="font-weight:700;font-size:13px;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px;margin-bottom:14px">How You Met</p>
          ${barChart(s.byHowMet, "#0891b2")}
        </div>
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

function statCard(icon, val, label) {
  return `<div class="card" style="text-align:center">
    <div style="font-size:28px;margin-bottom:4px">${icon}</div>
    <div style="font-size:26px;font-weight:900;color:#7c3aed">${val}</div>
    <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px">${label}</div>
  </div>`;
}

function barChart(data, baseColor = "#4f46e5") {
  if (!data?.length) return `<em style="color:var(--text-muted);font-size:13px">No data yet. Add some connections first!</em>`;
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

init();
