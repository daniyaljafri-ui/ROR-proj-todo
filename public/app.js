const API_BASE = "/api/v1";

function getToken() {
  return localStorage.getItem("jwt_token");
}

function setToken(token) {
  if (token) localStorage.setItem("jwt_token", token);
}

function clearToken() {
  localStorage.removeItem("jwt_token");
}

async function fetchJson(path, options = {}) {
  const token = getToken();
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
async function ensureAuth() {
  if (getToken()) return;
  const mode = prompt("Auth required. Type 'l' to login or 'r' to register:", "l");
  if (!mode) return;
  const email = prompt("Email:")?.trim();
  const password = prompt("Password:");
  if (!email || !password) return alert("Email and password are required");
  try {
    if (mode.toLowerCase() === "r") {
      const password_confirmation = prompt("Confirm Password:");
      const data = await fetchJson(`${API_BASE}/register`, {
        method: "POST",
        body: JSON.stringify({ user: { email, password, password_confirmation } }),
      });
      setToken(data.token);
      localStorage.setItem("current_email", data.user.email);
    } else {
      const data = await fetchJson(`${API_BASE}/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      localStorage.setItem("current_email", data.user.email);
    }
  } catch (e) {
    alert(`Auth failed: ${e.message}`);
  }
}

function wireAuthBar() {
  const loginBtn = el("#login-btn");
  const registerBtn = el("#register-btn");
  const logoutBtn = el("#logout-btn");
  const currentUserSpan = el("#current-user");

  function updateUserEmail() {
    const email = localStorage.getItem("current_email");
    currentUserSpan.textContent = email ? `Signed in as ${email}` : "Not signed in";
  }

  loginBtn.addEventListener("click", async () => {
    const email = prompt("Email:")?.trim();
    const password = prompt("Password:");
    if (!email || !password) return;
    try {
      const data = await fetchJson(`${API_BASE}/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      localStorage.setItem("current_email", data.user.email);
      updateUserEmail();
      await refreshList();
    } catch (e) {
      alert(`Login failed: ${e.message}`);
    }
  });

  registerBtn.addEventListener("click", async () => {
    const email = prompt("Email:")?.trim();
    const password = prompt("Password:");
    const password_confirmation = prompt("Confirm Password:");
    if (!email || !password || !password_confirmation) return;
    try {
      const data = await fetchJson(`${API_BASE}/register`, {
        method: "POST",
        body: JSON.stringify({ user: { email, password, password_confirmation } }),
      });
      setToken(data.token);
      localStorage.setItem("current_email", data.user.email);
      updateUserEmail();
      await refreshList();
    } catch (e) {
      alert(`Register failed: ${e.message}`);
    }
  });

  logoutBtn.addEventListener("click", async () => {
    clearToken();
    localStorage.removeItem("current_email");
    updateUserEmail();
    document.querySelector("#todo-list").innerHTML = "";
    alert("Logged out.");
  });

  updateUserEmail();
}

async function listTodos() {
  return fetchJson(`${API_BASE}/todos`);
}

async function createTodo(payload) {
  return fetchJson(`${API_BASE}/todos`, {
    method: "POST",
    body: JSON.stringify({ todo: payload }),
  });
}

async function updateTodo(id, payload) {
  return fetchJson(`${API_BASE}/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ todo: payload }),
  });
}

async function deleteTodo(id) {
  return fetchJson(`${API_BASE}/todos/${id}`, { method: "DELETE" });
}

function getTodoId(todo) {
  if (todo.id) return todo.id;
  if (typeof todo._id === "string") return todo._id;
  if (todo._id && typeof todo._id.$oid === "string") return todo._id.$oid;
  return undefined;
}

function el(selector, root = document) {
  return root.querySelector(selector);
}

function cloneTemplate(id) {
  return el(`#${id}`).content.firstElementChild.cloneNode(true);
}

function renderTodo(todo) {
  const node = cloneTemplate("todo-item-template");
  const checkbox = el(".toggle", node);
  const text = el(".text", node);
  const metaDates = el(".dates", node);
  const priorityBadge = el(".priority-badge", node);
  const del = el(".delete", node);
  const edit = el(".edit", node);

  checkbox.checked = !!todo.completed;
  text.textContent = todo.title + (todo.description ? ` — ${todo.description}` : "");
  text.className = `text ${todo.completed ? "strike" : ""}`;

  // Priority badge
  const priority = todo.priority || "medium";
  const priorityColor = todo.priority_color || "#2563eb";
  priorityBadge.textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
  priorityBadge.style.backgroundColor = priorityColor;

  // Dates and overdue
  function parseTime(value) {
    if (!value) return null;
    if (typeof value === "string") return new Date(value);
    if (value.$date) return new Date(value.$date);
    return null;
  }
  const due = parseTime(todo.due_date);
  const reminder = parseTime(todo.reminder_at);
  const overdue = !!todo.overdue;
  const dateParts = [];
  if (due) dateParts.push(`Due: ${due.toLocaleString()}`);
  if (reminder) dateParts.push(`Remind: ${reminder.toLocaleString()}`);
  metaDates.textContent = dateParts.join(" · ");
  if (overdue) node.classList.add("overdue");

  checkbox.addEventListener("change", async () => {
    const id = getTodoId(todo);
    if (!id) return alert("Could not determine todo id");
    const updated = await updateTodo(id, { completed: checkbox.checked });
    Object.assign(todo, updated);
    text.className = `text ${todo.completed ? "strike" : ""}`;
    if (todo.overdue) node.classList.add("overdue"); else node.classList.remove("overdue");
  });

  del.addEventListener("click", async () => {
    const id = getTodoId(todo);
    if (!id) return alert("Could not determine todo id");
    await deleteTodo(id);
    node.remove();
  });

  edit.addEventListener("click", async () => {
    const title = prompt("New title", todo.title) ?? todo.title;
    const description = prompt("New description", todo.description || "") ?? todo.description;
    const due_date = prompt("New due date (ISO or blank)", todo.due_date || "") || null;
    const reminder_at = prompt("New reminder at (ISO or blank)", todo.reminder_at || "") || null;
    const priority = prompt("Priority (low|medium|high|urgent)", todo.priority || "medium") || "medium";
    const id = getTodoId(todo);
    if (!id) return alert("Could not determine todo id");
    const payload = { title, description, priority };
    if (due_date) payload.due_date = due_date;
    else payload.due_date = null;
    if (reminder_at) payload.reminder_at = reminder_at;
    else payload.reminder_at = null;
    const updated = await updateTodo(id, payload);
    Object.assign(todo, updated);
    text.textContent = todo.title + (todo.description ? ` — ${todo.description}` : "");
    const newDue = parseTime(todo.due_date);
    const newRem = parseTime(todo.reminder_at);
    const nextParts = [];
    if (newDue) nextParts.push(`Due: ${newDue.toLocaleString()}`);
    if (newRem) nextParts.push(`Remind: ${newRem.toLocaleString()}`);
    metaDates.textContent = nextParts.join(" · ");
    const nextPriority = todo.priority || "medium";
    priorityBadge.textContent = nextPriority.charAt(0).toUpperCase() + nextPriority.slice(1);
    priorityBadge.style.backgroundColor = todo.priority_color || priorityBadge.style.backgroundColor;
    if (todo.overdue) node.classList.add("overdue"); else node.classList.remove("overdue");
  });

  node.dataset.id = getTodoId(todo) || "";
  return node;
}

async function refreshList() {
  const list = el("#todo-list");
  list.innerHTML = "";
  const todos = await listTodos();
  todos.forEach((t) => list.appendChild(renderTodo(t)));
}

function wireCreateForm() {
  const form = el("#create-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = el("#title").value.trim();
    const description = el("#description").value.trim();
    const dueInput = el("#due_date").value;
    const reminderInput = el("#reminder_at").value;
    const priority = el("#priority").value;
    if (!title) return;
    // Convert datetime-local (no timezone) to ISO with local timezone
    function toISOOrNull(v) {
      if (!v) return null;
      const d = new Date(v);
      if (isNaN(d.getTime())) return null;
      return d.toISOString();
    }
    const payload = {
      title,
      description,
      priority,
    };
    const dueISO = toISOOrNull(dueInput);
    const remISO = toISOOrNull(reminderInput);
    if (dueISO) payload.due_date = dueISO;
    if (remISO) payload.reminder_at = remISO;
    await createTodo(payload);
    form.reset();
    await refreshList();
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  wireCreateForm();
  wireAuthBar();
  await ensureAuth();
  await refreshList();
});


