let lastScrollTime = 0; // Track last scroll timestamp
const SCROLL_THRESHOLD = 3000; // Minimum time in ms between screenshots for scroll actions
let screenshotCounter = 1; // To generate unique screenshot IDs
let htmlSnapshotId = null; // To store the current HTML snapshot ID

// Initialize HTML Snapshot when the script loads
initializeHtmlSnapshot();

// Function to initialize and store trimmed HTML snapshots
function initializeHtmlSnapshot() {
    const currentSnapshotId = generateHtmlSnapshotId();
    chrome.storage.local.get(['htmlSnapshots'], (result) => {
        const htmlSnapshots = result.htmlSnapshots || {};
        if (!htmlSnapshots[currentSnapshotId] || htmlSnapshotId !== currentSnapshotId) {
            htmlSnapshotId = currentSnapshotId;
            htmlSnapshots[htmlSnapshotId] = document.body.outerHTML; // Trim to body
            chrome.storage.local.set({ htmlSnapshots }, () => {
                console.log("HTML snapshot saved with new ID:", htmlSnapshotId);
            });
        }
    });
}

// Generate a unique HTML snapshot ID based on the page content
function generateHtmlSnapshotId() {
    const pageContent = document.body.outerHTML;
    return `html_${hashCode(pageContent)}`;
}

// Generate a hash code for unique identification
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}

// Function to capture screenshots and return the screenshot ID
async function captureScreenshot(eventType, target) {
    screenshotCounter++;

    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'capture' }, (response) => {
            if (response && response.dataUrl) {
                const screenshotId = `screenshot_${screenshotCounter}`;
                const screenshot = {
                    dataUrl: response.dataUrl,
                    timestamp: new Date().toISOString(),
                    screenshotId
                };

                // Store the screenshot in local storage
                chrome.storage.local.get({ screenshots: [] }, (result) => {
                    const screenshots = result.screenshots || [];
                    screenshots.push(screenshot);
                    chrome.storage.local.set({ screenshots }, () => {
                        console.log("Screenshot captured and stored with ID:", screenshotId);
                        resolve(screenshotId); // Resolve with the unique ID
                    });
                });
            } else {
                console.error("Failed to capture screenshot");
                resolve(null); // Resolve with null if screenshot fails
            }
        });
    });
}

// Function to capture interactions
async function captureInteraction(eventType, target, screenshotId) {
    const interaction = {
        eventType,
        timestamp: new Date().toISOString(),
        targetClass: truncateClasses(target.className), // Simplify class content
        targetId: target.id || '',
        targetText: target.innerText.trim() || target.value || '', // Trim whitespace
        htmlSnapshotId, // Attach the current HTML snapshot ID
        screenshotId // Attach the screenshot ID
    };

    // Save interaction in storage
    storeInteraction(interaction);
}

// Truncate classes to reduce verbosity
function truncateClasses(className) {
    if (!className) return '';
    const classes = className.split(' ');
    return classes[0]; // Use only the first class
}

// Function to store interactions
function storeInteraction(interaction) {
    chrome.storage.local.get(['interactions'], (result) => {
        const interactions = result.interactions || [];
        interactions.push(interaction);
        chrome.storage.local.set({ interactions }, () => {
            console.log("Interaction recorded:", interaction);
        });
    });
}

// Event Listeners for interactions
document.addEventListener("click", async (event) => {
    const target = event.target;
    const screenshotId = await captureScreenshot("click", target);
    captureInteraction("click", target, screenshotId);
});

document.addEventListener("blur", async (event) => {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
        const target = event.target;
        const screenshotId = await captureScreenshot("input", target);
        captureInteraction("input", target, screenshotId);
    }
}, true);

document.addEventListener("change", async (event) => {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
        const target = event.target;
        const screenshotId = await captureScreenshot("input", target);
        captureInteraction("input", target, screenshotId);
    }
});

document.addEventListener("scroll", async (event) => {
    const currentTime = Date.now();
    if (currentTime - lastScrollTime >= SCROLL_THRESHOLD) {
        lastScrollTime = currentTime;
        const target = event.target;
        const screenshotId = await captureScreenshot("scroll", target);
        captureInteraction("scroll", target, screenshotId);
    }
});

// Improved back action detection
let lastUrl = location.href;
window.addEventListener("popstate", async () => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl; // Update URL to prevent duplicate back actions
        const screenshotId = await captureScreenshot("back", document.body);
        captureInteraction("back", document.body, screenshotId);
    } else {
        console.log("Ignored duplicate back action.");
    }
});

// Listener for tab activation to update HTML snapshot
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "tabActivated") {
        initializeHtmlSnapshot();
    }
});
