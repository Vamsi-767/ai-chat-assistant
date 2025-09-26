chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "openai_request") {
    (async () => {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${request.apiKey}`
          },
          body: JSON.stringify({
            model: request.model || "gpt-3.5-turbo",
            messages: [{ role: "user", content: request.prompt }],
            max_tokens: 200})

        });

        const data = await response.json();
        console.log("OpenAI API raw response:", data);

        if (data.choices && data.choices.length > 0) {
          sendResponse({ text: data.choices[0].message.content.trim() });
        } else if (data.error) {
          sendResponse({ text: "API Error: " + data.error.message });
        } else {
          sendResponse({ text: "Unexpected API response" });
        }
      } catch (err) {
        console.error("Background fetch failed:", err);
        sendResponse({ text: "Network error: " + err.message });
      }
    })();

    // 👇 Important: keeps the message channel open until async work finishes
    return true;
  }
});
