let data = {
  searchText: "",
  clicks: [],
  scrolls: [],
  timeOnPage: 0,
  reviewsClicks: [],
  cartAdditions: [],
};

let pageEntryTime = Date.now();
let lastScrollTime = Date.now();

// Helper function to convert milliseconds to readable format
function formatTime(ms) {
  const date = new Date(ms);
  return date.toLocaleString(); // Outputs in "YYYY-MM-DD HH:MM:SS" format based on local timezone
}

// Track search box input
const searchBox = document.getElementById("twotabsearchtextbox");
if (searchBox) {
  searchBox.addEventListener("input", (event) => {
    data.searchText = event.target.value;  // Capture text as user types
  });

  // Capture search submission on 'Enter' key press
  searchBox.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      logSearchAction();
    }
  });
}

// Track search submission on search button click
const searchButton = document.querySelector("input[type='submit']");
if (searchButton) {
  searchButton.addEventListener("click", logSearchAction);
}

function logSearchAction() {
  const searchTime = formatTime(Date.now());
  data.clicks.push({
    time: searchTime,
    type: "searchClick",
    text: data.searchText,  // Store the search text with the click event
  });
}

// Track other click events
document.addEventListener("click", (event) => {
  const target = event.target;
  const clickTime = formatTime(Date.now());

  if (target.classList.contains("s-image") || target.classList.contains("a-size-mini a-spacing-none a-color-base s-line-clamp-2")) {
    data.clicks.push({ time: clickTime, type: "itemClick" });
  } else if (target.classList.contains("a-button-input") || target.classList.contains("a-native-dropdown a-declarative")) {
    data.clicks.push({ time: clickTime, type: "sizeSelection" });
  } else if (target.classList.contains("a-size-base") && target.textContent.includes("ratings")) {
    data.reviewsClicks.push({ time: clickTime, type: "reviewClick" });
  } else if (target.classList.contains("a-declarative")) {
    data.clicks.push({ time: clickTime, type: "filterClick" });
  } else if (target.id === "add-to-cart-button") {
    data.cartAdditions.push({ time: clickTime, type: "addToCart" });
  } else if (target.id === "buy-now-button") {
    data.clicks.push({ time: clickTime, type: "buyNowClick" });
  }
});

// Track scroll events to specific sections
document.addEventListener("scroll", () => {
  const now = Date.now();
  const scrollDuration = now - lastScrollTime;

  // Check if user is scrolling to specific sections
  if (isInViewPort(document.querySelector("Similar brands on Amazon"))) {
    data.scrolls.push({ time: now, type: "scrollToSimilarBrands", duration: scrollDuration });
  } else if (isInViewPort(document.querySelector("Related products"))) {
    data.scrolls.push({ time: now, type: "scrollToRelatedProducts", duration: scrollDuration });
  } else if (isInViewPort(document.querySelector("Product details"))) {
    data.scrolls.push({ time: now, type: "scrollToProductDetails", duration: scrollDuration });
  }

  lastScrollTime =formatTime(now);
});

// Helper function to check if an element is in the viewport
function isInViewPort(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Track time spent on the page
window.addEventListener("beforeunload", () => {
  data.timeOnPage = Date.now() - pageEntryTime;
  sendData();
});

// Send data to the background script every minute
setInterval(sendData, 1000);

function sendData() {
  chrome.runtime.sendMessage({ action: "storeData", data });
  // Reset data after each send
  data.clicks = [];
  data.scrolls = [];
  data.reviewsClicks = [];
  data.cartAdditions = [];
}
