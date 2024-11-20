const viewDataBtn = document.getElementById('viewData');
const downloadDataBtn = document.getElementById('downloadData');
// const captureScreenshotBtn = document.getElementById('captureScreenshot');
const outputDiv = document.getElementById('output');

function displayData(data) {
    outputDiv.textContent = JSON.stringify(data, null, 2);
}

viewDataBtn.addEventListener('click', () => {
    try {
        chrome.storage.local.get(['interactions', 'screenshots'], (result) => {
            displayData(result);
        });
    } catch (error) {
        outputDiv.textContent = `Error: ${error.message}`;
    }
});

downloadDataBtn.addEventListener('click', () => {
    try {
        chrome.runtime.sendMessage({ action: 'downloadData' }, (response) => {
            if (response.success) {
                outputDiv.textContent = 'Data downloaded successfully.';
            } else {
                outputDiv.textContent = `Failed to download data: ${response.error || 'Unknown error'}`;
            }
        });
    } catch (error) {
        outputDiv.textContent = `Error: ${error.message}`;
    }
});

// captureScreenshotBtn.addEventListener('click', () => {
//     try {
//         chrome.runtime.sendMessage({ action: 'captureScreenshot' }, (response) => {
//             if (response.success) {
//                 outputDiv.textContent = 'Screenshot captured successfully.';
//             } else {
//                 outputDiv.textContent = `Failed to capture screenshot: ${response.message || 'Unknown error'}`;
//             }
//         });
//     } catch (error) {
//         outputDiv.textContent = `Error: ${error.message}`;
//     }
// });
