const form = document.getElementById("helpForm");
const requestsList = document.getElementById("requestsList");
const searchInput = document.getElementById("searchInput");
const detectBtn = document.getElementById("detectLocationBtn");
const locationInput = document.getElementById("location");
const locationStatus = document.getElementById("locationStatus");

let requests = [];

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const location = document.getElementById("location").value.trim();
  const anonymous = document.getElementById("anonymous").checked;

  const request = {
    title,
    name: anonymous ? "Anonymous" : name,
    description,
    location
  };

  try {
    const res = await fetch("https://carechain-backend.onrender.com/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    if (!res.ok) throw new Error("Failed to submit");

    const data = await res.json();
    requests.unshift(data);
    renderRequests(requests);
    form.reset();
    locationStatus.textContent = "";
  } catch (err) {
    console.error("Error submitting request:", err);
    alert("❌ Failed to submit help request.");
  }
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
  <p><strong>From:</strong> ${req.name}</p>
  <p>${req.description}</p>
  <p><strong>Location:</strong> ${req.location || "N/A"}</p>
  ${req.proof ? `<p><a href="${req.proof}" target="_blank">📎 View Attachment</a></p>` : ""}
`;

requestsList.appendChild(card);
});
}

// Load requests on page load
window.addEventListener("DOMContentLoaded", async () => {
try {
const res = await fetch("https://carechain-backend.onrender.com/api/requests");
requests = await res.json();
renderRequests(requests);
} catch (err) {
console.error("Error loading requests:", err);
}
});

// Location Detection
const GEOCODE_API_KEY = "aeb7c7c0934946979ecdc1e232d13973";

detectBtn?.addEventListener("click", () => {
locationStatus.textContent = "📡 Detecting...";
locationInput.disabled = true;

if (!navigator.geolocation) {
locationStatus.textContent = "Geolocation not supported.";
locationInput.disabled = false;
return;
}

navigator.geolocation.getCurrentPosition(success, error);
});

async function success(position) {
const { latitude, longitude } = position.coords;
try {
const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${GEOCODE_API_KEY}`);
const data = await response.json();
const components = data.results[0]?.components || {};


const city = components.city || components.town || components.village || "";
const state = components.state || "";
const country = components.country || "";

const fullLocation = `${city}, ${state}, ${country}`.replace(/^,|,$/g, "").trim();

locationInput.value = fullLocation;
locationInput.disabled = false;
locationStatus.textContent = "✅ Location detected.";
} catch (err) {
console.error("Reverse geocoding failed:", err);
locationStatus.textContent = "❌ Failed to detect location.";
locationInput.disabled = false;
}
}

function error() {
locationStatus.textContent = "⚠️ Could not access location.";
locationInput.disabled = false;
}