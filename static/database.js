(function () {
  const elements = {
    databasesDropdown: document.getElementById("databases"),
    connectDbButton: document.getElementById("connect-db"),
    sqlEditorContainer: document.getElementById("sql-editor"),
    executeQueryButton: document.getElementById("execute-query"),
    queryResultModal: document.getElementById("query-result-modal"),
    closeBtn: document.getElementById("query-result-modal-close-button"),
    queryResultTable: document.getElementById("query-result"),
  };

  // Fetch databases
  const fetchDatabases = async () => {
    try {
      const response = await fetch("/get_databases");
      const data = await response.json();
      if (data.status === "success") {
        data.databases.forEach((db) => {
          const option = document.createElement("option");
          option.value = db;
          option.textContent = db;
          elements.databasesDropdown.appendChild(option);
        });
      }
    } catch (error) {
      showNotification("Failed to fetch databases", "error");
    }
  };

  fetchDatabases();

  // Connect to database
  elements.connectDbButton.addEventListener("click", async () => {
    const db_name = elements.databasesDropdown.value;
    if (!db_name) return;

    const originalContent = elements.connectDbButton.innerHTML;

    elements.connectDbButton.disabled = true;
    elements.connectDbButton.innerHTML = `
        <div class="flex items-center justify-center">
          <svg class="animate-spin h-4 w-4 md:h-5 md:w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.963 7.963 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm md:text-base">Connecting...</span>
        </div>
      `;

    try {
      const response = await fetch("/connect_db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ db_name }),
      });

      const data = await response.json();
      showNotification(
        data.status === "connected"
          ? `Connected to database ${db_name}`
          : data.message,
        data.status === "connected" ? "success" : "error"
      );
    } finally {
      elements.connectDbButton.innerHTML = originalContent;
      elements.connectDbButton.disabled = false;
    }
  });

  // Execute SQL query
  elements.executeQueryButton.addEventListener("click", async () => {
    const sqlQuery = sqlEditor.getValue();
    if (sqlQuery) {
      const originalContent = elements.executeQueryButton.innerHTML;

      elements.executeQueryButton.disabled = true;
      elements.executeQueryButton.innerHTML = `
          <div class="flex items-center justify-center">
            <svg class="animate-spin h-4 w-4 md:h-5 md:w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.963 7.963 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-sm md:text-base">Processing...</span>
          </div>
        `;

      try {
        const response = await fetch("/run_sql_query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sql_query: sqlQuery }),
        });
        const data = await response.json();
        clearTable(elements.queryResultTable);
        if (data.status === "success") {
          if (data.result) {
            const { fields, rows } = data.result;
            if (fields.length || rows.length) {
              showModal();
              const headerRow = elements.queryResultTable.insertRow(-1);
              fields.forEach((header) => {
                const cell = document.createElement("th");
                cell.textContent = header;
                cell.className = "px-2 py-1 text-sm md:text-base";
                headerRow.appendChild(cell);
              });
              rows.forEach((row) => {
                const rowElement = elements.queryResultTable.insertRow(-1);
                row.forEach((cellData) => {
                  const cell = rowElement.insertCell(-1);
                  cell.textContent = cellData;
                  cell.className = "px-2 py-1 text-sm md:text-base";
                });
              });
            }
          }
          showNotification(data.message, "success");
        } else {
          showNotification(data.message, "error");
        }
      } catch {
        showNotification("Failed to execute query", "error");
      } finally {
        elements.executeQueryButton.innerHTML = originalContent;
        elements.executeQueryButton.disabled = false;
      }
    }
  });

  // Query result modal
  const showModal = () =>
    elements.queryResultModal.classList.replace("hidden", "flex");
  const hideModal = () =>
    elements.queryResultModal.classList.replace("flex", "hidden");

  elements.closeBtn.addEventListener("click", hideModal);
  window.addEventListener("click", (event) => {
    if (event.target === elements.queryResultModal) hideModal();
  });
})();
