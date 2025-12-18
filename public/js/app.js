const apiBase = "/api/polls";

// Helpers
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

// Create poll UI
function addOptionField() {
  const container = qs("#optionsContainer");
  const count = container.querySelectorAll(".option-input").length + 1;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "option-input";
  input.placeholder = `Вариант ${count}`;
  container.appendChild(input);
}

async function createPoll() {
  const question = qs("#question").value.trim();
  const category = qs("#category").value.trim();
  const options = qsa(".option-input").map((i) => i.value.trim()).filter(Boolean);

  if (!question || options.length < 2) {
    alert("Введите вопрос и минимум 2 варианта ответа");
    return;
  }

  try {
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, options, category }),
    });
    if (!res.ok) throw new Error("Не удалось создать опрос");
    await loadPolls();
    // reset form
    qs("#question").value = "";
    qs("#category").value = "";
    const container = qs("#optionsContainer");
    container.innerHTML = `\n      <input type="text" class="option-input" placeholder="Вариант 1" />\n      <input type="text" class="option-input" placeholder="Вариант 2" />\n    `;
  } catch (err) {
    alert(err.message);
  }
}

// Load and render
let pollsCache = [];
let currentFilters = { status: "", category: "", search: "" };

async function loadPolls() {
  try {
    const params = [];
    if (currentFilters.status) params.push(`status=${encodeURIComponent(currentFilters.status)}`);
    if (currentFilters.category) params.push(`category=${encodeURIComponent(currentFilters.category)}`);
    const query = params.length ? `?${params.join("&")}` : "";
    const res = await fetch(apiBase + query);
    pollsCache = await res.json();
    renderPolls(pollsCache);
    updateStats(pollsCache);
    populateCategoryFilter(pollsCache);
  } catch (err) {
    console.error(err);
  }
}

function renderPolls(list) {
  const container = qs("#pollsList");
  container.innerHTML = "";
  if (!list.length) {
    container.innerHTML = '<div class="card"><p>Опросов нет</p></div>';
    return;
  }

  list.forEach((poll) => {
    const card = document.createElement("div");
    card.className = "card poll-card";

    const title = document.createElement("h3");
    title.textContent = poll.question;
    card.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `<span>Категория: ${poll.category || '-'} </span> <span>Голоса: ${poll.totalVotes}</span> <span>${poll.isActive ? 'Активен' : 'Закрыт'}</span>`;
    card.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "actions";

    const voteBtn = document.createElement("button");
    voteBtn.className = "btn";
    voteBtn.textContent = "Голосовать";
    voteBtn.onclick = () => openVoteModal(poll.id);
    actions.appendChild(voteBtn);

    const editBtn = document.createElement("button");
    editBtn.className = "btn";
    editBtn.textContent = "Редактировать";
    editBtn.onclick = () => openEditModal(poll);
    actions.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.textContent = "Удалить";
    delBtn.onclick = () => deletePoll(poll.id);
    actions.appendChild(delBtn);

    card.appendChild(actions);

    container.appendChild(card);
  });
}

// Vote modal
function openVoteModal(pollId) {
  const poll = pollsCache.find((p) => p.id === pollId);
  if (!poll) return alert("Опрос не найден");
  qs("#modalQuestion").textContent = poll.question;
  const voteOptions = qs("#voteOptions");
  voteOptions.innerHTML = "";
  poll.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "btn vote-option";
    btn.textContent = `${opt.text} (${opt.votes})`;
    btn.onclick = () => submitVote(pollId, opt.id);
    voteOptions.appendChild(btn);
  });

  qs("#voteResults").innerHTML = "";
  qs("#voteModal").style.display = "block";
}

function closeVoteModal() {
  qs("#voteModal").style.display = "none";
}

async function submitVote(pollId, optionId) {
  try {
    const res = await fetch(`${apiBase}/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Ошибка голосования");
    }
    const updated = await res.json();
    // show results
    const out = qs("#voteResults");
    out.innerHTML = updated.options.map(o => `<div class=\"result-item\"><span class=\"opt\">${o.text}</span><span class=\"votes\">${o.votes}</span></div>`).join("");
    await loadPolls();
  } catch (err) {
    alert(err.message);
  }
}

// Edit modal
function openEditModal(poll) {
  qs("#editId").value = poll.id;
  qs("#editQuestion").value = poll.question;
  qs("#editCategory").value = poll.category || "";
  qs("#editStatus").value = poll.isActive ? "true" : "false";
  qs("#editModal").style.display = "block";
}

function closeEditModal() {
  qs("#editModal").style.display = "none";
}

async function saveEditedPoll() {
  const id = qs("#editId").value;
  const question = qs("#editQuestion").value.trim();
  const category = qs("#editCategory").value.trim();
  const isActive = qs("#editStatus").value === "true";

  try {
    const res = await fetch(`${apiBase}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, category, isActive }),
    });
    if (!res.ok) throw new Error("Не удалось сохранить опрос");
    closeEditModal();
    await loadPolls();
  } catch (err) {
    alert(err.message);
  }
}

async function deletePoll(id) {
  if (!confirm("Удалить опрос?")) return;
  try {
    const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Не удалось удалить");
    await loadPolls();
  } catch (err) {
    alert(err.message);
  }
}

// Filters and search
function filterByStatus() {
  currentFilters.status = qs("#statusFilter").value;
  loadPolls();
}

function filterByCategory() {
  currentFilters.category = qs("#categoryFilter").value;
  loadPolls();
}

function searchPolls() {
  const term = qs("#searchInput").value.trim().toLowerCase();
  if (!term) {
    renderPolls(pollsCache);
    return;
  }
  const filtered = pollsCache.filter(p => p.question.toLowerCase().includes(term));
  renderPolls(filtered);
}

function populateCategoryFilter(list) {
  const sel = qs("#categoryFilter");
  const cats = Array.from(new Set(list.map(p => p.category).filter(Boolean)));
  sel.innerHTML = `<option value="">Все категории</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join("");
}

function updateStats(list) {
  qs("#totalPolls").textContent = list.length;
  qs("#activePolls").textContent = list.filter(p => p.isActive).length;
  qs("#totalVotes").textContent = list.reduce((s,p) => s + (p.totalVotes || 0), 0);
}

// Click outside to close modals
window.onclick = function(event) {
  const voteModal = qs('#voteModal');
  const editModal = qs('#editModal');
  if (event.target === voteModal) voteModal.style.display = 'none';
  if (event.target === editModal) editModal.style.display = 'none';
};

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadPolls();
});
