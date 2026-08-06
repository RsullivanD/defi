// ---------- Stockage local (persiste sur le téléphone / navigateur de l'utilisateur) ----------
const STORAGE_KEY = "ptitpas_pending";
const HISTORY_KEY = "ptitpas_history";

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    /* stockage indisponible (ex: aperçu en bac à sable) : l'appli fonctionne quand même,
       simplement sans mémoire d'une session à l'autre */
  }
}

let pending = load(STORAGE_KEY);
let history = load(HISTORY_KEY);

// ---------- Éléments DOM ----------
const input = document.getElementById("challengeInput");
const addBtn = document.getElementById("addBtn");
const pendingList = document.getElementById("pendingList");
const emptyPending = document.getElementById("emptyPending");
const historyList = document.getElementById("historyList");
const historyToggle = document.getElementById("historyToggle");
const historyCount = document.getElementById("historyCount");

const shareSheet = document.getElementById("shareSheet");
const shareText = document.getElementById("shareText");
const closeShare = document.getElementById("closeShare");
const nativeShareBtn = document.getElementById("nativeShareBtn");
const waShare = document.getElementById("waShare");
const xShare = document.getElementById("xShare");
const copyShare = document.getElementById("copyShare");
const copyLabel = document.getElementById("copyLabel");

let currentShareItem = null;

// ---------- Ajouter un défi ----------
function addChallenge() {
  const text = input.value.trim();
  if (!text) return;
  pending.push({ id: Date.now().toString(), text });
  save(STORAGE_KEY, pending);
  input.value = "";
  input.focus();
  render();
}

addBtn.addEventListener("click", addChallenge);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addChallenge();
});

// ---------- Cocher un défi comme fait ----------
function markDone(id) {
  const idx = pending.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const [item] = pending.splice(idx, 1);
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  history.unshift({ ...item, date: dateStr });
  save(STORAGE_KEY, pending);
  save(HISTORY_KEY, history);
  render();
  openShare(item);
}

// ---------- Rendu ----------
function render() {
  pendingList.innerHTML = "";
  emptyPending.classList.toggle("hidden", pending.length > 0);

  pending.forEach((c) => {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <button class="check" aria-label="Marquer comme fait"></button>
      <span class="text"></span>
    `;
    li.querySelector(".text").textContent = c.text;
    li.querySelector(".check").addEventListener("click", () => markDone(c.id));
    pendingList.appendChild(li);
  });

  historyCount.textContent = `(${history.length})`;
  historyList.innerHTML = "";
  history.forEach((c) => {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <span class="check" style="border-color:var(--primary);background:var(--primary);color:white;">✓</span>
      <span class="text"></span>
      <button class="share-btn">↗</button>
    `;
    const textSpan = li.querySelector(".text");
    textSpan.textContent = c.text;
    const dateEl = document.createElement("span");
    dateEl.className = "date";
    dateEl.textContent = c.date;
    textSpan.appendChild(dateEl);
    li.querySelector(".share-btn").addEventListener("click", () => openShare(c));
    historyList.appendChild(li);
  });
}

historyToggle.addEventListener("click", () => {
  historyList.classList.toggle("hidden");
});

// ---------- Partage ----------
function openShare(item) {
  currentShareItem = item;
  const message = `J'ai relevé mon petit pas du jour : « ${item.text} » 🐾 sur 1 ptit pas... ou 2`;
  shareText.textContent = message;

  const encoded = encodeURIComponent(message);
  waShare.href = `https://wa.me/?text=${encoded}`;
  xShare.href = `https://twitter.com/intent/tweet?text=${encoded}`;

  nativeShareBtn.classList.toggle("hidden", !navigator.share);
  copyLabel.textContent = "Copier";
  shareSheet.classList.remove("hidden");
}

closeShare.addEventListener("click", () => shareSheet.classList.add("hidden"));
shareSheet.addEventListener("click", (e) => {
  if (e.target === shareSheet) shareSheet.classList.add("hidden");
});

nativeShareBtn.addEventListener("click", async () => {
  if (!currentShareItem) return;
  try {
    await navigator.share({ text: shareText.textContent });
    shareSheet.classList.add("hidden");
  } catch (e) {
    /* partage annulé */
  }
});

copyShare.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareText.textContent);
    copyLabel.textContent = "Copié !";
    setTimeout(() => (copyLabel.textContent = "Copier"), 1500);
  } catch (e) {}
});

// ---------- Enregistrer le service worker (nécessaire pour une vraie PWA installable) ----------
if ("serviceWorker" in navigator) {
  // Optionnel : ajoute un fichier sw.js si tu veux le mode hors-ligne complet.
  // navigator.serviceWorker.register("sw.js").catch(() => {});
}

render();
