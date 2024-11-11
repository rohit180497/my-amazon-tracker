chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.action === "storeData") {
            chrome.storage.local.get({ interactions: [] }, (result) => {
                console.log("Interactions data:", result);

                const interactions = result.interactions;
                interactions.push(message.data);
                chrome.storage.local.set({ interactions });
            });
        }
    }
    catch {
        chrome.storage.local.get("interactions", (result) => {
            console.log("Interactions data:", result.interactions);
        });

    }


});
