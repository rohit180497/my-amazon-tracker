// document.getElementById("download").addEventListener("click", () => {
//     chrome.storage.local.get("interactions", (result) => {
//       if (chrome.runtime.lastError) {
//         console.error("Error retrieving data:", chrome.runtime.lastError);
//         return;
//       }
  
//       const interactions = result.interactions || [];
//       if (interactions.length === 0) {
//         alert("No interaction data found to download.");
//         return;
//       }
  
//       try {
//         const dataStr = JSON.stringify(interactions, null, 2);
//         const blob = new Blob([dataStr], { type: "application/json" });
//         const url = URL.createObjectURL(blob);
  
//         // Create a temporary download link
//         const downloadLink = document.createElement("a");
//         downloadLink.href = url;
//         downloadLink.download = "amazon_interactions.json";
  
//         // Trigger the download
//         document.body.appendChild(downloadLink);
//         downloadLink.click();
  
//         // Cleanup: remove the link and release the URL object
//         document.body.removeChild(downloadLink);
//         URL.revokeObjectURL(url);
  
//       } catch (error) {
//         console.error("Error generating JSON file:", error);
//         alert("An error occurred while generating the JSON file.");
//       }
//     });
//   });
  
document.addEventListener("DOMContentLoaded", () => {
  const downloadButton = document.getElementById("download");
  
  if (downloadButton) {
    downloadButton.addEventListener("click", () => {
      chrome.storage.local.get("interactions", (result) => {
        if (chrome.runtime.lastError) {
          console.error("Error retrieving data:", chrome.runtime.lastError);
          return;
        }

        const interactions = result.interactions || [];
        if (interactions.length === 0) {
          alert("No interaction data found to download.");
          return;
        }

        try {
          const dataStr = JSON.stringify(interactions, null, 2);
          const blob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);

          const downloadLink = document.createElement("a");
          downloadLink.href = url;
          downloadLink.download = "amazon_interactions.json";

          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Error generating JSON file:", error);
          alert("An error occurred while generating the JSON file.");
        }
      });
    });
  } else {
    console.error("Download button not found");
  }
});
