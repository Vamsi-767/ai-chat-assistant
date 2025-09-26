function getPageContent() {
  return document.body.innerText || "";
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "get_page_content") {
    sendResponse({ content: getPageContent() });
  }
});
