const interactions = [];
let screenshots = [];
const screenshotLimit = 100; // Maximum number of screenshots to store

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        try {
            if (message.action === 'saveData') {
                // Save interaction data
                interactions.push(message.data);
                await chrome.storage.local.set({ interactions });
                sendResponse({ success: true });
            }

            if (message.action === 'captureScreenshot') {
                // Capture a screenshot if under the limit
                if (screenshots.length < screenshotLimit) {
                    const screenshotDataUrl = await captureScreenshot();
                    if (screenshotDataUrl) {
                        screenshots.push(reducedQualityDataUrl); // Store reduced-quality screenshot
                        await chrome.storage.local.set({ screenshots });
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false, message: 'Failed to capture screenshot' });
                    }
                } else {
                    sendResponse({ success: false, message: 'Screenshot limit reached' });
                }
            }

            if (message.action === 'downloadData') {
                // Trigger download of stored data on user request
                await downloadDataAndClearStorage();
                sendResponse({ success: true });
            }

            if (message.action === 'capture') {
                // Capture visible tab and send the data URL
                chrome.tabs.captureVisibleTab(null, { format: "jpeg" }, (dataUrl) => {
                    if (chrome.runtime.lastError || !dataUrl) {
                        console.error("Capture error:", chrome.runtime.lastError.message);
                        sendResponse({ success: false });
                    } else {
                        sendResponse({ success: true, dataUrl });
                    }
                });
                return true;
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    })();
    return true; // Keeps the message channel open for async responses
});

// Capture a screenshot in the current tab
async function captureScreenshot() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg' }); // Capture in jpg format
            if (dataUrl) {
                // Convert to JPEG and reduce quality
                const reducedQualityDataUrl = await convertToJPEG(dataUrl, 0.5); // Adjust quality (0.0 to 1.0)
                return reducedQualityDataUrl;
            }
        }
    } catch (error) {
        console.error('Error capturing screenshot:', error);
    }
    return null;
}

// Convert a PNG data URL to JPEG with reduced quality
async function convertToJPEG(dataUrl, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions to match the image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw the image onto the canvas
            ctx.drawImage(img, 0, 0);

            // Convert canvas to a JPEG data URL with reduced quality
            const jpegDataUrl = canvas.toDataURL('image/jpeg', quality); // Quality ranges from 0.0 (lowest) to 1.0 (highest)
            resolve(jpegDataUrl);
        };
        img.onerror = reject;
        img.src = dataUrl; // Set the image source to the captured PNG data URL
    });
}

async function downloadDataAndClearStorage() {
    console.log('Starting data download and storage clearance...');
    chrome.storage.local.get(null, async (result) => {
        const interactionData = result.interactions || [];
        const screenshots = result.screenshots || [];
        const htmlSnapshots = result.htmlSnapshots || {};

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Create timestamp
        const baseFolder = `data/SESSION_${timestamp}`; // Folder structure

        console.log(`Found ${screenshots.length} screenshots to download.`);

        // Download screenshots
        if (screenshots.length > 0) {
            for (const screenshot of screenshots) {
                const filename = `${baseFolder}/screenshots/screenshot_${timestamp}.jpeg`; // Use unique screenshotId
                chrome.downloads.download({
                    url: screenshot.dataUrl,
                    filename,
                    saveAs: false
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        console.error("Download error:", chrome.runtime.lastError.message);
                    } else {
                        console.log(`Screenshot downloaded: ${filename}`);
                    }
                });
            }

            // Clear screenshots after download
            chrome.storage.local.set({ screenshots: [] }, () => {
                console.log("All screenshots downloaded and cleared from storage.");
            });
        }

        // Prepare the full session data (HTML snapshots and interactions)
        const fullData = { htmlSnapshots, interactions: interactionData };
        if (Object.keys(fullData).length > 0) {
            const  sessionDataJson = JSON.stringify(fullData, null, 2);
            const sessionFilename = `${baseFolder}/session_data.json`;
            const sessionDataBlob = new Blob([sessionDataJson], { type: 'application/json' });
            const reader = new FileReader();

            reader.onloadend = function () {
                const sessionDataUrl = reader.result;
                chrome.downloads.download({
                    url: sessionDataUrl,
                    filename: sessionFilename,
                    saveAs: false
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        console.error("Download error:", chrome.runtime.lastError.message);
                    } else {
                        console.log("Session data downloaded.");
                        // Clear interactions and HTML snapshots
                        chrome.storage.local.remove(['interactions', 'htmlSnapshots']);
                    }
                });
            };
            reader.readAsDataURL(sessionDataBlob);
        }
    });
}

// Listener for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.sendMessage(activeInfo.tabId, { action: "tabActivated" });
});
