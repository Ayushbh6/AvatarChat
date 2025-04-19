# Interactive Chat Avatar

A modern interactive avatar application built with D-ID's Agents SDK. This application allows users to interact with a digital human through text chat and speech recognition.

![Interactive Chat Avatar](./@AI_Logo.png)

## Features

- Interactive digital human avatar powered by D-ID's Agents SDK
- Real-time text chat with the AI agent
- Speech-to-text functionality using OpenAI's GPT-4o Transcription API
- Modern UI with animation and voice visualization
- Responsive design that works on multiple devices

## Prerequisites

- Node.js (v18 or higher)
- An OpenAI API key for speech-to-text capabilities
- D-ID account with Agent ID and Client Key

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd interactive-chat-avatar
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create an `.env` file in the root directory with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Configure D-ID credentials

Edit the `main.js` file and replace the placeholders with your D-ID credentials:

```javascript
// Line 6-10 in main.js
let agentId = "your_agent_id_here"
let auth = { type: 'key', clientKey: "your_client_key_here" };
```

You can get these credentials from the [D-ID Agents SDK Overview Page](https://docs.d-id.com/reference/agents-sdk-overview).

### 5. Start the development server

For frontend development:
```bash
npm run dev
```

For backend server (speech-to-text):
```bash
cd server
node server.js
```

### 6. Access the application

Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

- `index.html` - Main HTML structure
- `main.js` - Core application logic and D-ID Agents SDK integration
- `style.css` - Application styling
- `webSpeechAPI.js` - Handles audio recording and transcription
- `server/` - Backend server for OpenAI API integration
  - `server.js` - Express server with OpenAI API integration

## Deployment

This project is configured for deployment on Railway. Use the following command to build for production:

```bash
npm run build
```

## License

ISC

## More Information

For more details about D-ID's Agents SDK:
- [D-ID Agents SDK Documentation](https://docs.d-id.com/reference/agents-sdk-overview)