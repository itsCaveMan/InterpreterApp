






// run with: 
// node geminiNativeAudioTest - working.js






















'use strict';

// Minimal script to attempt a Live session to the native-audio preview model
// Requires: npm install @google/genai

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function main() {
  // Support either GOOGLE_API_KEY or GEMINI_API_KEY
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Missing GOOGLE_API_KEY (or GEMINI_API_KEY) in environment.');
    process.exit(1);
  }

  const { GoogleGenAI, Modality, MediaResolution } = require('@google/genai');

  const model = 'models/gemini-2.5-flash-native-audio-preview-09-2025';

  const ai = new GoogleGenAI({ apiKey });

  const config = {
    responseModalities: [Modality.AUDIO],
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: 'Zephyr' },
      },
    },
    contextWindowCompression: {
      triggerTokens: '25600',
      slidingWindow: { targetTokens: '12800' },
    },
  };

  console.log('Connecting to Live API...', { model });

  let session;
  let resolveTurn;
  let rejectTurn;
  const turnPromise = new Promise((resolve, reject) => {
    resolveTurn = resolve;
    rejectTurn = reject;
  });
  const turnTimeoutMs = 15000;
  let turnTimeout;

  const aggregated = { text: '', audioChunks: 0, audioMime: null };
  try {
    session = await ai.live.connect({
      model,
      config,
      callbacks: {
        onopen() {
          console.log('[live] onopen');
        },
        onmessage(message) {
          try {
            const sc = message && message.serverContent ? message.serverContent : null;
            if (sc && sc.modelTurn && Array.isArray(sc.modelTurn.parts)) {
              for (const part of sc.modelTurn.parts) {
                if (part && typeof part.text === 'string') {
                  aggregated.text += part.text;
                }
                const inline = part && part.inlineData ? part.inlineData : null;
                if (inline && inline.data) {
                  aggregated.audioChunks += 1;
                  if (!aggregated.audioMime && inline.mimeType) aggregated.audioMime = inline.mimeType;
                }
              }
            }

            if (sc && sc.turnComplete) {
              console.log('[live] turnComplete');
              if (turnTimeout) clearTimeout(turnTimeout);
              if (resolveTurn) resolveTurn();
            }
          } catch (e) {
            console.log('[live] message (unparsed)');
          }
        },
        onerror(e) {
          console.error('[live] onerror:', e && e.message ? e.message : e);
        },
        onclose(e) {
          const reason = (e && (e.reason || e.code)) || 'closed';
          console.log('[live] onclose:', reason);
          // Exit once closed
          setTimeout(() => process.exit(0), 50);
        },
      },
    });
  } catch (err) {
    console.error('Failed to create session:', err && err.message ? err.message : err);
    process.exit(2);
  }

  // Wait for the turn to complete (or timeout), then close session
  try {
    // Kick off a simple text turn after session is available
    try {
      session.sendClientContent({
        turns: [
          'Please say a brief greeting in Korean, and include an English translation.'
        ]
      });
      // Safety timeout in case turnComplete never arrives
      turnTimeout = setTimeout(() => {
        if (rejectTurn) rejectTurn(new Error('Timed out waiting for turnComplete'));
      }, turnTimeoutMs);
    } catch (e) {
      console.error('[live] failed to send turn:', e && e.message ? e.message : e);
      if (rejectTurn) rejectTurn(e);
    }

    await turnPromise;
    console.log('[live] aggregated text length:', aggregated.text.length);
    if (aggregated.text) {
      console.log('[live] text sample:', aggregated.text.slice(0, 120));
    }
    if (aggregated.audioChunks > 0) {
      console.log('[live] received audio chunks:', aggregated.audioChunks, 'mime:', aggregated.audioMime || '(unknown)');
    }
  } catch (e) {
    console.error('[live] turn wait failed:', e && e.message ? e.message : e);
  } finally {
    try {
      console.log('[live] closing');
      session.close();
    } catch (_) {}
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e && e.message ? e.message : e);
  process.exit(3);
});


