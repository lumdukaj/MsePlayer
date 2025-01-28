# VpMsePlayer

`VpMsePlayer` is a JavaScript library for creating and managing video players with the capability of playing MSE video formats. It simplifies video playback setup and provides built-in live/offline status detection and customizable player options.

---

## Features

- **Status Detection**: Automatically detects live or offline status for streams.
- **Customizable**: Configure player size, controls, and other behaviors.
- **Event Hooks**: Easily integrate player events into your application.

---

## Installation

Install the package via npm:

```bash
npm install vp-mse-player
```

---

## Usage

### Basic Example

```javascript
import VpMsePlayer from "vp-mse-player";

const player = new VpMsePlayer(
	"video-container", // ID of the HTML container
	"https://your-stream-url.com/stream", // Stream URL
	{}, // Options
	{} // Configuration
);

// Start playback
player.play();
```

---

## API Reference

### Constructor

```javascript
new VpMsePlayer(elementId, streamUrl, options, config);
```

- `elementId` (string, required): ID of the HTML element to contain the player.
- `streamUrl` (string, required): URL of the video stream.
- `options` (object, optional).
  - Default: `{ progressUpdateTime: 750 }`.
- `config` (object, optional): Configuration for the player.
  - `size` (object): `{ width: "100%", height: "100%" }` (default).
  - `controls` (boolean): Whether to show native video controls (default: `true`).

---

### Methods

#### `play()`

Starts video playback.

#### `pause()`

Pauses video playback.

#### `stop()`

Stops video playback and resets the player.

#### `restart()`

Restarts the video playback.

#### `destroy()`

Destroys the player and cleans up resources.

#### `setVolume(volume)`

Sets the player volume.

- `volume` (number): A value between `0` (muted) and `1` (full volume).

#### `on(eventName, callback, options)`

Adds an event listener to the player.

- `eventName` (string): Name of the event.
- `callback` (function): Function to execute when the event is fired.
- `options` (object): Options for the event listener.

---

## Events

- **`channelLive`**: Triggered when the stream status changes to live.
- **`channelOffline`**: Triggered when the stream status changes to offline.

---

## Example: Live Stream Status Detection

```javascript
const player = new VpMsePlayer("video-container", "https://your-stream-url.com/stream");

// Listen for live/offline status events
player.on("channelLive", () => console.log("Stream is live"));
player.on("channelOffline", () => console.log("Stream is offline"));
```
