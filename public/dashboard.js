const keyList = document.getElementById("key-list");
const historyList = document.getElementById("history-list");
const keyCount = document.getElementById("key-count");
const tabButtons = document.querySelectorAll(".tab-btn");
const views = document.querySelectorAll(".view");
const logoutBtn = document.getElementById("logout-btn");

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString();
}

function renderKeys(keys) {
  keyList.innerHTML = "";
  if (!keys.length) {
    keyList.innerHTML = '<div class="empty-state">No keys loaded yet.</div>';
    keyCount.textContent = "0 keys";
    return;
  }
  const usedCount = keys.filter((k) => k.copied).length;
  keyCount.textContent = `${keys.length} keys · ${usedCount} used`;
  keys.forEach((k) => {
    const row = document.createElement("div");
    row.className = "key-row" + (k.copied ? " copied" : "");
    row.innerHTML = `
      <div class="key-left">
        <div class="key-value">${k.key}</div>
      </div>
      <div style="display:flex;align-items:center;gap:16px;">
        <span class="key-status${k.copied ? " used" : ""}">${k.copied ? "Copied " + formatTime(k.copiedAt) : "Unused"}</span>
        <button class="copy-btn${k.copied ? " used-btn" : ""}" data-id="${k.id}" data-key="${k.key}">
          ${k.copied ? "Copy again" : "Click to copy"}
        </button>
      </div>
    `;
    keyList.appendChild(row);
  });

  keyList.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const value = btn.dataset.key;
      await navigator.clipboard.writeText(value);
      await fetch(`/api/keys/${id}/copy`, { method: "POST" });
      loadKeys();
    });
  });
}

function renderHistory(history) {
  historyList.innerHTML = "";
  if (!history.length) {
    historyList.innerHTML = '<div class="empty-state">No copy activity yet.</div>';
    return;
  }
  history.forEach((h) => {
    const row = document.createElement("div");
    row.className = "history-row";
    row.innerHTML = `
      <span class="history-key">${h.key}</span>
      <span class="history-time">${formatTime(h.copiedAt)}</span>
    `;
    historyList.appendChild(row);
  });
}

async function loadKeys() {
  const res = await fetch("/api/keys");
  const data = await res.json();
  renderKeys(data.keys);
}

async function loadHistory() {
  const res = await fetch("/api/history");
  const data = await res.json();
  renderHistory(data.history);
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    views.forEach((v) => v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.view).classList.add("active");
    if (btn.dataset.view === "history-view") {
      loadHistory();
    }
  });
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login.html";
});

loadKeys();
