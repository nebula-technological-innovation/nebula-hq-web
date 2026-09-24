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
  desk.push({ ...data, at: new Date().toISOString() });
  localStorage.setItem("nebula-desk", JSON.stringify(desk));
}
function mailtoFallback(data) {
  const body = `Name: ${data.name}\nEmail: ${data.email}\n\n${data.note}`;
  window.location.href = `mailto:${DESK}?subject=${encodeURIComponent("Nebula desk")}&body=${encodeURIComponent(body)}`;
}
if (form && status) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    persist(data);
    status.hidden = false;
    status.textContent = "Sending…";
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${DESK}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, note: data.note, _subject: "Nebula desk" }),
      });
      if (!res.ok) throw new Error("mail failed");
      status.textContent = "Sent to the desk. First use may ask you to confirm FormSubmit from that inbox.";
      form.reset();
    } catch {
      status.textContent = "Network mail failed. Opening your mail app instead.";
      mailtoFallback(data);
    }
  });
}
