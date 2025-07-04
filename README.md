# OpenAI Realtime Voice Assistant

A modern web application that enables real-time voice conversations with OpenAI's GPT-4 using the Realtime API and WebRTC.

## Recent Updates (Authentication Fix)

**Issue Fixed**: The original WebSocket implementation was failing with "API Error: Missing bearer or basic authentication in header" because browser WebSocket APIs cannot set custom headers like `Authorization`.

**Solution**: Updated to use OpenAI's WebRTC endpoint, which is the recommended approach for browser-based applications. This provides:
- Proper authentication support
- Lower latency audio streaming  
- Native browser media handling
- Better error handling

## Features

- 🎙️ Real-time voice-to-voice conversations with AI
- 🔊 Audio visualization and volume monitoring
- 💬 Text transcription display
- 🎯 Configurable AI voice and settings
- 🔐 Secure API key handling with local storage
- 📱 Responsive web interface

## How It Works

### WebRTC Architecture
The application now uses WebRTC instead of WebSocket for several advantages:

1. **Proper Authentication**: WebRTC endpoint accepts Bearer tokens in HTTP headers
2. **Native Audio**: Browser handles audio encoding/decoding automatically
3. **Lower Latency**: Direct peer-to-peer audio streaming
4. **Better Error Handling**: More robust connection management

### Technical Flow
1. **Audio Capture**: Uses `getUserMedia()` to access microphone
2. **WebRTC Setup**: Creates `RTCPeerConnection` with data channel for control messages
3. **Authentication**: Sends SDP offer to OpenAI with Bearer token in Authorization header
4. **Connection**: Establishes secure WebRTC connection for audio and data
5. **Real-time Chat**: Audio streams directly while control messages use data channel

## Quick Start

1. **Get OpenAI API Key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)

2. **Open the Application**: Simply open `2wayInterpretation.html` in a modern web browser

3. **Enter API Key**: Paste your OpenAI API key in the input field

4. **Start Talking**: Click "Connect" and allow microphone access

## File Structure

- `2wayInterpretation.html` - Main application (WebRTC implementation)
- `index.html` - Basic HTML page
- `inputOutputDevicesTest.html` - Audio device testing utility

## Browser Requirements

- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- HTTPS connection (required for microphone access)
- Microphone permissions

## API Usage

The application uses:
- **OpenAI Realtime API** (`gpt-4o-realtime-preview-2024-10-01`)
- **WebRTC endpoint**: `https://api.openai.com/v1/realtime?model=...`
- **Authentication**: Bearer token in Authorization header

## Configuration Options

The application supports various settings:
- AI voice selection (alloy, echo, fable, onyx, nova, shimmer)
- Audio processing (echo cancellation, noise suppression)
- Session instructions and temperature
- Turn detection sensitivity

## Troubleshooting

**Connection Issues**:
- Ensure valid OpenAI API key
- Check browser console for detailed errors
- Verify microphone permissions
- Use HTTPS (required for WebRTC)

**Audio Issues**:
- Check microphone access permissions
- Test with `inputOutputDevicesTest.html`
- Ensure speakers/headphones are working

**API Errors**:
- Verify API key has Realtime API access
- Check OpenAI account usage limits
- Ensure stable internet connection

## Technical Notes

### Authentication Evolution
- **Old**: WebSocket with protocol-based auth (failed in browsers)
- **New**: WebRTC with HTTP header auth (browser-compatible)

### Audio Processing
- **Input**: Native WebRTC audio encoding
- **Output**: Browser-native audio playback
- **Visualization**: Web Audio API for visual feedback

### Message Protocol
- **Control Messages**: JSON over WebRTC data channel
- **Audio Stream**: Direct WebRTC media channels
- **Events**: Same protocol as WebSocket API

## Security Considerations

- API keys stored in browser localStorage (consider server-side auth for production)
- WebRTC provides end-to-end encryption
- No audio data stored locally
- Session management with automatic cleanup

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome  | ✅ Full | Recommended |
| Firefox | ✅ Full | Works well |
| Safari  | ✅ Full | Requires recent version |
| Edge    | ✅ Full | Chromium-based versions |

## Development

The application is a single HTML file with embedded JavaScript for simplicity. For production use, consider:
- Separating HTML, CSS, and JavaScript
- Server-side API key management
- Error logging and monitoring
- Progressive Web App features

## Contributing

Feel free to submit issues and pull requests. Areas for improvement:
- Enhanced error handling
- Additional voice controls
- Mobile optimization
- Server-side authentication proxy

## License

This project is open source. Please check OpenAI's terms for API usage.

