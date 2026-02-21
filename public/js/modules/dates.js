// js/modules/dates.js
export function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function toInputDate(d) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}
