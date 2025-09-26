document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Setup - DOM Elements
  
  const chatBox = document.getElementById("chat");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const summarizeBtn = document.getElementById("summarizeBtn");
  const pageQuestion = document.getElementById("pageQuestion");
  const askPageBtn = document.getElementById("askPageBtn");
  const numbersBtn = document.getElementById("numbersBtn");
  const sentimentBtn = document.getElementById("sentimentBtn");
  const clearChatBtn = document.getElementById("clearChatBtn");
  const toggleThemeBtn = document.getElementById("toggleThemeBtn");

  
  // 2. API Key
  
  const OPENAI_API_KEY = "KEY";


  // 3. Helper Functions

  function addMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = "msg " + (sender === "You" ? "user" : "ai");
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function callOpenAI(prompt) {
    const model = document.getElementById("modelSelect").value;

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "openai_request",
          prompt: prompt,
          apiKey: OPENAI_API_KEY,
          model: model
        },
        (response) => {
          if (!response || !response.text) {
            resolve("Error: No response from background script.");
          } else {
            resolve(response.text);
          }
        }
      );
    });
  }

  
  // 4. Button Event Listeners
  

  // ---- Q&A ----
  sendBtn.addEventListener("click", async () => {
    const text = userInput.value.trim();
    if (text) {
      addMessage("You", text);
      userInput.value = "";

      addMessage("AI", "Thinking...");
      const reply = await callOpenAI(text);
      addMessage("AI", reply);
    }
  });

  // ---- Summarize Page ----
  summarizeBtn.addEventListener("click", () => {
    const style = document.getElementById("summaryStyle").value;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;

      chrome.scripting.executeScript(
        { target: { tabId: tabId }, files: ["content.js"] },
        () => {
          chrome.tabs.sendMessage(
            tabId,
            { type: "get_page_content" },
            async (response) => {
              if (response && response.content) {
                addMessage("You", "Summarize this page (" + style + ")");
                addMessage("AI", "Reading page...");

                let prompt = "";
                if (style === "bullets") {
                  prompt = "Summarize the following page content as short bullet points:\n\n";
                } else if (style === "detailed") {
                  prompt = "Provide a detailed summary of the following page content:\n\n";
                } else if (style === "eli5") {
                  prompt = "Explain the following page content in very simple terms, like explaining to a 5 year old:\n\n";
                }

                const reply = await callOpenAI(prompt + response.content);
                addMessage("AI", reply);
              } else {
                addMessage("AI", "Could not read page content.");
              }
            }
          );
        }
      );
    });
  });

  // ---- Extract Numbers ----
  numbersBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;

      chrome.scripting.executeScript(
        { target: { tabId: tabId }, files: ["content.js"] },
        () => {
          chrome.tabs.sendMessage(
            tabId,
            { type: "get_page_content" },
            async (response) => {
              if (response && response.content) {
                addMessage("You", "Extract numbers from page");
                addMessage("AI", "Scanning page...");

                const reply = await callOpenAI(
                  "From the following webpage content, extract ALL numbers (dates, percentages, statistics, money amounts, counts, etc.). " +
                  "For each number, include 3–6 words of context around it. If no numbers exist, say 'No numbers found.'\n\n" +
                  response.content
                );
                addMessage("AI", reply);
              } else {
                addMessage("AI", "Could not read page content.");
              }
            }
          );
        }
      );
    });
  });

  // ---- Sentiment Analysis ----
  sentimentBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;

      chrome.scripting.executeScript(
        { target: { tabId: tabId }, files: ["content.js"] },
        () => {
          chrome.tabs.sendMessage(
            tabId,
            { type: "get_page_content" },
            async (response) => {
              if (response && response.content) {
                addMessage("You", "Analyze sentiment of this page");
                addMessage("AI", "Reading page...");

                const reply = await callOpenAI(
                  "Analyze the sentiment of the following webpage content. " +
                  "Classify it as Positive, Negative, or Neutral, and explain briefly:\n\n" +
                  response.content
                );
                addMessage("AI", reply);
              } else {
                addMessage("AI", "Could not read page content.");
              }
            }
          );
        }
      );
    });
  });

  // ---- Ask Page Question ----
  askPageBtn.addEventListener("click", () => {
    const question = pageQuestion.value.trim();
    if (!question) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;

      chrome.scripting.executeScript(
        { target: { tabId: tabId }, files: ["content.js"] },
        () => {
          chrome.tabs.sendMessage(
            tabId,
            { type: "get_page_content" },
            async (response) => {
              if (response && response.content) {
                addMessage("You", "Page Q: " + question);
                addMessage("AI", "Checking page...");

                const reply = await callOpenAI(
                  "Based only on the following webpage content, answer this question: " +
                  question +
                  "\n\n" +
                  response.content +
                  "\n\nIf the answer is not in the page, reply: 'Not found in this page.'"
                );
                addMessage("AI", reply);
              } else {
                addMessage("AI", "Could not read page content.");
              }
            }
          );
        }
      );
    });
  });

  // ---- Clear Chat ----
  clearChatBtn.addEventListener("click", () => {
    chatBox.innerHTML = ""; // wipes chat history
    addMessage("AI", "Chat cleared.");
  });

  // ---- Toggle Theme ----
  document.body.classList.add("dark");
  toggleThemeBtn.textContent = "☀️ Light";
  toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      toggleThemeBtn.textContent = "☀️ Light";
    } else {
      toggleThemeBtn.textContent = "🌙 Dark";
    }
  });
});
