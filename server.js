const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { GoogleGenAI, Modality } = require('@google/genai');

const app = express();
app.use(express.static(path.join(__dirname))); // Serve static files from the root directory

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('Missing GOOGLE_API_KEY (or GEMINI_API_KEY) in environment.');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash-native-audio-preview-09-2025';

wss.on('connection', (ws) => {
    console.log('Client connected via WebSocket');
    let geminiSession;

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.action === 'start') {
                console.log('Starting Gemini Live session');
                const config = {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
                        },
                    },
                };

                geminiSession = await ai.live.connect({
                    model,
                    config,
                    callbacks: {
                        onopen: () => console.log('[gemini] onopen'),
                        onmessage: (response) => {
                            if (response.serverContent && response.serverContent.modelTurn) {
                                for (const part of response.serverContent.modelTurn.parts) {
                                    if (part.inlineData && part.inlineData.data) {
                                        const audioData = part.inlineData.data;
                                        // Send audio data back to client
                                        ws.send(JSON.stringify({ type: 'audio', data: audioData }));
                                    }
                                    if (part.text) {
                                        console.log('[gemini] text:', part.text);
                                    }
                                }
                            }
                        },
                        onerror: (e) => console.error('[gemini] onerror:', e),
                        onclose: () => console.log('[gemini] onclose'),
                    },
                });

                // Send the initial prompt
                geminiSession.sendClientContent({
                    turns: [data.prompt]
                });

            } else if (data.action === 'audio' && geminiSession) {
                // Relay audio from client to Gemini, converting from base64 to a Buffer
                const audioBuffer = Buffer.from(data.audio, 'base64');
                geminiSession.sendClientContent({
                    audio: [audioBuffer]
                });
            } else if (data.action === 'stop' && geminiSession) {
                console.log('Stopping Gemini Live session');
                geminiSession.close();
                geminiSession = null;
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (geminiSession) {
            geminiSession.close();
        }
    });
});


// Add a simple route to serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'v5', 'v5_realtime_interpretation.html'));
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
