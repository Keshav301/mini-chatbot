// --- Imports ---
import OpenAI from "openai";

// --- Element Selectors ---
let prompt = document.querySelector("#prompt");
let submitbtn = document.querySelector("#submit");
let chatContainer = document.querySelector(".chat-container");
let voice = document.querySelector("#voice");
let btn = document.getElementById("btn");
let imagebtn = document.querySelector("#image");
let image = document.querySelector("#image img");
let imageinput = document.querySelector("#image-input");

// --- Initialize Gemini (OpenAI-compatible) ---
const openai = new OpenAI({
  apiKey: "AIzaSyCKQfNuDyX7nGLaJLrTYDFZDrWfnm3AY0o", // Replace with your real API key
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// --- User Object ---
let user = {
  message: null,
  file: {
    mime_type: null,
    data: null,
  },
};

// ---------------- Gemini API (OpenAI SDK) ------------------

/**
 * Extracts the content of the first Markdown code block (```...```).
 * @param {string} response - The raw response text from the API.
 * @returns {string|null} The code content or null if not found.
 */
function extractFirstCodeBlock(response) {
  let codeBlockMatch = response.match(/```[\w]*([\s\S]*?)```/);
  return codeBlockMatch ? codeBlockMatch[1].trim() : null;
}

async function generateResponse(aiChatBox) {
  let text = aiChatBox.querySelector(".ai-chat-area");
  text.innerHTML = '<img src="load.webp" alt="Loading" class="load" width="50px">';

  try {
    // --- Build message parts ---
    let messages = [{ role: "user", content: user.message }];

    // If image attached
    if (user.file.data) {
      messages.push({
        role: "user",
        content: [
          {
            type: "input_text",
            text: user.message || "Analyze this image",
          },
          {
            type: "input_image",
            image_data: user.file.data,
            mime_type: user.file.mime_type,
          },
        ],
      });
    }

    // --- Send to Gemini API ---
    const response = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages,
    });

    const apiResponse = response.choices[0].message.content || "";

    // --- Formatting ---
    const extractedCode = extractFirstCodeBlock(apiResponse);

    if (extractedCode) {
      text.innerHTML = `<pre>${extractedCode}</pre>`;
    } else {
      text.innerHTML = `<p>${apiResponse
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>")}</p>`;
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    text.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
  } finally {
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
    image.src = "img.svg";
    image.classList.remove("choose");
    user.file = { mime_type: null, data: null };
  }
}

// ---------------- Chat UI ------------------

function createChatBox(html, classes) {
  let div = document.createElement("div");
  div.innerHTML = html;
  div.classList.add(classes);
  return div;
}

function handlechatResponse(usermessage) {
  if (!usermessage.trim() && !user.file.data) return;

  user.message = usermessage.trim();

  // User chat HTML
  let html = `
    <img src="user.png" alt="USER" id="userimg" width="8%">
    <div class="user-chat-area">
      ${user.message || "<em>(Image only message)</em>"}
      ${
        user.file.data
          ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />`
          : ""
      }
    </div>`;

  prompt.value = "";
  let userChatBox = createChatBox(html, "user-chat-box");
  chatContainer.appendChild(userChatBox);
  chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });

  // Add AI chat after small delay
  setTimeout(() => {
    let html = `
      <img src="bot.png" alt="BOT" id="aiimg" width="10%">
      <div class="ai-chat-area"></div>`;
    let aiChatBox = createChatBox(html, "ai-chat-box");
    chatContainer.appendChild(aiChatBox);
    generateResponse(aiChatBox);
  }, 600);
}

// ---------------- Event Listeners ------------------

prompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handlechatResponse(prompt.value);
});

submitbtn.addEventListener("click", () => handlechatResponse(prompt.value));

// ---------------- Speech Recognition ------------------

let speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (speechRecognition) {
  let recognition = new speechRecognition();

  recognition.onresult = (event) => {
    let transcript = event.results[event.resultIndex][0].transcript;
    prompt.value = transcript;
    handlechatResponse(transcript);
  };

  btn.addEventListener("click", () => {
    btn.classList.add("c");
    recognition.start();
    voice.style.display = "block";
    btn.style.display = "none";
  });

  recognition.onspeechend = () => {
    recognition.stop();
    btn.classList.remove("c");
    voice.style.display = "none";
    btn.style.display = "block";
  };
} else {
  btn.style.display = "none";
}

// ---------------- Image Upload ------------------

imageinput.addEventListener("change", () => {
  const file = imageinput.files[0];
  if (!file) return;

  let reader = new FileReader();
  reader.onload = (e) => {
    let base64string = e.target.result.split(",")[1];
    user.file = {
      mime_type: file.type,
      data: base64string,
    };
    image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
    image.classList.add("choose");
  };
  reader.readAsDataURL(file);
});

imagebtn.addEventListener("click", () => {
  imageinput.click();
});
