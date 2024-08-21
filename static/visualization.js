(function () {
  // Function to show the visual container and initialize options
  window.showVisualContainer = () => {
    document.getElementById("query-result-modal").classList.add("hidden");
    document.getElementById("visual-container").classList.remove("hidden");
    initChartOptions();
  };

  // Function to show the query result container
  window.showQueryContainer = () => {
    document.getElementById("query-result-modal").classList.remove("hidden");
    document.getElementById("visual-container").classList.add("hidden");
  };

  // Function to initialize chart options
  const initChartOptions = () => {
    const table = document.getElementById("query-result");
    const headers = Array.from(table.querySelectorAll("th")).map(
      (th) => th.textContent
    );
    const selects = [
      "x-field",
      "y-field",
      "z-field",
      "color-field",
      "size-field",
    ];

    selects.forEach((selectId) => {
      const select = document.getElementById(selectId);
      select.innerHTML = "";
      headers.forEach((header) => {
        const option = document.createElement("option");
        option.value = header;
        option.textContent = header;
        select.appendChild(option);
      });
    });
  };

  // Function to detect data type
  const detectDataType = (values) => {
    const numericValues = values.filter((v) => !isNaN(v) && v !== "");
    return numericValues.length / values.length > 0.8
      ? "numeric"
      : "categorical";
  };
  window.createChart = () => {
    const chartType = document.getElementById("chart-type").value;
    const xField = document.getElementById("x-field").value;
    const yField = document.getElementById("y-field").value;
    const zField = document.getElementById("z-field").value;
    const colorField = document.getElementById("color-field").value;
    const sizeField = document.getElementById("size-field").value;
    const chartTitle = document.getElementById("chart-title").value;
    const theme = document.getElementById("theme").value;
    const container = document.getElementById("data-visualization");

    // Get data from the table
    const table = document.getElementById("query-result");
    const headers = Array.from(table.querySelectorAll("th")).map(
      (th) => th.textContent
    );
    const rows = Array.from(table.querySelectorAll("tr")).slice(1);
    const data = rows.map((row) =>
      Array.from(row.querySelectorAll("td")).reduce((acc, td, i) => {
        acc[headers[i]] = td.textContent;
        return acc;
      }, {})
    );

    // Prepare data for the chart
    const xData = data.map((row) => row[xField]);
    const yData = data.map((row) => row[yField]);
    const zData = zField ? data.map((row) => row[zField]) : null;
    const colorData = colorField ? data.map((row) => row[colorField]) : null;
    const sizeData = sizeField ? data.map((row) => row[sizeField]) : null;

    // Detect data types
    const xType = detectDataType(xData);
    const yType = detectDataType(yData);
    const zType = zData ? detectDataType(zData) : null;

    // Clear previous chart
    container.innerHTML = "";

    // Define plotly trace
    let trace = {
      x: xData,
      y: yData,
      type: chartType,
      mode: "markers",
      marker: {},
    };

    if (zData && (chartType === "scatter3d" || chartType === "surface")) {
      trace.z = zData;
    }

    if (colorData) {
      trace.marker.color = colorData;
    }

    if (sizeData) {
      trace.marker.size = sizeData;
    }

    // Adjust trace based on chart type
    switch (chartType) {
      case "bar":
        trace.orientation = "v";
        break;
      case "pie":
        trace.labels = xData;
        trace.values = yData;
        delete trace.x;
        delete trace.y;
        break;
      case "histogram":
        delete trace.y;
        break;
      case "box":
        trace.boxpoints = "all";
        break;
      case "heatmap":
        trace.z = yData;
        trace.x = [...new Set(xData)];
        trace.y = [...new Set(data.map((row) => row[yField]))];
        break;
    }

    const layout = {
      title: chartTitle || "Data Visualization",
      xaxis: {
        title: xField,
        type: xType === "numeric" ? "linear" : "category",
      },
      yaxis: {
        title: yField,
        type: yType === "numeric" ? "linear" : "category",
      },
      showlegend: true,
      template: theme === "dark" ? "plotly_dark" : "plotly_white",
    };

    if (zType) {
      layout.zaxis = {
        title: zField,
        type: zType === "numeric" ? "linear" : "category",
      };
    }

    const config = {
      responsive: true,
      scrollZoom: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ["lasso2d", "select2d"],
    };
    // Apply chart-specific layout adjustments
    switch (chartType) {
      case "pie":
        layout.xaxis = layout.yaxis = undefined;
        break;
      case "histogram":
        layout.bargap = 0.05;
        break;
      case "box":
        layout.boxmode = "group";
        break;
      case "heatmap":
        layout.xaxis.title = xField;
        layout.yaxis.title = yField;
        break;
    }

    // Create the plot
    Plotly.newPlot(container, [trace], layout, config);

    // Add error handling
    Plotly.newPlot(container, [trace], layout, config)
      .then(function () {
        console.log("Chart created successfully");
      })
      .catch(function (err) {
        console.error("Error creating chart:", err);
        container.innerHTML =
          '<p class="text-red-500">Error creating chart. Please check your data and try again.</p>';
      });
  };

  // Function to handle chart type change
  document.getElementById("chart-type").addEventListener("change", function () {
    const chartType = this.value;
    const zField = document.getElementById("z-field");
    const colorField = document.getElementById("color-field");
    const sizeField = document.getElementById("size-field");

    zField.parentElement.style.display =
      chartType === "scatter3d" || chartType === "surface" ? "block" : "none";
    colorField.parentElement.style.display =
      chartType !== "pie" ? "block" : "none";
    sizeField.parentElement.style.display =
      chartType === "scatter" || chartType === "scatter3d" ? "block" : "none";
  });

  // Initialize the chart options when the page loads
  window.addEventListener("load", initChartOptions);
})();
