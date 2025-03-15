let prompt=document.querySelector("#prompt")
let submitbtn=document.querySelector("#submit")
let chatContainer=document.querySelector(".chat-container")
let voice=document.querySelector("#voice")
let ApiKey="AIzaSyBnDgh9666xaM8BLzQbNDDW-KjBjMCGVrA";
let btn = document.getElementById("btn")
let imagebtn=document.querySelector("#image")
let image=document.querySelector("#image img")
let imageinput= document.querySelector("#image input")
ApiKey = ApiKey.replace(/['"]+/g, '');

const Api_Url=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ApiKey}`;
let user={
    message:null,
    file:{
        mime_type:null,
        data:null
    }

}

async function generateResponse(aiChatBox) {
    let text = aiChatBox.querySelector(".ai-chat-area");

    let RequestOption = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            "contents": [
                { "parts": [{ "text": user.message },(user.file.data?[{"inline_data":user.file}]:[])] }
            ]
        })
    };

    try {
        let response = await fetch(Api_Url, RequestOption);
        let data = await response.json();
        let apiResponse = data.candidates[0].content.parts[0].text;
        
        apiResponse = apiResponse.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\. /g, ".<br><br>"); //.replace(/\*/g, "").trim(); //"add for rwmove single*"
        // let apiResponse=data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,"$1").trim()
        let extractedCode = extractFirstCodeBlock(apiResponse);

        if (extractedCode) {
            text.innerHTML = `<pre>${extractedCode}</pre>`;
        } else {
            text.innerHTML = `<p>${apiResponse}</p>`;
        }

    } catch (error) {
        console.log(error);
        text.innerHTML = "An error occurred while fetching the response.";
    } finally {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
        image.src=`img.svg`
        image.classList.remove("choose")
        user.file={}
    }
}

function extractFirstCodeBlock(response) {
    let codeBlockMatch = response.match(/```[\w]*([\s\S]*?)```/);
    return codeBlockMatch ? codeBlockMatch[1].trim() : null;
}




// ___________________________________________


function createChatBox(html,classes){
    let div=document.createElement("div")
    div.innerHTML=html
    div.classList.add(classes)
    return div
}

function handlechatResponse(usermessage){
    user.message=usermessage
    let html=`<img src="user.png" alt="USER" id="userimg" width="8%">
            <div class="user-chat-area">
            ${user.message}
            ${user.file.data?`<img src="data:${user.file.mime_type};base64,${user.file.data}"class="chooseimg" />`:""}
            </div>`
            prompt.value=""
            let userChatBox=createChatBox(html,"user-chat-box")
            chatContainer.appendChild(userChatBox)

            chatContainer.scrollTo({top:chatContainer.scrollHeight,behavior:"smooth"})


 setTimeout(()=>{
    let html=`<img src="bot.png" alt="BOT" id="aiimg" width="10%">
            <div class="ai-chat-area">
             <img src="load.webp" alt="" class="load" width="50px">
            </div>`
            let aiChatBox=createChatBox(html,"ai-chat-box")
            chatContainer.appendChild(aiChatBox)
            generateResponse(aiChatBox)
  },600)
}

prompt.addEventListener("keydown",(e)=>{
    if(e.key=="Enter"){
        handlechatResponse(prompt.value)
    }
})
submitbtn.addEventListener("click",()=>{
    handlechatResponse(prompt.value)
})

//-----------------------------------------------------------------------------------------------------------------------
//mic input section
let speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new speechRecognition();

recognition.onresult = (event) => {
    let currentIndex = event.resultIndex;
    let transcript = event.results[currentIndex][0].transcript;
    prompt.innerText = transcript;
    let micPrompt = transcript.toLowerCase();
    prompt.value = micPrompt;
    handlechatResponse(micPrompt);
    // console.log(micPrompt);
     
};
btn.addEventListener("click",function(){
    btn.classList.add("c");
})

btn.addEventListener("click", () => {
    recognition.start();
    voice.style.display = "block";
    btn.style.display = "none";
});

recognition.onspeechend = () => {
    console.log("Speech ended due to silence");
    recognition.stop();
    voice.style.display = "none";
    btn.style.display = "block";
};

btn.addEventListener("click", function () {
    recognition.onspeechend = function () {
        btn.classList.remove("c");
    };
});

//--------------------------------------------------------------------------------------------------------------------

imageinput.addEventListener("change",()=>{
    const file=imageinput.files[0]
    if(!file) return
    let reader=new FileReader()
    reader.onload=(e)=>{
        let base64string=e.target.result.split(",")[1]
        user.file={
            mime_type:file.type,
            data:base64string
        }
     image.src=`data:${user.file.mime_type};base64,${user.file.data}`
     image.classList.add("choose")
    }
   
    reader.readAsDataURL(file)
})

imagebtn.addEventListener("click",()=>{
    imagebtn.querySelector("input").click()
})
