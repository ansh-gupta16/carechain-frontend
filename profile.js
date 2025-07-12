const nameInput = document.getElementById("nameInput");
const avatarInput = document.getElementById("avatarInput");
const removeAvatarBtn = document.getElementById("removeAvatarBtn");
const emailInput = document.getElementById("emailInput");
const bioInput = document.getElementById("bioInput");
const saveBtn = document.getElementById("saveBtn");
const avatar = document.getElementById("avatar");
const userRequestsContainer = document.getElementById("userRequests");

// Fetch profile from backend using email
async function fetchProfileFromBackend(email) {
  try {
    const res = await fetch(`https://carechain-backend.onrender.com/api/profile/${email}`);
    if (!res.ok) throw new Error("Profile not found");

    const profile = await res.json();

    nameInput.value = profile.name;
    emailInput.value = profile.email;
    bioInput.value = profile.bio || "";

    // Store data in localStorage for access across pages
    localStorage.setItem("profileEmail", profile.email);
    localStorage.setItem("profileName", profile.name);
    if (profile.avatar) {
      localStorage.setItem("profileAvatar", profile.avatar);
    }

    updateAvatar(profile.name);
    fetchRequestsForUser(profile.name);
  } catch (err) {
    console.warn("⚠️ Could not load profile from backend. Using fallback.");
    updateAvatar("Anonymous");
  }
}

// Update profile to backend
async function updateProfileInBackend() {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const bio = bioInput.value.trim();
  const avatarData = localStorage.getItem("profileAvatar");

  if (!email || !name) {
    alert("❗ Name and Email are required");
    return;
  }

  try {
    const res = await fetch(`https://carechain-backend.onrender.com/api/profile/${email}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, bio, avatar: avatarData })
    });

    if (!res.ok) throw new Error("Profile save failed");

    // Save name for use in other pages (like Ledger access control)
    localStorage.setItem("profileName", name);
    localStorage.setItem("profileEmail", email);

    alert("✅ Profile saved to backend!");
    updateAvatar(name);
    fetchRequestsForUser(name);
  } catch (err) {
    alert("❌ Failed to save profile.");
    console.error(err);
  }
}

// Display avatar (image or initials)
function updateAvatar(name) {
  const storedImage = localStorage.getItem("profileAvatar");
  if (storedImage) {
    avatar.style.background = "none";
    avatar.innerHTML = `<img src="${storedImage}" alt="avatar" style="width: 100%; height: 100%; border-radius: 50%;" />`;
  } else {
    const initials = name
      .split(" ")
      .map(n => n[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2);
    avatar.style.background = "#3498db";
    avatar.innerHTML = initials || "?";
  }
}

// Avatar upload
avatarInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      localStorage.setItem("profileAvatar", e.target.result);
      updateAvatar(nameInput.value.trim());
    };
    reader.readAsDataURL(file);
  }
});

// Fetch help requests submitted by this user
async function fetchRequestsForUser(userName) {
  try {
    const res = await fetch(`https://carechain-backend.onrender.com/api/requests?name=${encodeURIComponent(userName)}`);
    const allRequests = await res.json();

    const userRequests = allRequests.filter(req =>
      req.name?.toLowerCase() === userName.toLowerCase()
    );

    renderRequests(userRequests);
  } catch (err) {
    userRequestsContainer.innerHTML = "<p>❌ Could not load help requests.</p>";
    console.error(err);
  }
}

// Render editable help request cards
function renderRequests(requests) {
  userRequestsContainer.innerHTML = "";

  if (requests.length === 0) {
    userRequestsContainer.innerHTML = "<p>You haven't submitted any requests yet.</p>";
    return;
  }

  requests.forEach(req => {
    const status = req.status?.toLowerCase() === "resolved" ? "Resolved" : "Open";
    const statusClass = status === "Resolved" ? "status-resolved" : "status-open";

    const card = document.createElement("div");
    card.className = "request-card";
   card.innerHTML = `
<input type="text" class="edit-title" value="${req.title}" disabled />

<textarea class="edit-description" disabled>${req.description}</textarea> 
<p><strong>Location:</strong> ${req.location || "N/A"}</p> 
<p><strong>Status:</strong> <span class="status-badge ${statusClass}">${status}</span></p> 
<small>Submitted on ${new Date(req.createdAt).toLocaleDateString()}</small> 
<div class="actions"> <button class="edit-btn">Edit</button>
 <button class="delete-btn">Delete</button>
  <button class="save-btn" style="display:none;">Save</button>
   <button class="cancel-btn" style="display:none;">Cancel</button> </div> `;

    const titleField = card.querySelector(".edit-title");
    const descField = card.querySelector(".edit-description");
    const editBtn = card.querySelector(".edit-btn");
    const deleteBtn = card.querySelector(".delete-btn");
    const saveBtn = card.querySelector(".save-btn");
    const cancelBtn = card.querySelector(".cancel-btn");

    editBtn.addEventListener("click", () => {
      titleField.disabled = false;
      descField.disabled = false;
      editBtn.style.display = "none";
      deleteBtn.style.display = "none";
      saveBtn.style.display = "inline-block";
      cancelBtn.style.display = "inline-block";
    });

    cancelBtn.addEventListener("click", () => {
      titleField.value = req.title;
      descField.value = req.description;
      titleField.disabled = true;
      descField.disabled = true;
      editBtn.style.display = "inline-block";
      deleteBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
      cancelBtn.style.display = "none";
    });

    saveBtn.addEventListener("click", async () => {
      const updated = {
        title: titleField.value.trim(),
        description: descField.value.trim()
      };

      try {
        const res = await fetch(`https://carechain-backend.onrender.com/api/requests/${req._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        });

        if (!res.ok) throw new Error("Failed to update");

        req.title = updated.title;
        req.description = updated.description;
        alert("✅ Request updated");

        titleField.disabled = true;
        descField.disabled = true;
        editBtn.style.display = "inline-block";
        deleteBtn.style.display = "inline-block";
        saveBtn.style.display = "none";
        cancelBtn.style.display = "none";
      } catch (err) {
        alert("❌ Failed to update request.");
        console.error(err);
      }
    });

    deleteBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this request?")) {
        try {
          const res = await fetch(`https://carechain-backend.onrender.com/api/requests/${req._id}`, {
            method: "DELETE"
          });

          if (!res.ok) throw new Error("Failed to delete");
          alert("🗑️ Request deleted");

          fetchRequestsForUser(localStorage.getItem("profileName") || "Anonymous");
        } catch (err) {
          alert("❌ Could not delete request.");
          console.error(err);
        }
      }
    });

    userRequestsContainer.appendChild(card);
  });
}

// Load profile on page load
window.addEventListener("DOMContentLoaded", () => {
  const emailFromStorage = localStorage.getItem("profileEmail") || "ansh@example.com";
  fetchProfileFromBackend(emailFromStorage);
});

// Save button event
saveBtn.addEventListener("click", updateProfileInBackend);

// Remove avatar handler
removeAvatarBtn.addEventListener("click", () => {
  localStorage.removeItem("profileAvatar");
  updateAvatar(nameInput.value.trim());
  alert("🗑️ Avatar removed. Using initials instead.");
});
