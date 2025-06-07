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

// Fetch data from backend
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

// Render entries for current page
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
      <p>${entry.description}</p>
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

    // Status toggle
    const toggleBtn = div.querySelector(".status-toggle");
    toggleBtn.addEventListener("click", async () => {
      const newStatus = status === "Open" ? "Resolved" : "Open";
      try {
        const res = await fetch(`https://carechain-backend.onrender.com/api/requests/${entry._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error("Failed to update status");
        fetchLedger(); // reload updated list
      } catch (err) {
        alert("❌ Failed to update status.");
        console.error(err);
      }
    });

    // Delete
    const deleteBtn = div.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this request?")) {
        try {
          const res = await fetch(`https://carechain-backend.onrender.com/api/requests/${entry._id}`, {
            method: "DELETE"
          });
          if (!res.ok) throw new Error("Failed to delete");
          alert("✅ Request deleted");
          fetchLedger(); // Reload data
        } catch (err) {
          alert("❌ Failed to delete request.");
          console.error("Delete error:", err);
        }
      }
    });

    // Mark as resolved
    const markResolvedBtn = div.querySelector(".mark-resolved-btn");
markResolvedBtn.addEventListener("click", async () => {
  console.log("🧪 Trying to mark resolved:", entry);

  if (!entry._id || entry._id.length !== 24) {
    alert("❌ Invalid ID. Cannot mark as resolved.");
    return;
  }

  try {
    const res = await fetch(`https://carechain-backend.onrender.com/api/requests/${entry._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Resolved" })
    });

    if (!res.ok) throw new Error("Failed to resolve");
    fetchLedger(); // Reload after update
  } catch (err) {
    alert("❌ Could not mark as resolved.");
    console.error(err);
  }
});

    ledgerList.appendChild(div);
  });

  renderPagination(data.length);
  totalCount.textContent = `Total Requests: ${data.length}`;
}

// Pagination controls
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

// Filters and sorting
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

    const matchStatus =
      currentStatus === "all"
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

// Event listeners
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
