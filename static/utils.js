(function () {
    // Function to clear the query result table
    window.clearTable = (table) => {
      while (table.rows.length > 0) table.deleteRow(0);
    };

    // Export table to CSV
    window.exportTableToCSV = (filename) => {
      const rows = Array.from(elements.queryResultTable.querySelectorAll("tr"));
      const csvContent = rows
        .map((row) =>
          Array.from(row.querySelectorAll("th,td"))
            .map((cell) => cell.textContent)
            .join(",")
        )
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    // Function to scroll to the bottom of the chat
    window.scrollToBottom = () => {
      const chatContainer = document.getElementById("chat-container");
      chatContainer.scrollTop = chatContainer.scrollHeight;
    };
  })();