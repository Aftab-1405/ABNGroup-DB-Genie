document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    html: document.querySelector("html"),
    themeToggle: document.getElementById("theme-toggle"),

    sidebar: document.getElementById("sidebar"),
    toggleButton: document.getElementById("sidebar-toggle"),
    sidebarCloseButton: document.getElementById("sidebar-close"),

    databasesDropdown: document.getElementById("databases"),
    connectDbButton: document.getElementById("connect-db"),
    sqlEditorContainer: document.getElementById("sql-editor"),
    executeQueryButton: document.getElementById("execute-query"),

    newConversationBtn: document.getElementById("new-conversation"),
    seeConversationsBtn: document.getElementById("see-conversations"),
    conversationsModal: document.getElementById("conversations-modal"),
    conversationList: document.getElementById("conversation-list"),

    mainContent: document.getElementById("main-content"),
    mediaQuery: window.matchMedia("(min-width: 768px)"),

    chat: document.getElementById("chat"),

    profileBtn: document.getElementById("profile-btn"),
    profileMenu: document.getElementById("profile-menu"),
    settingsModal: document.getElementById("settings-modal"),
    settingsModalClose: document.getElementById("settings-modal-close"),

    aiLogoContainer: document.getElementById("ai-logo-container"),
    textInput: document.getElementById("text-input"),
    sendIcon: document.getElementById("send-icon"),

    queryResultModal: document.getElementById("query-result-modal"),
    closeBtn: document.getElementById("query-result-modal-close-button"),
    queryResultTable: document.getElementById("query-result"),

    notificationArea: document.getElementById("notification-area"),
  };

  // Theme toggle
  elements.themeToggle.addEventListener("change", () => {
    elements.html.classList.toggle("dark");

    if (elements.html.classList.contains("dark")) {
      sqlEditor.setOption("theme", "dracula");
    } else {
      sqlEditor.setOption("theme", "default");
    }
  });

  // **** -------------------THEME TOGGLE END----------------------- ***

  // Cache the class names to avoid re-creating strings
  const SIDEBAR_HIDDEN_CLASS = "-translate-x-full";
  const SIDEBAR_VISIBLE_CLASS = "md:ml-64";

  // This is used to toggle the sidebar (Close/Open)
  const toggleSidebar = () => {
    elements.sidebar.classList.toggle(SIDEBAR_HIDDEN_CLASS);
    elements.mainContent.classList.toggle(SIDEBAR_VISIBLE_CLASS);
  };

  // Add event listeners if elements exist
  [elements.toggleButton, elements.sidebarCloseButton].forEach((button) => {
    if (button) {
      button.addEventListener("click", toggleSidebar);
    }
  });

  // Handle media query changes
  const handleMediaQueryChange = (e) => {
    const { sidebar, mainContent } = elements;
    if (e.matches) {
      sidebar.classList.remove(SIDEBAR_HIDDEN_CLASS);
      mainContent.classList.add(SIDEBAR_VISIBLE_CLASS);
    } else {
      sidebar.classList.add(SIDEBAR_HIDDEN_CLASS);
      mainContent.classList.remove(SIDEBAR_VISIBLE_CLASS);
    }
  };

  elements.mediaQuery.addEventListener("change", handleMediaQueryChange);

  // Initial check of the media query on page load
  handleMediaQueryChange(elements.mediaQuery);

  // ***** -------------------------SIDEBAR TOGGLE FUNCTIONING PART END----------------------- *****

  // Constants
  const LOADING_SPINNER_HTML = `
  <div class="flex items-center justify-center">
    <svg class="animate-spin h-4 w-4 md:h-5 md:w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.963 7.963 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span class="text-sm md:text-base">Processing...</span>
  </div>
`;

  // Fetch databases
  const fetchDatabases = async () => {
    try {
      const response = await fetch("/get_databases");
      const data = await response.json();
      if (data.status === "success") {
        const fragment = document.createDocumentFragment();
        data.databases.forEach((db) => {
          const option = document.createElement("option");
          option.value = db;
          option.textContent = db;
          fragment.appendChild(option);
        });
        elements.databasesDropdown.appendChild(fragment);
      }
    } catch (error) {
      showNotification("Failed to fetch databases", "error");
    }
  };

  fetchDatabases();

  // Event listener for connecting to the database
  const handleConnectDb = async () => {
    const db_name = elements.databasesDropdown.value;
    if (!db_name) return;

    const originalContent = elements.connectDbButton.innerHTML;
    elements.connectDbButton.disabled = true;
    elements.connectDbButton.innerHTML = LOADING_SPINNER_HTML;

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
    } catch (error) {
      showNotification("Failed to connect to the database", "error");
    } finally {
      elements.connectDbButton.innerHTML = originalContent;
      elements.connectDbButton.disabled = false;
    }
  };

  elements.connectDbButton.addEventListener("click", handleConnectDb);

  // Initialize CodeMirror for the SQL editor with default light theme
  const sqlEditor = CodeMirror(document.getElementById("sql-editor"), {
    mode: "text/x-sql",
    theme: "default",
    lineNumbers: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    matchBrackets: true,
    value: "Enter SQL query...",
    viewportMargin: Infinity,
    lineWrapping: true,
  });

  // Adjust CodeMirror editor size
  const adjustEditorSize = () => {
    const editorElement = document.querySelector("#sql-editor .CodeMirror");
    if (editorElement) {
      editorElement.style.height = "100%"; // Ensuring it uses the full height of its container
    }
  };

  sqlEditor.on("change", adjustEditorSize);
  window.addEventListener("resize", adjustEditorSize);

  // Initial call to adjust the size
  adjustEditorSize();

  // New conversation button
  elements.newConversationBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/new_conversation", { method: "POST" });
      const data = await response.json();
      if (data.status === "success") {
        sessionStorage.setItem("conversation_id", data.conversation_id);
        elements.chat.innerHTML = ""; // Clear the chat
        showNotification("New conversation started", "success");
      } else {
        throw new Error(`Unexpected response status: ${data.status}`);
      }
    } catch (error) {
      console.error("Error starting new conversation:", error);
      showNotification("Failed to start new conversation", "error");
    }
  });

  // Toggle conversation list visibility
  elements.seeConversationsBtn.addEventListener("click", async (event) => {
    event.stopPropagation(); // Prevent this click from immediately closing the dropdown
    const isHidden = elements.conversationList.classList.contains("hidden");

    if (isHidden) {
      await fetchAndDisplayConversations();
      elements.conversationList.classList.remove("hidden");
    } else {
      elements.conversationList.classList.add("hidden");
    }
  });

  // Fetch and display conversations
  const fetchAndDisplayConversations = async () => {
    try {
      const response = await fetch("/get_conversations");
      const data = await response.json();
      if (data.status === "success") {
        displayConversations(data.conversations);
      } else {
        throw new Error(`Unexpected response status: ${data.status}`);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      showNotification("Failed to fetch conversations", "error");
    }
  };

  // Close the dropdown when clicking outside of it
  document.addEventListener("click", (event) => {
    if (
      !elements.conversationList.contains(event.target) &&
      !elements.seeConversationsBtn.contains(event.target)
    ) {
      elements.conversationList.classList.add("hidden");
    }
  });

  // Display conversations in the dropdown
  const displayConversations = (conversations) => {
    elements.conversationList.innerHTML = "";
    const fragment = document.createDocumentFragment();

    conversations.forEach((conv) => {
      const convElement = document.createElement("a");
      convElement.href = "#";
      convElement.className =
        "block px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-600";
      const date = new Date(conv.timestamp).toLocaleDateString();
      convElement.textContent = `${date}: ${conv.preview}`;
      convElement.addEventListener("click", (event) => {
        event.preventDefault();
        loadConversation(conv.id);
        elements.conversationList.classList.add("hidden"); // Hide dropdown after selection
      });
      fragment.appendChild(convElement);
    });

    elements.conversationList.appendChild(fragment);
  };

  // Load a specific conversation
  const loadConversation = async (conversationId) => {
    try {
      const response = await fetch(`/get_conversation/${conversationId}`);
      const data = await response.json();
      if (data.status === "success") {
        sessionStorage.setItem("conversation_id", conversationId);
        elements.chat.innerHTML = ""; // Clear the chat
        data.conversation.messages.forEach((msg) => {
          addMessage(msg.content, msg.sender, true); // Set the third parameter to true to process markdown
        });
        elements.conversationsModal.classList.add("hidden");
      } else {
        throw new Error(`Unexpected response status: ${data.status}`);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  // *** ----------------------------SIDEBAR SECTION END------------------------- ***

  // *** --------------------------MAIN CONTENT SECTION BEGIN--------------------- ***

  // Toggle profile menu visibility
  const toggleProfileMenu = () => {
    elements.profileMenu.classList.toggle("invisible");
    elements.profileMenu.classList.toggle("opacity-0");
    elements.profileMenu.classList.toggle("scale-95");
  };

  // Close settings modal
  const closeSettingsModal = () => {
    elements.settingsModal.classList.add("invisible");
  };

  // Event listener for profile button
  elements.profileBtn.addEventListener("click", toggleProfileMenu);

  // Event listener for the first link in the profile menu
  document
    .querySelector("#profile-menu a:first-child")
    .addEventListener("click", (e) => {
      e.preventDefault();
      elements.settingsModal.classList.remove("invisible");
      elements.profileMenu.classList.add("invisible", "opacity-0", "scale-95");
    });

  // Event listener to close settings modal
  elements.settingsModalClose.addEventListener("click", closeSettingsModal);

  // Event listener to close profile menu when clicking outside
  document.addEventListener("click", (event) => {
    if (
      !elements.profileMenu.contains(event.target) &&
      !elements.profileBtn.contains(event.target)
    ) {
      elements.profileMenu.classList.add("invisible", "opacity-0", "scale-95");
    }
  });

  // Event listener to close settings modal when clicking outside of it
  elements.settingsModal.addEventListener("click", (event) => {
    if (!event.target.closest(".max-w-md")) {
      closeSettingsModal();
    }
  });

  // *** -------------------PROFILE PIC, SETTINGS MODAL SECTION IS OVER--------------------------- ***

  // Adjust text input height dynamically based on content
  const adjustTextInputHeight = () => {
    const textInput = document.getElementById("text-input");
    textInput.style.height = "auto";
    textInput.style.height = `${textInput.scrollHeight}px`;

    // Enable scrolling if content exceeds max height
    if (textInput.scrollHeight > 192) {
      // 192px is 48 * 4 (assuming 48px is the line height for each row)
      textInput.style.overflowY = "auto";
    } else {
      textInput.style.overflowY = "hidden";
    }
  };

  // Add event listener to adjust text input height on input event
  const textInput = document.getElementById("text-input");
  if (textInput) {
    textInput.addEventListener("input", adjustTextInputHeight);
  }

  // Assuming you've already included the necessary libraries (marked, DOMPurify, highlight.js) in your HTML

  // *** --------------DYNAMIC BEHAVIOR OF INPUT SECTION IMPLEMENTED------------------ ***

  // Handle AI response
  const handleResponse = (data) => {
    if (data.status === "success") {
      displayGeminiResponse(data.response);
    } else {
      handleError(data);
    }
  };

  // Send user input to AI
  elements.sendIcon.addEventListener("click", async () => {
    const { textInput, chat } = elements;
    const prompt = textInput.value;
    const conversationId = sessionStorage.getItem("conversation_id");
    if (prompt) {
      addMessage(prompt, "user");
      textInput.value = "";
      adjustTextInputHeight();

      try {
        const response = await fetch("/pass_userinput_to_gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, conversation_id: conversationId }),
        });

        if (!response.ok) {
          throw new Error("Network response was not ok.");
        }

        const data = await response.json();
        handleResponse(data);
      } catch (error) {
        handleError({
          status: "error",
          message: "Network error. Please try again.",
        });
      }
    }
  });

  // Create message elements
  const createSenderImage = (sender) => {
    const imgElement = document.createElement("img");
    imgElement.className = "w-6 h-6 md:w-7 md:h-7 rounded-full mr-2";
    imgElement.src =
      sender === "user"
        ? "/static/images/user.png"
        : "/static/images/Brand Product.png";
    return imgElement;
  };

  function processMarkdown(content) {
    // Process markdown
    let html = DOMPurify.sanitize(
      marked.parse(content, { gfm: true, breaks: true })
    );

    // Create a temporary div to hold the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Find all <pre><code> elements and apply syntax highlighting
    tempDiv.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });

    // Return the processed HTML
    return tempDiv.innerHTML;
  }

  const addMessage = (content, sender) => {
    elements.aiLogoContainer.style.display = "none";

    const messageElement = document.createElement("div");
    messageElement.className = `${sender}-message flex items-start p-2 opacity-0 transition-opacity duration-300`;

    const senderImage = createSenderImage(sender);

    const textContent = document.createElement("div");
    textContent.className = `${sender}-message-text prose flex flex-col w-full text-sm md:text-base text-black dark:text-white`;

    textContent.innerHTML = processMarkdown(content);

    textContent.style.whiteSpace = "pre-wrap";

    messageElement.append(senderImage, textContent);
    elements.chat.appendChild(messageElement);

    requestAnimationFrame(() => {
      messageElement.classList.remove("opacity-0");
    });

    scrollToBottom();
  };

  // Display AI response with typewriter effect
  const displayGeminiResponse = (responseText) => {
    addMessage(responseText, "ai");
    typeWriter(
      responseText,
      elements.chat.lastElementChild.lastElementChild,
      true,
      scrollToBottom
    );
  };

  // Typewriter effect with real-time markdown processing and syntax highlighting
  const typeWriter = (text, element, isMarkdown, callback) => {
    const words = text.split(" ");
    let i = 0;
    let j = 0;
    let currentText = "";
    let isUserScrolling = false;
    let scrollTimeout;
    let animationId;

    const animateText = () => {
      if (i < words.length) {
        currentText += words[i].charAt(j);
        if (isMarkdown) {
          element.innerHTML = processMarkdown(currentText + " ");
        } else {
          element.innerHTML = DOMPurify.sanitize(currentText);
        }

        if (!isUserScrolling) {
          elements.chat.parentElement.scrollTop =
            elements.chat.parentElement.scrollHeight;
        }

        j++;
        if (j === words[i].length + 1) {
          j = 0;
          i++;
          currentText += " ";
        }

        animationId = requestAnimationFrame(animateText);
      } else if (callback) {
        callback();
      }
    };

    const handleUserScroll = () => {
      isUserScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const isAtBottom =
          elements.chat.parentElement.scrollHeight -
            elements.chat.parentElement.scrollTop ===
          elements.chat.parentElement.clientHeight;
        if (isAtBottom) {
          isUserScrolling = false;
        }
      }, 1000);
    };

    elements.chat.parentElement.addEventListener("wheel", handleUserScroll);
    elements.chat.parentElement.addEventListener("touchmove", handleUserScroll);

    animationId = requestAnimationFrame(animateText);
    return () => {
      cancelAnimationFrame(animationId);
      elements.chat.parentElement.removeEventListener(
        "wheel",
        handleUserScroll
      );
      elements.chat.parentElement.removeEventListener(
        "touchmove",
        handleUserScroll
      );
    };
  };

  function scrollToBottom() {
    const chatContainer = document.getElementById("chat-container");
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // *** ----------USER INPUT, AI RESPONSE APPENDING AND TYPING EFFECT SECTION END---------- ***

  // Notification functionality
  const showNotification = (message, type) => {
    elements.notificationArea.textContent = message;
    elements.notificationArea.classList.remove(
      "hidden",
      "border-green-400",
      "border-red-400",
      "opacity-0"
    );
    elements.notificationArea.classList.add(
      "border",
      type === "success" ? "border-green-400" : "border-red-400"
    );

    setTimeout(() => {
      elements.notificationArea.classList.add("opacity-0");
      setTimeout(() => {
        elements.notificationArea.classList.add("hidden");
        elements.notificationArea.classList.remove("opacity-0");
      }, 500);
    }, 4500);
  };

  // ** ----------------COMMON NOFIFICATION FUNCTION ENDS HERE----------------- **

  // Error handling
  const errorMessages = {
    404: "The requested resource was not found.",
    500: "Internal server error. Please try again later.",
    timeout:
      "The request timed out. Please check your internet connection and try again.",
    default:
      "DB-Genie cannot respond to your query at the moment. Please try again later. 😊",
  };

  const getFriendlyErrorMessage = (errorCode) =>
    errorMessages[errorCode] || errorMessages.default;

  const handleError = (data) => {
    const errorCode = data.errorCode || data.message;
    const friendlyMessage = getFriendlyErrorMessage(errorCode);
    displayGeminiResponse(friendlyMessage, "error");
  };

  // *** ------------------ERROR HANDLIG SECTION END--------------------- ***

  // Execute SQL query
  const handleExecuteQuery = async () => {
    const sqlQuery = sqlEditor.getValue();
    if (!sqlQuery) return;

    const originalContent = elements.executeQueryButton.innerHTML;
    elements.executeQueryButton.disabled = true;
    elements.executeQueryButton.innerHTML = LOADING_SPINNER_HTML;

    try {
      const response = await fetch("/run_sql_query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql_query: sqlQuery }),
      });

      const data = await response.json();
      clearTable(elements.queryResultTable);

      if (data.status === "success" && data.result) {
        const { fields, rows } = data.result;
        if (fields.length || rows.length) {
          showModal();

          const fragment = document.createDocumentFragment();
          const headerRow = elements.queryResultTable.insertRow(-1);
          fields.forEach((header) => {
            const cell = document.createElement("th");
            cell.textContent = header;
            cell.className = "px-2 py-1 text-center text-sm md:text-base";
            headerRow.appendChild(cell);
          });
          rows.forEach((row) => {
            const rowElement = elements.queryResultTable.insertRow(-1);
            row.forEach((cellData) => {
              const cell = rowElement.insertCell(-1);
              cell.textContent = cellData;
              cell.className = "px-2 py-1 text-center text-sm md:text-base";
            });
            fragment.appendChild(rowElement);
          });
          elements.queryResultTable.appendChild(fragment);
        }
        showNotification(data.message, "success");
      } else {
        showNotification(data.message, "error");
      }
    } catch (error) {
      showNotification("Failed to execute query", "error");
    } finally {
      elements.executeQueryButton.innerHTML = originalContent;
      elements.executeQueryButton.disabled = false;
    }
  };

  elements.executeQueryButton.addEventListener("click", handleExecuteQuery);

  // Function to clear the query result table
  const clearTable = (table) => {
    while (table.rows.length > 0) table.deleteRow(0);
  };

  // Query result modal
  const showModal = () =>
    elements.queryResultModal.classList.replace("hidden", "flex");

  const hideModal = () =>
    elements.queryResultModal.classList.replace("flex", "hidden");

  elements.closeBtn.addEventListener("click", hideModal);
  window.addEventListener("click", (event) => {
    if (event.target === elements.queryResultModal) hideModal();
  });

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
});
