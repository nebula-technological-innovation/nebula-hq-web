const DESK = "christianroe@roeacquisitions.net";
const year = document.querySelector("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());

const clock = document.getElementById("local-clock");
function tickClock() {
  if (!clock) return;
  clock.textContent = new Date().toTimeString().slice(0, 5);
}
tickClock();
setInterval(tickClock, 15000);

const form = document.getElementById("desk-form");
const status = document.getElementById("form-status");

function persist(data) {
  const desk = JSON.parse(localStorage.getItem("nebula-desk") || "[]");
  desk.push({ name: data.name, email: data.email, note: data.note, at: new Date().toISOString() });
  localStorage.setItem("nebula-desk", JSON.stringify(desk.slice(-40)));
}

function mailtoFallback(data) {
  const body = `Name: ${data.name}\nEmail: ${data.email}\n\n${data.note}`;
  const href = `mailto:${DESK}?subject=${encodeURIComponent("Nebula desk")}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
}

if (form && status) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(form).entries());
    const data = {
      name: String(raw.name || "").trim(),
      email: String(raw.email || "").trim(),
      note: String(raw.note || "").trim(),
    };
    if (!data.name || !data.email || !data.note) {
      status.hidden = false;
      status.textContent = "Name, email, and a note are required.";
      return;
    }
    persist(data);
    status.hidden = false;
    if (String(raw._honey || "").trim()) {
      status.textContent = "Sent to the desk.";
      form.reset();
      return;
    }
    status.textContent = "Sending…";
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${DESK}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          _replyto: data.email,
          note: data.note,
          _subject: "Nebula desk",
          _template: "table",
          _captcha: "false",
          _url: "https://nebula-hq-web.vercel.app/#desk",
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.success === false || payload.success === "false") {
        throw new Error(payload.message || "mail failed");
      }
      status.textContent = "Sent to the desk. First use may ask you to confirm FormSubmit from that inbox.";
      form.reset();
    } catch {
      status.textContent = "Network mail failed. Opening your mail app instead.";
      mailtoFallback(data);
    }
  });
}
