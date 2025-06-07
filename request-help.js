const form = document.getElementById("helpForm");
const requestsList = document.getElementById("requestsList");
const searchInput = document.getElementById("searchInput");

let requests = [];

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const anonymous = document.getElementById("anonymous").checked;

  const request = {
    title,
    name: anonymous ? "Anonymous" : name,
    description
  };

  try {
    const res = await fetch("https://carechain-backend.onrender.com/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    const data = await res.json();
    requests.unshift(data);
    renderRequests(requests);
    form.reset();
  } catch (err) {
    console.error("Error submitting request:", err);
  }
});


searchInput.addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  const filtered = requests.filter(r =>
    r.title.toLowerCase().includes(keyword) ||
    r.description.toLowerCase().includes(keyword)
  );
  renderRequests(filtered);
});

function renderRequests(data) {
  requestsList.innerHTML = "";

  if (data.length === 0) {
    requestsList.innerHTML = "<p>No requests found.</p>";
    return;
  }

  data.forEach(req => {
    const card = document.createElement("div");
    card.className = "request-card";
    card.innerHTML = `
      <h3>${req.title}</h3>
      <p><strong>From:</strong> <span class="${req.name === 'Anonymous' ? 'anonymous' : ''}">${req.name}</span></p>
      <p>${req.description}</p>
    `;
    requestsList.appendChild(card);
  });
}
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("https://carechain-backend.onrender.com/api/requests");
    requests = await res.json();
    renderRequests(requests);
  } catch (err) {
    console.error("Error loading requests:", err);
  }
});
