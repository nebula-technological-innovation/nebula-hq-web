const SEED = [
  {
    id: "proof",
    name: "Close first proof dollar",
    window: "This week",
    status: "Live",
    crew: "Orion · Vega",
    readings: [
      { t: "Mon", mark: "P-01", bearing: "Offer v1", note: "One buyer, one price" },
      { t: "Tue", mark: "P-02", bearing: "Desk live", note: "Form hits Roe mail" },
      { t: "Wed", mark: "P-03", bearing: "Site up", note: "Preview, not theater" },
    ],
  },
  {
    id: "atlas",
    name: "Ship Atlas reliability",
    window: "This week",
    status: "Queued",
    crew: "Atlas · Embed",
    readings: [],
  },
  {
    id: "outbound",
    name: "Outbound window",
    window: "Next 10 days",
    status: "Queued",
    crew: "Lyra · Hunter",
    readings: [
      { t: "last night", mark: "O-01", bearing: "List of 20", note: "No send until copy is specific" },
    ],
  },
];

const JOB_KEY = "nebula-jobs-v1";
const DIM_KEY = "nebula-dim";

function loadJobs() {
  try {
    const raw = localStorage.getItem(JOB_KEY);
    if (!raw) return structuredClone(SEED);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return structuredClone(SEED);
    return parsed;
  } catch {
    return structuredClone(SEED);
  }
}

function saveJobs() {
  localStorage.setItem(JOB_KEY, JSON.stringify(jobs));
}

function applyDim(dim) {
  document.documentElement.dataset.dim = dim === "med" ? "med" : "low";
}

const jobs = loadJobs();
applyDim(localStorage.getItem(DIM_KEY) || "low");

const main = document.querySelector("#main");
const navLinks = [...document.querySelectorAll("[data-nav]")];

function route() {
  const hash = location.hash.slice(1) || "/";
  const parts = hash.split("/").filter(Boolean);
  if (parts[0] === "job" && parts[1]) return renderJob(parts[1]);
  if (parts[0] === "jobs") return renderJobs();
  if (parts[0] === "settings") return renderSettings();
  return renderToday();
}

function setNav(id) {
  navLinks.forEach((a) => a.setAttribute("aria-current", a.dataset.nav === id ? "page" : "false"));
}

function marksTonight() {
  return jobs.reduce((n, j) => n + j.readings.filter((r) => r.t !== "last night").length, 0);
}

function renderToday() {
  setNav("today");
  const live = jobs.filter((j) => j.status === "Live").length;
  main.innerHTML = `
    <h1>Tonight</h1>
    <p class="meta">Proof first · agents draft · Roe signs send, spend, and production</p>
    <div class="stats">
      <div class="stat"><b>${jobs.length}</b><span>Jobs</span></div>
      <div class="stat"><b>${live}</b><span>Live</span></div>
      <div class="stat"><b>${marksTonight()}</b><span>Marks logged</span></div>
    </div>
    <div class="job-list">${jobs.map(jobCard).join("")}</div>
  `;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || `job-${Date.now()}`;
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderJobs() {
  setNav("jobs");
  main.innerHTML = `
    <h1>Jobs</h1>
    <p class="meta">This night’s book. Open a line to read or add a mark. Entries stay on this device.</p>
    <div class="job-list">${jobs.map(jobCard).join("")}</div>
    <form class="log-form" id="new-job">
      <div>
        <label for="job-name">New job</label>
        <input id="job-name" name="name" required maxlength="60" placeholder="One line the desk would recognize">
      </div>
      <div>
        <label for="job-crew">Crew</label>
        <input id="job-crew" name="crew" maxlength="40" placeholder="Atlas · Vega">
      </div>
      <div class="toolbar">
        <button class="btn" type="submit">Add job</button>
      </div>
    </form>
  `;
  document.getElementById("new-job").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const name = String(data.get("name") || "").trim();
    if (!name) return;
    let id = slugify(name);
    if (jobs.some((j) => j.id === id)) id = `${id}-${jobs.length + 1}`;
    jobs.unshift({
      id,
      name,
      window: "Opened tonight",
      status: "Queued",
      crew: String(data.get("crew") || "").trim() || "Desk",
      readings: [],
    });
    saveJobs();
    renderJobs();
  });
}

function jobCard(job) {
  return `
    <a class="job" href="#/job/${esc(job.id)}">
      <div>
        <strong>${esc(job.name)}</strong>
        <em>${esc(job.window)} · ${esc(job.crew)} · ${job.readings.length} mark${job.readings.length === 1 ? "" : "s"}</em>
      </div>
      <span class="tag">${esc(job.status)}</span>
    </a>
  `;
}

function renderJob(id) {
  setNav("jobs");
  const job = jobs.find((j) => j.id === id);
  if (!job) {
    main.innerHTML = `<div class="banner err">No job with that mark.</div><p><a class="btn ghost" href="#/jobs">Back to jobs</a></p>`;
    return;
  }
  const rows = job.readings
    .map((r) => `<tr><td>${esc(r.t)}</td><td>${esc(r.mark)}</td><td>${esc(r.bearing)}</td><td>${esc(r.note)}</td></tr>`)
    .join("");
  main.innerHTML = `
    <p class="meta"><a href="#/jobs">Jobs</a> / ${esc(job.name)}</p>
    <h1>${esc(job.name)}</h1>
    <p class="meta">${esc(job.window)} · ${esc(job.crew)} · ${esc(job.status)}</p>
    ${job.readings.length ? "" : `<div class="empty">No marks yet. Write the first signal when the work moves.</div>`}
    ${job.readings.length ? `<table><thead><tr><th>Time</th><th>Mark</th><th>Signal</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
    <form class="log-form" id="add-form">
      <div>
        <label for="bearing">Signal</label>
        <input id="bearing" name="bearing" required maxlength="40">
      </div>
      <div>
        <label for="note">Note</label>
        <input id="note" name="note" maxlength="80" placeholder="What changed">
      </div>
      <div class="toolbar">
        <button class="btn" type="submit">Log mark</button>
        <a class="btn ghost" href="#/jobs">All jobs</a>
      </div>
    </form>
    <p id="form-status" class="meta" role="status"></p>
  `;
  document.getElementById("add-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const signal = String(data.get("bearing") || "").trim();
    if (!signal) {
      document.getElementById("form-status").textContent = "Need a signal the desk would recognize.";
      return;
    }
    const note = String(data.get("note") || "").trim() || "Hand logged";
    job.readings.push({
      t: new Date().toTimeString().slice(0, 5),
      mark: `N-${String(job.readings.length + 1).padStart(2, "0")}`,
      bearing: signal,
      note,
    });
    job.status = "Live";
    saveJobs();
    renderJob(id);
  });
}

function renderSettings() {
  setNav("settings");
  const dim = localStorage.getItem(DIM_KEY) || "low";
  main.innerHTML = `
    <h1>Settings</h1>
    <p class="meta">Local only. Nothing leaves the belt kit.</p>
    <form class="settings" id="set-form">
      <label for="dim">Screen dim</label>
      <select id="dim" name="dim">
        <option value="low" ${dim === "low" ? "selected" : ""}>Low — night</option>
        <option value="med" ${dim === "med" ? "selected" : ""}>Medium</option>
      </select>
      <div class="toolbar">
        <button class="btn" type="submit">Save</button>
        <button class="btn ghost" type="button" id="reset-book">Reset night book</button>
      </div>
      <p id="form-status" class="meta" role="status"></p>
    </form>
  `;
  document.getElementById("set-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const next = String(new FormData(e.target).get("dim"));
    localStorage.setItem(DIM_KEY, next);
    applyDim(next);
    document.getElementById("form-status").textContent = "Dim saved on this device.";
  });
  document.getElementById("reset-book").addEventListener("click", () => {
    localStorage.removeItem(JOB_KEY);
    jobs.splice(0, jobs.length, ...structuredClone(SEED));
    document.getElementById("form-status").textContent = "Night book restored to the printed sheet.";
  });
}

window.addEventListener("hashchange", route);
route();
