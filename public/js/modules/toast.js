// js/modules/toast.js
export function showToast(message, type = "info") {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
