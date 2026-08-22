const API_BASE = "http://localhost:5000/api";
const ENDPOINT = `${API_BASE}/grievances`;

let cases = [];
let activeStatus = "all";
let activeCategory = "all";
let sortMode = "newest";
let searchTerm = "";

const caseListEl = document.getElementById("caseList");
const emptyStateEl = document.getElementById("emptyState");
const errorStateEl = document.getElementById("errorState");
const errorDetailEl = document.getElementById("errorDetail");
const caseCountEl = document.getElementById("caseCount");
const statusTabsEl = document.getElementById("statusTabs");
const cardTemplate = document.getElementById("cardTemplate");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");
const priorityRank = { High: 3, Medium: 2, Low: 1 };

const overlay = document.getElementById("overlay");
const drawer = document.getElementById("caseDrawer");
const newCaseBtn = document.getElementById("newCaseBtn");
const newCaseBtnNav = document.getElementById("newCaseBtnNav");
const emptyFileBtn = document.getElementById("emptyFileBtn");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");
const cancelBtn = document.getElementById("cancelBtn");
const caseForm = document.getElementById("caseForm");
const formError = document.getElementById("formError");
const retryBtn = document.getElementById("retryBtn");
const watchDemoBtn = document.getElementById("watchDemoBtn");

const statTotal = document.getElementById("statTotal");
const statPending = document.getElementById("statPending");
const statProgress = document.getElementById("statProgress");
const statResolved = document.getElementById("statResolved");

function caseNumber(id, createdAt) {
  const raw = String(id ?? "");
  const digits = raw.replace(/\D/g, "");
  const suffix = digits ? digits.slice(-4).padStart(4, "0") : raw.slice(-4).padStart(4, "0");
  return `GRV-${suffix}`;
}

function formatDate(value) {
  if (!value) return "date unknown";
  const d = new Date(value);
  if (isNaN(d)) return "date unknown";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function statusLabel(status) {
  return String(status || "Pending");
}

async function loadCases() {
  errorStateEl.hidden = true;
  try {
    const res = await fetch(ENDPOINT);
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    const data = await res.json();
    cases = Array.isArray(data) ? data : (data.grievances || data.data || []);
    render();
    renderStats();
  } catch (err) {
    console.error("Failed to load cases:", err);
    errorDetailEl.textContent = `Could not reach ${ENDPOINT}. Check that the server is running, then try again.`;
    errorStateEl.hidden = false;
    caseListEl.innerHTML = "";
    emptyStateEl.hidden = true;
    caseCountEl.textContent = "0";
  }
}

function renderStats() {
  statTotal.textContent = cases.length;
  statPending.textContent = cases.filter(c => (c.status || "Pending") === "Pending").length;
  statProgress.textContent = cases.filter(c => c.status === "In Progress").length;
  statResolved.textContent = cases.filter(c => c.status === "Resolved").length;
}

function render() {
  let filtered = activeStatus === "all"
    ? cases
    : cases.filter(c => (c.status || "Pending") === activeStatus);

  if (activeCategory !== "all") {
    filtered = filtered.filter(c => (c.category || "General") === activeCategory);
  }

  if (searchTerm.trim()) {
    const term = searchTerm.trim().toLowerCase();
    filtered = filtered.filter(c =>
      (c.title || "").toLowerCase().includes(term) ||
      (c.description || "").toLowerCase().includes(term)
    );
  }

  caseCountEl.textContent = String(filtered.length);
  caseListEl.innerHTML = "";

  if (filtered.length === 0) {
    emptyStateEl.hidden = false;
    return;
  }
  emptyStateEl.hidden = true;

  filtered
    .slice()
    .sort((a, b) => {
      if (sortMode === "oldest") {
        return new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0);
      }
      if (sortMode === "priority") {
        const diff = (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
        if (diff !== 0) return diff;
        return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
      }
      return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
    })
    .forEach(c => caseListEl.appendChild(buildCard(c)));
}

function buildCard(c) {
  const node = cardTemplate.content.cloneNode(true);
  const article = node.querySelector(".case-card");
  const status = c.status || "Pending";

  article.dataset.status = status;
  node.querySelector(".case-number").textContent = caseNumber(c.id || c._id, c.createdAt);
  const stamp = node.querySelector(".status-stamp");
  stamp.textContent = statusLabel(status);
  stamp.dataset.status = status;

  node.querySelector(".case-title").textContent = c.title || "Untitled case";
  node.querySelector(".case-desc").textContent = c.description || "";
  node.querySelector(".meta-item.category").textContent = c.category || "General";
  node.querySelector(".meta-item.priority").textContent = `${c.priority || "Medium"} priority`;
  node.querySelector(".meta-item.date").textContent = formatDate(c.createdAt || c.date);

  const select = node.querySelector(".status-select");
  select.value = status;
  select.addEventListener("change", () => updateStatus(c.id || c._id, select.value, article));

  const deleteBtn = node.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", () => deleteCase(c.id || c._id, article));

  return node;
}

async function createCase(payload) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Server responded with ${res.status}`);
  return res.json();
}

async function updateStatus(id, status, articleEl) {
  const prevStatus = articleEl.dataset.status;
  articleEl.dataset.status = status;
  try {
    const res = await fetch(`${ENDPOINT}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    await loadCases();
  } catch (err) {
    console.error("Failed to update status:", err);
    articleEl.dataset.status = prevStatus;
    alert("Could not update this case's status. Please try again.");
  }
}

async function deleteCase(id, articleEl) {
  if (!confirm("Withdraw this case from the register? This cannot be undone.")) return;
  try {
    const res = await fetch(`${ENDPOINT}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    articleEl.remove();
    cases = cases.filter(c => (c.id || c._id) !== id);
    render();
    renderStats();
  } catch (err) {
    console.error("Failed to delete case:", err);
    alert("Could not withdraw this case. Please try again.");
  }
}

function openDrawer() {
  overlay.hidden = false;
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  formError.hidden = true;
  document.getElementById("fTitle").focus();
}
function closeDrawer() {
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  caseForm.reset();
}

newCaseBtn.addEventListener("click", openDrawer);
if (newCaseBtnNav) newCaseBtnNav.addEventListener("click", openDrawer);
if (emptyFileBtn) emptyFileBtn.addEventListener("click", openDrawer);
closeDrawerBtn.addEventListener("click", closeDrawer);
cancelBtn.addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
});

if (watchDemoBtn) {
  watchDemoBtn.addEventListener("click", () => {
    document.querySelector(".register").scrollIntoView({ behavior: "smooth" });
  });
}

caseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.hidden = true;

  const payload = {
    title: document.getElementById("fTitle").value.trim(),
    description: document.getElementById("fDescription").value.trim(),
    category: document.getElementById("fCategory").value,
    priority: document.getElementById("fPriority").value,
    submittedBy: document.getElementById("fName").value.trim() || "Anonymous",
    status: "Pending"
  };

  if (!payload.title || !payload.description) {
    formError.textContent = "Title and description are required to file a case.";
    formError.hidden = false;
    return;
  }

  const submitBtn = caseForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    await createCase(payload);
    closeDrawer();
    await loadCases();
  } catch (err) {
    console.error("Failed to file case:", err);
    formError.textContent = "Could not submit this case. Check the server and try again.";
    formError.hidden = false;
  } finally {
    submitBtn.disabled = false;
  }
});

statusTabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  activeStatus = btn.dataset.status;
  statusTabsEl.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("is-active", t === btn);
    t.setAttribute("aria-selected", String(t === btn));
  });
  render();
});

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    render();
  });
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", (e) => {
    activeCategory = e.target.value;
    render();
  });
}

if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    sortMode = e.target.value;
    render();
  });
}

retryBtn.addEventListener("click", loadCases);

loadCases();
