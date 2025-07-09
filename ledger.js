const ledgerList = document.getElementById("ledgerList");
const searchName = document.getElementById("searchName");
const filterDate = document.getElementById("filterDate");
const sortOrder = document.getElementById("sortOrder");
const totalCount = document.getElementById("totalCount");
const pagination = document.getElementById("pagination");
const statusButtons = document.querySelectorAll(".status-filter");

let currentStatus = "all";
let allRequests = [];
let filteredRequests = [];
let currentPage = 1;
const perPage = 5;

async function fetchLedger() {
try {
const res = await fetch("https://carechain-backend.onrender.com/api/requests");
const data = await res.json();
allRequests = data;
applyFilters();
} catch (err) {
ledgerList.innerHTML = "<p>Error loading ledger data.</p>";
console.error("Ledger fetch error:", err);
}
}

function renderLedger(data) {
ledgerList.innerHTML = "";

if (data.length === 0) {
ledgerList.innerHTML = "<p>No matching help requests found.</p>";
return;
}

const start = (currentPage - 1) * perPage;
const end = start + perPage;
const paginated = data.slice(start, end);

paginated.forEach(entry => {
const status = entry.status?.toLowerCase() === "resolved" ? "Resolved" : "Open";
const statusClass = status === "Resolved" ? "status-resolved" : "status-open";


const div = document.createElement("div");
div.className = "ledger-entry";
div.innerHTML = `
  <h3>${entry.title}</h3>
  <p><strong>From:</strong> ${entry.name}</p>
  <p><strong>Location:</strong> ${entry.location || "N/A"}</p>
  <p>${entry.description}</p>
  ${entry.proof ? `<p><strong>Proof:</strong> <a href="https://carechain-backend.onrender.com${entry.proof}" target="_blank">📄 View Proof</a></p>` : ""}
  <div class="status-row">
    <p>
      <strong>Status:</strong>
      <button class="status-toggle ${statusClass}" data-id="${entry._id}">
        ${status}
      </button>
    </p>
    <p>
      <button class="mark-resolved-btn" data-id="${entry._id}" ${status === "Resolved" ? "disabled" : ""}>
        ✅ Mark as Resolved
      </button>
    </p>
    <button class="delete-btn" data-id="${entry._id}">🗑 Delete</button>
  </div>
  <small>Submitted on ${new Date(entry.createdAt).toLocaleDateString()}</small>
`;

// Add toggle status listener
const toggleBtn = div.querySelector(".status-toggle");
if (toggleBtn) {
  toggleBtn.addEventListener("click", async () => {
    const newStatus = status === "Open" ? "Resolved" : "Open";
    try {
      const res = await fetch(`https://carechain-backend.onrender.com/api/requests/${entry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchLedger();
    } catch (err) {
      alert("❌ Failed to update status.");
      console.error(err);
    }
  });
}

// Add delete listener
const deleteBtn = div.querySelector(".delete-btn");
if (deleteBtn) {
  deleteBtn.addEventListener("click", async () => {
    if (confirm("Are you sure you want to delete this request?")) {
      try {
        const res = await fetch(`https://carechain-backend.onrender.com/api/requests/${entry._id}`, {
          method: "DELETE"
        });
        if (!res.ok) throw new Error("Failed to delete");
        alert("✅ Request deleted");
        fetchLedger();
      } catch (err) {
        alert("❌ Failed to delete request.");
        console.error("Delete error:", err);
      }
    }
  });
}

// Add "mark as resolved" listener
const markResolvedBtn = div.querySelector(".mark-resolved-btn");
if (markResolvedBtn) {
  markResolvedBtn.addEventListener("click", async () => {
    try {
      const res = await fetch(`https://carechain-backend.onrender.com/api/requests/${entry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resolved" })
      });
      if (!res.ok) throw new Error("Failed to resolve");
      fetchLedger();
    } catch (err) {
      alert("❌ Could not mark as resolved.");
      console.error(err);
    }
  });
}

ledgerList.appendChild(div);
});

renderPagination(data.length);
totalCount.textContent = `Total Requests: ${data.length}`;
}

function renderPagination(total) {
pagination.innerHTML = "";
const totalPages = Math.ceil(total / perPage);

for (let i = 1; i <= totalPages; i++) {
const btn = document.createElement("button");
btn.textContent = i;
btn.classList.toggle("active", i === currentPage);
btn.addEventListener("click", () => {
currentPage = i;
renderLedger(filteredRequests);
});
pagination.appendChild(btn);
}
}

function applyFilters() {
const nameValue = searchName.value.toLowerCase();
const dateValue = filterDate.value;
const sort = sortOrder.value;

filteredRequests = allRequests.filter(req => {
const matchName = nameValue
? (req.name || "").toLowerCase().includes(nameValue)
: true;
const matchDate = dateValue
? new Date(req.createdAt).toISOString().slice(0, 10) === dateValue
: true;
const matchStatus = currentStatus === "all"
? true
: (req.status || "open").toLowerCase() === currentStatus;
return matchName && matchDate && matchStatus;
});

if (sort === "newest") {
filteredRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
} else {
filteredRequests.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

currentPage = 1;
renderLedger(filteredRequests);
}

searchName.addEventListener("input", applyFilters);
filterDate.addEventListener("change", applyFilters);
sortOrder.addEventListener("change", applyFilters);
statusButtons.forEach(btn => {
btn.addEventListener("click", () => {
statusButtons.forEach(b => b.classList.remove("active"));
btn.classList.add("active");
currentStatus = btn.dataset.status;
applyFilters();
});
});

window.addEventListener("DOMContentLoaded", fetchLedger);