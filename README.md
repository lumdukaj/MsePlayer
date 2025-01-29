# VpMsePlayer

`VpMsePlayer` is a JavaScript library designed for creating and managing video players, optimized for handling MSE video streams. It streamlines the setup process and offers advanced features like live/offline status detection, customizable configurations, and event hooks for seamless integration into applications.

---

## Features

- **Stream Status Detection**: Built-in live/offline status handling.
- **Customizable Layout**: Easily adjust player dimensions, controls, and styles.
- **Event Listeners**: Subscribe to player events for enhanced control.

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
import vpMsePlayer from "vp-mse-player";

const streamUrl = "ws://your-stream-url.com/stream";
const config = {};
const options = {};

const player = vpMsePlayer("video-container");
player.setup(streamUrl, options, config);
```

---

## API Reference

### Constructor

```javascript
const player = vpMsePlayer(elementId);
```

- `elementId` (string, required): ID of the HTML container for the player.

---

### Methods

#### `setup(streamUrl, options, config)`

Initializes the player with the given stream URL, options, and configuration.

- `streamUrl` (string, required): URL of the video stream.
- `options` (object, optional): Player options. Default: `{ progressUpdateTime: 750 }`.
- `config` (object, optional): Player configuration. Default:
  - `size` (object): `{ width: "100%", height: "100%" }`
  - `controls` (boolean): Enable/disable native controls (default: `true`).

#### `play()`

Starts video playback.

#### `pause()`

Pauses video playback.

#### `stop()`

Stops video playback and resets the player.

#### `restart()`

Restarts video playback.

#### `destroy()`

Destroys the player instance and cleans up resources.

#### `setVolume(volume)`

Sets the player volume.

- `volume` (number): Value between `0` (mute) and `1` (full volume).

#### `on(eventName, callback, options)`

Adds an event listener to the player.

- `eventName` (string): Name of the event.
- `callback` (function): Function to execute when the event is triggered.
- `options` (object): Event listener options.

#### `off(eventName, callback)`

Removes a specific event listener from the player.

---

## Events

- **`channelLive`**: Fired when the stream changes to a live status.
- **`channelOffline`**: Fired when the stream changes to an offline status.

---

## Example: Live Stream Status Detection

```javascript
const player = vpMsePlayer("video-container");
const streamUrl = "ws://your-stream-url.com/stream";

player.setup(streamUrl);

// Listen for live/offline status events
player.on("channelLive", () => console.log("Stream is live"));
player.on("channelOffline", () => console.log("Stream is offline"));
```

---

## Example: Destroy Player

```javascript
const player = vpMsePlayer("video-container");

// Destroy the player instance
player.destroy();
```
