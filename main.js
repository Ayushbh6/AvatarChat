// CSS import
import './style.css'

// 1. Import the Agents SDK library
import * as sdk from "@d-id/client-sdk"
import './webSpeechAPI.js'

// 2. Paste the `data-agent-id' in the 'agentId' variable
let agentId = "agt_aD2k-ztV"

// 3. Paste the 'data-client-key' in the 'auth.clientKey' variable
let auth = { type: 'key', clientKey: "" };

// HTML Variables declaration
let videoElement = document.querySelector("#videoElement")
let textArea = document.querySelector("#textArea")
let speechButton = document.querySelector("#speechButton");
let answers = document.querySelector("#answers")
let connectionLabel = document.querySelector("#connectionLabel")
let chatButton = document.querySelector('#chatButton')
let speakButton = document.querySelector('#speakButton')
let reconnectButton = document.querySelector('#reconnectButton')
let srcObject

// 4. Define the SDK callbacks functions in this object
const callbacks = {

    // Link the HTML Video element with the WebRTC Stream Object (Video & Audio tracks)
    onSrcObjectReady(value) {
        console.log("onSrcObjectReady():", value)
        videoElement.srcObject = value
        srcObject = value
        return srcObject
    },

    // Connection States callback method
    onConnectionStateChange(state) {

        console.log("onConnectionStateChange(): ", state)

        if (state == "connecting") {
            connectionLabel.innerHTML = "Connecting.."
            document.querySelector("#container").style.display = "flex"
            document.querySelector("#hidden").style.display = "none"
        }

        else if (state == "connected") {
            // Setting the 'Enter' Key to Send a message
            textArea.addEventListener('keypress', (event) => { 
                if (event.key === "Enter" && !event.shiftKey) { 
                    event.preventDefault(); 
                    chat(); 
                } 
            })
            chatButton.removeAttribute("disabled")
            speakButton.removeAttribute("disabled")
            speechButton.removeAttribute("disabled")
            connectionLabel.innerHTML = "Online"
        }

        else if (state == "disconnected" || state == "closed") {
            textArea.removeEventListener('keypress', (event) => { if (event.key === "Enter") { event.preventDefault(); chat() } })
            document.querySelector("#hidden_h2").innerHTML = `${agentManager.agent.preview_name} Disconnected`
            document.querySelector("#hidden").style.display = "block"
            document.querySelector("#container").style.display = "none"
            chatButton.setAttribute("disabled", true)
            speakButton.setAttribute("disabled", true)
            speechButton.setAttribute("disabled", true)
            connectionLabel.innerHTML = ""
        }
    },

    // Switching between the idle and streamed videos
    onVideoStateChange(state) {
      console.log("onVideoStateChange(): ", state)
      if (state == "STOP") {
          videoElement.muted = true
          videoElement.srcObject = undefined
          videoElement.src = agentManager.agent.presenter.idle_video
      }
      else {
          videoElement.muted = false
          videoElement.src = ""
          videoElement.srcObject = srcObject
          connectionLabel.innerHTML = "Online"
      }
  },

    // New messages callback method
    onNewMessage(messages, type) {
        console.log("onNewMessage():", messages, type)
        // We want to show only the last message from the entire 'messages' array
        let lastIndex = messages.length - 1
        let msg = messages[lastIndex]

        // Only add the message if it's a new message (type is 'answer' for assistant or it's a user message)
        if ((msg.role === 'assistant' && type === 'answer') || msg.role === 'user') {
            // Format the message based on role
            answers.innerHTML += `
                <div class="message ${msg.role}">
                    <div class="message-content">${msg.content}</div>
                </div>
            `;

            // Auto-scroll to the last message 
            answers.scrollTop = answers.scrollHeight;
            
            // If this is a new message and chat container is not active, make it active
            if (!document.querySelector('.chat-container').classList.contains('active')) {
                document.querySelector('.chat-container').classList.add('active');
            }
        }
    },

    // Error handling
    onError(error, errorData) {
        connectionLabel.innerHTML = `<span style="color:red">Something went wrong :(</span>`
        console.log("Error:", error, "Error Data", errorData)
    }

}

// 5. Define the Stream options object (Optional)
let streamOptions = { compatibilityMode: "auto", streamWarmup: true }

// Local functions to utilize the Agent's SDK methods:

// agentManager.speak() -> Streaming API (Bring your own LLM)
function speak() {
    let val = textArea.value
    // Speak supports a minimum of 3 characters
    if (val !== "" && val.length > 2) {
        let speak = agentManager.speak(
            {
                type: "text",
                input: val
            }
        )
        console.log(`agentManager.speak("${val}")`)
        connectionLabel.innerHTML = "Streaming.."
        textArea.value = ""
        
        // Hide the input div after sending
        document.querySelector('.inputsDiv').classList.remove('active')
    }
}

// agentManager.chat() -> Agents API (communicating with your created Agent and its knowledge -> Streams back the D-ID's LLM response)
function chat() {
    let val = textArea.value
    if (val !== "") {
        // Send to agent and get response
        let chat = agentManager.chat(val)
        console.log("agentManager.chat()")
        connectionLabel.innerHTML = "Thinking.."
        textArea.value = ""
        
        // Hide the input div after sending
        document.querySelector('.inputsDiv').classList.remove('active')
        
        // Ensure the chat container is visible to show the response
        document.querySelector('.chat-container').classList.add('active')
    }
}

// agentManager.rate() -> Rating the Agent's answers - for future Agents Analytics and Insights feature
function rate(messageID, score) {
    let rate = agentManager.rate(messageID, score)
    console.log(`Message ID: ${messageID} Rated:${score}\n`, "Result", rate)
}

// agentManager.reconnect() -> Reconnect the Agent to a new WebRTC session
function reconnect() {
    console.log("clicked")
    let reconnect = agentManager.reconnect()
    console.log("agentManager.reconnect()", reconnect)
}

// agentManager.disconnect() -> Terminates the current Agent's WebRTC session (Not implemneted in this code example)
function disconnect() {
    let disconnect = agentManager.disconnect()
    console.log("agentManager.disconnect()", disconnect)
}

// JS Utility Functions: 
// 'cleaner' time display in (HH:MM:SS)
function timeDisplay() {
    const currentTime = new Date();
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const seconds = currentTime.getSeconds().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}:${seconds}`;
    return formattedTime;
}

// Reminder to place Agent ID and Client Key at the top of this file
if (agentId == "" || auth.clientKey == "") {
    connectionLabel.innerHTML = `<span style='color:red; font-weight:bold'> Missing agentID and auth.clientKey variables</span>`

    console.error("Missing agentID and auth.clientKey variables")
    console.log(`Missing agentID and auth.clientKey variables:\n\nFetch the data-client-key and the data-agent-id as explained on the Agents SDK Overview Page:\nhttps://docs.d-id.com/reference/agents-sdk-overview\n\nPaste these into their respective variables at the top of the main.js file and save.`)
}

// Refresh function to reset agent and chat session
function refreshSession() {
    // Clear chat messages
    answers.innerHTML = '';
    // Disconnect current session
    agentManager.disconnect();
    // Reconnect to create new session
    agentManager.connect();
}

// Volume toggle function
function toggleVolume() {
    const volumeButton = document.querySelector('#volumeButton');
    if (videoElement.muted) {
        videoElement.muted = false;
        volumeButton.querySelector('.material-symbols-outlined').textContent = 'volume_up';
    } else {
        videoElement.muted = true;
        volumeButton.querySelector('.material-symbols-outlined').textContent = 'volume_off';
    }
}

// Event Listeners for Agent's built-in methods
chatButton.addEventListener('click', () => {
    // Toggle the input div visibility
    document.querySelector('.inputsDiv').classList.toggle('active')
    if (document.querySelector('.inputsDiv').classList.contains('active')) {
        textArea.focus()
    }
})
speakButton.addEventListener('click', () => chat())
reconnectButton.addEventListener('click', () => reconnect())

// Add refresh button listener
document.querySelector('#refreshButton').addEventListener('click', refreshSession);
// Add volume button listener
document.querySelector('#volumeButton').addEventListener('click', toggleVolume);

// Initialize collapse button functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Collapse Button Listener...'); // New log message for clarity

    const chatContainer = document.querySelector('.chat-container');
    const collapseButton = document.getElementById('collapseButton');

    // Log whether elements were found
    console.log('Chat Container Element:', chatContainer);
    console.log('Collapse Button Element:', collapseButton);

    if (!chatContainer || !collapseButton) {
        console.error('ERROR: Chat container or collapse button not found! Cannot attach listener.');
        return; // Stop if elements aren't found
    }

    const icon = collapseButton.querySelector('.material-symbols-outlined');
    if (!icon) {
        console.error('ERROR: Collapse button icon not found!');
        // Optionally return, or allow button to function without icon change
    }

    // Helper to update icon and button class based on the 'active' class
    const updateButtonState = () => {
        const isActive = chatContainer.classList.contains('active');
        if (icon) {
            icon.textContent = isActive ? 'chevron_right' : 'chevron_left';
        }
        // Add/remove the positioning class for the button
        if (isActive) {
            collapseButton.classList.add('chat-active-button');
        } else {
            collapseButton.classList.remove('chat-active-button');
        }
        console.log('Button state updated. Is active:', isActive);
    };

    // Determine initial state (start expanded on desktop, collapsed on mobile)
    if (window.innerWidth > 768) {
        chatContainer.classList.add('active');
    }
    updateButtonState(); // Set initial state

    // Attach the click listener
    collapseButton.addEventListener('click', () => {
        console.log('Collapse button CLICKED!'); // Log click
        chatContainer.classList.toggle('active');
        updateButtonState(); // Update the button state based on the new container state
    });
    console.log('Collapse button click listener ATTACHED.');

    // Resize listener
    window.addEventListener('resize', () => {
        let stateChanged = false;
        if (window.innerWidth <= 768) {
            if (chatContainer.classList.contains('active')) {
                 chatContainer.classList.remove('active');
                 stateChanged = true;
            }
        } else {
            // Optional: Automatically re-open on resize to desktop?
            // if (!chatContainer.classList.contains('active')) {
            //     chatContainer.classList.add('active');
            //     stateChanged = true;
            // }
        }
        if (stateChanged) {
            console.log('Chat container state changed on resize.');
            updateButtonState(); // Update button state on resize too
        }
    });
    console.log('Resize listener for chat container ATTACHED.');
});

// *** Finally ***
// 6. Create the 'agentManager' instance with the values created in previous steps
let agentManager = await sdk.createAgentManager(agentId, { auth, callbacks, streamOptions });

console.log("sdk.createAgentManager()", agentManager)

// Displaying the Agent's name in the HTML Header
document.querySelector("#previewName").innerHTML = agentManager.agent.preview_name

// Setting the thumbnail as the video background image to avoid "flickering".
// Set one of the following (depends on the Avatar's type): agentManager.agent.presenter.source_url / agentManager.agent.presenter.thumbnail
document.querySelector("#videoElement").style.backgroundImage = `url(${agentManager.agent.presenter.source_url})`

// agentManager.connect() method -> Creating a new WebRTC session and connecting it to the Agent
console.log("agentManager.connect()")
agentManager.connect()

// Happy Coding! 
