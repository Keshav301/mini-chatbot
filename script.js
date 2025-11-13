// --- Element Selectors ---
let prompt = document.querySelector("#prompt");
let submitbtn = document.querySelector("#submit");
let chatContainer = document.querySelector(".chat-container");
let voice = document.querySelector("#voice");
let ApiKey = "AIzaSyCGGRFNZGXtnOd0CGMDOz7DyCi6XQZ79Pg"; // !!! SECURITY WARNING: REPLACE THIS WITH YOUR KEY AND USE A PROXY FOR PRODUCTION !!!
let btn = document.getElementById("btn");
let imagebtn = document.querySelector("#image");
let image = document.querySelector("#image img");
let imageinput = document.querySelector("#image-input"); // Updated ID to match HTML

ApiKey = ApiKey.replace(/['"]+/g, "");

// Ensure your key is correct and your project is configured for the Gemini API
const Api_Url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ApiKey}`;

let user = {
    message: null,
    file: {
        mime_type: null,
        data: null,
    },
};

// ---------------- Gemini API ------------------

/**
 * Extracts the content of the first Markdown code block (```...```).
 * @param {string} response - The raw response text from the API.
 * @returns {string|null} The code content or null if not found.
 */
function extractFirstCodeBlock(response) {
    // Regex to find ```[language]\ncode\n```
    let codeBlockMatch = response.match(/```[\w]*([\s\S]*?)```/);
    return codeBlockMatch ? codeBlockMatch[1].trim() : null;
}

async function generateResponse(aiChatBox) {
    let text = aiChatBox.querySelector(".ai-chat-area");
    text.innerHTML = '<img src="load.webp" alt="Loading" class="load" width="50px">'; // Set loader immediately

    // Build parts dynamically (text + optional image)
    let parts = [{ text: user.message }];
    if (user.file.data) {
        parts.push({ inline_data: user.file });
    }

    let RequestOption = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts }],
        }),
    };

    try {
        let response = await fetch(Api_Url, RequestOption);
        let data = await response.json();

        if (!response.ok || !data.candidates || !data.candidates.length) {
            // Handle API error messages if available
            let errorMsg = data.error ? data.error.message : "No response from API or an error occurred.";
            text.innerHTML = `<p style="color:red;">Error: ${errorMsg}</p>`;
            return;
        }

        let apiResponse = data.candidates[0].content.parts[0].text || "";

        // --- IMPROVED FORMATTING LOGIC ---
        let extractedCode = extractFirstCodeBlock(apiResponse);

        if (extractedCode) {
            // If code is found, display it in a <pre> tag
            text.innerHTML = `<pre>${extractedCode}</pre>`;
        } else {
            // If no code block, apply basic text formatting
            // Replace **bold** with <strong>HTML bold</strong>
            apiResponse = apiResponse
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\n/g, "<br>");

            text.innerHTML = `<p>${apiResponse}</p>`;
        }

    } catch (error) {
        console.error("Fetch Error:", error);
        text.innerHTML = "An error occurred while fetching the response.";
    } finally {
        // Cleanup UI regardless of success or failure
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
        image.src = `img.svg`;
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
    if (!usermessage.trim() && !user.file.data) return; // Don't send empty message without an image

    user.message = usermessage.trim();

    // The user's message box HTML
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

    // Send AI response after a small delay
    setTimeout(() => {
        let html = `
            <img src="bot.png" alt="BOT" id="aiimg" width="10%">
            <div class="ai-chat-area">
                </div>`;
        let aiChatBox = createChatBox(html, "ai-chat-box");
        chatContainer.appendChild(aiChatBox);
        generateResponse(aiChatBox);
    }, 600);
}

// Event Listeners for Input
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
        handlechatResponse(transcript); // Handle input directly
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
    // Hide or disable voice button if API is not supported
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
        // Update the button icon to show the selected image
        image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
        image.classList.add("choose");
    };
    reader.readAsDataURL(file);
});

imagebtn.addEventListener("click", () => {
    imageinput.click(); // Trigger the hidden file input
});
