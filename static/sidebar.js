(function () {
  const elements = {
    sidebar: document.getElementById("sidebar"),
    toggleButton: document.getElementById("sidebar-toggle"),
    mainContent: document.getElementById("main-content"),
    mediaQuery: window.matchMedia("(min-width: 768px)"),
    sidebarCloseButton: document.getElementById("sidebar-close"),
  };

  const toggleSidebar = () => {
    elements.sidebar.classList.toggle("-translate-x-full");
    elements.mainContent.classList.toggle("md:ml-64");
  };

  if (elements.toggleButton) {
    elements.toggleButton.addEventListener("click", toggleSidebar);
  }

  if (elements.sidebarCloseButton) {
    elements.sidebarCloseButton.addEventListener("click", toggleSidebar);
  }

  elements.mediaQuery.addEventListener("change", (e) => {
    if (e.matches) {
      elements.sidebar.classList.remove("-translate-x-full");
      elements.mainContent.classList.add("md:ml-64");
    } else {
      elements.sidebar.classList.add("-translate-x-full");
      elements.mainContent.classList.remove("md:ml-64");
    }
  });
})();
