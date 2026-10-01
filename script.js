// ======================================================
// VIBRANZA 2026 - HOUSE POINTS MANAGEMENT
// Supabase Database Integration
// ======================================================

const HOUSE_NAMES = [
  "Yellow House",
  "Blue House",
  "Red House",
  "Green House"
];

const $ = (id) => document.getElementById(id);

let results = [];

// ------------------------------------------------------
// HTML SAFETY
// ------------------------------------------------------

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// ------------------------------------------------------
// NORMALIZE DATABASE ROWS
// Supports both snake_case and camelCase columns
// ------------------------------------------------------

function normalized(row) {
  return {
    ...row,
    regNo: row.reg_no ?? row.regNo ?? "",
    created_at: row.created_at ?? row.created_at ?? ""
  };
}

// ------------------------------------------------------
// LOAD RESULTS FROM SUPABASE
// Your current database uses created_at
// ------------------------------------------------------

async function loadResults() {
  const { data, error } = await supabaseClient
    .from("points")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase loading error:", error);
    throw error;
  }

  results = (data || []).map(normalized);

  renderAll();
}

// ------------------------------------------------------
// HOUSE TOTALS
// ------------------------------------------------------

function totalFor(house, rows = results) {
  return rows
    .filter((row) => row.house === house)
    .reduce((total, row) => total + Number(row.points || 0), 0);
}

// ------------------------------------------------------
// PUBLIC DASHBOARD
// ------------------------------------------------------

function renderDashboard() {
  const totalPoints = results.reduce(
    (sum, row) => sum + Number(row.points || 0),
    0
  );

  const stats = $("stats");

  if (stats) {
    stats.innerHTML = `
      <article class="stat">
        <span>Recorded Results</span>
        <strong>${results.length}</strong>
      </article>

      <article class="stat">
        <span>Total Points Awarded</span>
        <strong>${totalPoints}</strong>
      </article>

      <article class="stat">
        <span>Houses</span>
        <strong>4</strong>
      </article>
    `;
  }

  const houses = $("houses");

  if (houses) {
    houses.innerHTML = HOUSE_NAMES.map((house, index) => `
      <button class="house-card house-${index}" data-house="${esc(house)}">
        <span>${esc(house)}</span>
        <strong>${totalFor(house)} <small>pts</small></strong>
        <em>View participants →</em>
      </button>
    `).join("");

    houses.querySelectorAll("[data-house]").forEach((button) => {
      button.addEventListener("click", () => {
        showHouse(button.dataset.house);
      });
    });
  }

  const recentRows = $("recentRows");

  if (recentRows) {
    recentRows.innerHTML = results.slice(0, 8).map((row) => `
      <tr>
        <td>${esc(row.date || "—")}</td>
        <td>${esc(row.event)}</td>
        <td>${esc(row.house)}</td>
        <td>${esc(row.participant)}</td>
        <td>${esc(row.rank)}</td>
        <td>${esc(row.points)}</td>
      </tr>
    `).join("") || `
      <tr>
        <td colspan="6">No results recorded yet.</td>
      </tr>
    `;
  }
}

// ------------------------------------------------------
// PARTICIPANT DETAILS BY HOUSE
// ------------------------------------------------------

function showHouse(house) {
  const container = $("houseDetails");

  if (!container) return;

  const houseResults = results.filter(
    (row) => row.house === house
  );

  const participants = {};

  houseResults.forEach((row) => {
    const name = row.participant;

    if (!participants[name]) {
      participants[name] = {
        name: name,
        regNo: row.regNo,
        points: 0,
        events: []
      };
    }

    participants[name].points += Number(row.points || 0);
    participants[name].events.push(row.event);
  });

  const participantRows = Object.values(participants);

  container.innerHTML = `
    <h2>${esc(house)} — Participant Points</h2>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Participant</th>
            <th>Register Number</th>
            <th>Events</th>
            <th>Total Points</th>
          </tr>
        </thead>

        <tbody>
          ${participantRows.map((person) => `
            <tr>
              <td>${esc(person.name)}</td>
              <td>${esc(person.regNo || "—")}</td>
              <td>${esc(person.events.join(", "))}</td>
              <td>${person.points}</td>
            </tr>
          `).join("") || `
            <tr>
              <td colspan="4">No participants recorded.</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  `;
}

// ------------------------------------------------------
// ADMIN TABLE
// ------------------------------------------------------

function renderAdmin() {
  const tableBody = $("adminRows");

  if (!tableBody) return;

  tableBody.innerHTML = results.map((row) => `
    <tr>
      <td>${esc(row.date || "—")}</td>
      <td>${esc(row.event)}</td>
      <td>${esc(row.house)}</td>
      <td>${esc(row.participant)}</td>
      <td>${esc(row.regNo || "—")}</td>
      <td>${esc(row.rank)}</td>
      <td>${esc(row.points)}</td>

      <td>
        <button class="btn tiny" data-edit="${esc(row.id)}">
          Edit
        </button>

        <button class="btn tiny danger" data-delete="${esc(row.id)}">
          Delete
        </button>
      </td>
    </tr>
  `).join("");

  const emptyMessage = $("emptyAdmin");

  if (emptyMessage) {
    emptyMessage.textContent = results.length
      ? ""
      : "No results added yet.";
  }

  tableBody.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      editResult(button.dataset.edit);
    });
  });

  tableBody.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteResult(button.dataset.delete);
    });
  });
}

// ------------------------------------------------------
// RENDER ALL
// ------------------------------------------------------

function renderAll() {
  renderDashboard();
  renderAdmin();
}

// ------------------------------------------------------
// CLEAR FORM
// ------------------------------------------------------

function clearForm() {
  const form = $("resultForm");

  if (!form) return;

  form.reset();

  if ($("resultId")) {
    $("resultId").value = "";
  }

  if ($("formTitle")) {
    $("formTitle").textContent = "Add Result";
  }

  showMessage("");
}

// ------------------------------------------------------
// DISPLAY ADMIN MESSAGE
// ------------------------------------------------------

function showMessage(message, isError = false) {
  const messageElement = $("adminMessage");

  if (!messageElement) return;

  messageElement.textContent = message;
  messageElement.style.color = isError ? "#dc2626" : "#15803d";
}

// ------------------------------------------------------
// EDIT RESULT
// ------------------------------------------------------

function editResult(id) {
  const row = results.find((item) => String(item.id) === String(id));

  if (!row) return;

  $("resultId").value = row.id;
  $("eventChoice").value = row.event || "";
  $("house").value = row.house || "";
  $("participant").value = row.participant || "";
  $("regNo").value = row.regNo || "";
  $("rank").value = row.rank || "";
  $("points").value = row.points ?? "";
  $("date").value = row.date || "";
  $("remarks").value = row.remarks || "";

  $("formTitle").textContent = "Edit Result";

  showMessage("Editing selected result.");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ------------------------------------------------------
// SAVE RESULT
// Supports reg_no or regNo database column
// ------------------------------------------------------

async function saveResult(item, id) {
  const table = supabaseClient.from("points");

  // First try the common snake_case column name.
  const snakeCaseItem = {
    event: item.event,
    house: item.house,
    participant: item.participant,
    reg_no: item.regNo,
    rank: item.rank,
    points: item.points,
    date: item.date,
    remarks: item.remarks
  };

  let response;

  if (id) {
    response = await table
      .update(snakeCaseItem)
      .eq("id", id);
  } else {
    response = await table.insert(snakeCaseItem);
  }

  // If database uses camelCase regNo, retry with that column.
  if (
    response.error &&
    response.error.code === "42703" &&
    /reg_no/i.test(response.error.message || "")
  ) {
    const camelCaseItem = {
      event: item.event,
      house: item.house,
      participant: item.participant,
      regNo: item.regNo,
      rank: item.rank,
      points: item.points,
      date: item.date,
      remarks: item.remarks
    };

    if (id) {
      response = await table
        .update(camelCaseItem)
        .eq("id", id);
    } else {
      response = await table.insert(camelCaseItem);
    }
  }

  return response;
}

// ------------------------------------------------------
// DELETE RESULT
// ------------------------------------------------------

async function deleteResult(id) {
  const confirmed = confirm("Are you sure you want to delete this result?");

  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("points")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete error:", error);
    showMessage("Delete failed: " + error.message, true);
    return;
  }

  showMessage("Result deleted successfully.");

  await loadResults();
}

// ------------------------------------------------------
// EXPORT CSV
// ------------------------------------------------------

function exportCSV() {
  const fields = [
    "date",
    "event",
    "house",
    "participant",
    "regNo",
    "rank",
    "points",
    "remarks"
  ];

  const csvRows = [
    fields.join(","),
    ...results.map((row) =>
      fields.map((field) => {
        const value = String(row[field] ?? "").replace(/"/g, '""');
        return `"${value}"`;
      }).join(",")
    )
  ];

  const csvContent = "\uFEFF" + csvRows.join("\r\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "vibranza-house-points.csv";
  link.click();

  URL.revokeObjectURL(link.href);
}

// ------------------------------------------------------
// PAGE INITIALIZATION
// ------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadResults();
  } catch (error) {
    console.error("Supabase loading error:", error);

    showMessage(
      "Database loading failed: " +
      (error.message || "Unknown Supabase error"),
      true
    );

    return;
  }

  // Attach Save Result handler on admin page.
  const form = $("resultForm");

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const id = $("resultId").value;

      const item = {
        event: $("eventChoice").value.trim(),
        house: $("house").value,
        participant: $("participant").value.trim(),
        regNo: $("regNo").value.trim(),
        rank: $("rank").value,
        points: Number($("points").value),
        date: $("date").value || null,
        remarks: $("remarks").value.trim()
      };

      if (!item.event || !item.house || !item.participant || !item.rank) {
        showMessage("Please complete all required fields.", true);
        return;
      }

      if (!Number.isFinite(item.points) || item.points < 0) {
        showMessage("Please enter a valid points value.", true);
        return;
      }

      const saveButton = form.querySelector('[type="submit"]');

      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
      }

      showMessage("Saving result...");

      try {
        const { error } = await saveResult(item, id);

        if (error) {
          console.error("Save result error:", error);

          showMessage(
            "Save failed: " + error.message,
            true
          );

          return;
        }

        showMessage("Result saved successfully!");

        clearForm();

        await loadResults();

      } catch (error) {
        console.error("Unexpected save error:", error);

        showMessage(
          "Save failed: " + (error.message || "Unknown error"),
          true
        );

      } finally {
        if (saveButton) {
          saveButton.disabled = false;
          saveButton.textContent = "Save Result";
        }
      }
    });
  }

  // Clear form button.
  const cancelButton = $("cancelEdit");

  if (cancelButton) {
    cancelButton.addEventListener("click", clearForm);
  }

  // Export CSV button.
  const exportButton = $("exportCsv");

  if (exportButton) {
    exportButton.addEventListener("click", exportCSV);
  }
});
