(function () {
  const elements = {
    chat: document.getElementById("chat"),
    textInput: document.getElementById("text-input"),
    sendIcon: document.getElementById("send-icon"),
    aiLogoContainer: document.getElementById("ai-logo-container"),
    newConversationBtn: document.getElementById("new-conversation"),
    seeConversationsBtn: document.getElementById("see-conversations"),
    conversationList: document.getElementById("conversation-list"),
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
    return DOMPurify.sanitize(
      marked.parse(content, { gfm: true, breaks: true })
    );
  }

  const addMessage = (content, sender, processContent = true) => {
    elements.aiLogoContainer.style.display = "none";

    const messageElement = document.createElement("div");
    messageElement.className = `${sender}-message flex items-start p-2 opacity-0 transition-opacity duration-300`;

    const senderImage = createSenderImage(sender);

    const textContent = document.createElement("div");
    textContent.className = `${sender}-message-text prose flex flex-col w-full text-sm md:text-base text-black dark:text-white`;

    if (processContent) {
      textContent.innerHTML = processMarkdown(content);
    } else {
      textContent.innerText = content;
    }

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
    addMessage(responseText, "ai", false); // Don't process markdown here
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
        throw new Error("Unexpected response status: " + data.status);
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
      try {
        const response = await fetch("/get_conversations");
        const data = await response.json();
        if (data.status === "success") {
          displayConversations(data.conversations);
          elements.conversationList.classList.remove("hidden");
        } else {
          throw new Error("Unexpected response status: " + data.status);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        showNotification("Failed to fetch conversations", "error");
      }
    } else {
      elements.conversationList.classList.add("hidden");
    }
  });

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
  function displayConversations(conversations) {
    elements.conversationList.innerHTML = "";
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
      elements.conversationList.appendChild(convElement);
    });
  }

  // Load a specific conversation
  async function loadConversation(conversationId) {
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
        throw new Error("Unexpected response status: " + data.status);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  }
})();
