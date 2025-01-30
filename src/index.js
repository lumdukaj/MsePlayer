import FlussonicMsePlayer from "@flussonic/flussonic-mse-player";

const STATUS_TIMEOUT = 1250;

window.vpMsePlayers = window.vpMsePlayers || new Map();

const vpMsePlayer = (elementId) => {
	const players = window.vpMsePlayers;
	const player = players.get(elementId);

	if (!elementId) {
		return players.values().next().value;
	}

	if (player) {
		return player;
	} else {
		const player = new msePlayer(elementId);
		players.set(elementId, player);
		return player;
	}
};

vpMsePlayer.destroy = (elementId) => {
	const players = window.vpMsePlayers;
	const player = players.get(elementId);
	if (player) {
		players.delete(elementId);
	}
};

class msePlayer {
	/**
	 * Create a new msePlayer instance.
	 * @param {string} elementId - The ID of the HTML element to contain the player.
	 */
	constructor(elementId) {
		if (!elementId) {
			throw new Error("ElementId is required");
		}

		this.elementId = elementId;
		this.streamUrl = null;
		this.options = null;
		this.config = null;
		this.player = null;
	}

	setup(streamUrl, options = { progressUpdateTime: 750 }, config = {}) {
		if (!streamUrl) {
			throw new Error("StreamUrl is required");
		}

		this.streamUrl = streamUrl;
		this.options = options;
		this.config = config;
		this.initPlayer();
	}

	/**
	 * Initialize the video player.
	 * @private
	 */
	initPlayer() {
		this.player = null;
		const videoContainer = document.getElementById(this.elementId);
		if (!videoContainer) {
			throw new Error(`Element with id "${this.elementId}" not found.`);
		}
		this.videoContainer = videoContainer;
		this.setupHTMLTemplate();
		this.player = new FlussonicMsePlayer(this.video, this.streamUrl, this.options);
		this.setInitialState();
		this.addEventListeners();
	}

	/**
	 * Set the initial state of the video element.
	 * @private
	 */
	setInitialState() {
		this.video.muted = true;
		this.video.controls = this.config.controls || true;
		this.play();
		this.offlineStatus();
	}

	/**
	 * Create the video element inside the container.
	 * @private
	 */
	setupHTMLTemplate() {
		const template = `
		<div class="vp-mse-channel-status"></div>
		<video class="vp-mse-video"></video>
		`;
		this.videoContainer.classList.add("vp-mse-player-container");
		this.videoContainer.innerHTML = template;
		this.video = this.videoContainer.querySelector("video");
		this.channelStatus = this.videoContainer.querySelector(".vp-mse-channel-status");
		this.setSize();
		this.setStyle();
	}

	/**
	 * Apply size settings to the video container.
	 * @private
	 */
	setSize() {
		if(this.config.size === undefined) {
			this.videoContainer.style.width = "100%";
			this.videoContainer.style.paddingTop = "56.25%";
			return;
		}

		const { width = "100%", height = "100%" } = this.config.size;
		this.videoContainer.style.width = typeof width === "number" ? `${width}px` : width;
		this.videoContainer.style.height = typeof height === "number" ? `${height}px` : height;
	}

	/**
	 * Apply style settings to the player elements.
	 * @private
	 */
	setStyle() {
		Object.assign(this.videoContainer.style, {
			position: "relative",
			overflow: "hidden",
			backgroundColor: "#000",
			width: "100%",
			height: "100%",
		});

		Object.assign(this.video.style, {
			position: "absolute",
			width: "100%",
			height: "100%",
			top: "0",
			left: "0",
			border: "none",
		});

		Object.assign(this.channelStatus.style, {
			position: "absolute",
			top: "10px",
			right: "10px",
			zIndex: "9999",
			padding: "3px 6px",
			borderRadius: "4px",
			backgroundColor: "#ffffff8e",
			fontFamily: "Arial, sans-serif",
			fontSize: "12px",
			fontWeight: "bold",
		});
	}

	/**
	 * Add event listeners to the player.
	 * @private
	 */
	addEventListeners() {
		this.player.onProgress = () => {
			if (this.statusTimeout) {
				clearTimeout(this.statusTimeout);
			}

			if (this.status !== "live") {
				this.liveStatus();
			}

			this.statusTimeout = setTimeout(() => {
				this.offlineStatus();
			}, STATUS_TIMEOUT);
		};
	}

	/**
	 * Set the player status to live.
	 * @private
	 */
	liveStatus() {
		this.status = "live";
		this.channelStatus.innerHTML = "Live";
		this.channelStatus.style.backgroundColor = "#ffffff8e";
		this.channelStatus.style.color = "#ff0000";
		this.fire("channelLive", { message: "Channel is online" });
	}

	/**
	 * Set the player status to offline.
	 * @private
	 */
	offlineStatus() {
		this.status = "offline";
		this.channelStatus.innerHTML = "Offline";
		this.channelStatus.style.backgroundColor = "#0000008e";
		this.channelStatus.style.color = "#ffffff";
		this.fire("channelOffline", { message: "Channel is offline" });
	}

	/**
	 * Fire a custom event on an element.
	 * @param {string} eventName - The name of the event.
	 * @param {object} detail - The event detail object.
	 * @param {object} options - Event options.
	 * @private
	 */

	fire(eventName, detail, options = {}) {
		const event = new CustomEvent(eventName, {
			detail: detail,
			bubbles: options.bubbles || true,
			cancelable: options.cancelable || true,
		});
		this.videoContainer.dispatchEvent(event);
	}

	/**
	 * Add an event listener to the player.
	 * @param {string} eventName - The name of the event.
	 * @param {function} callback - The event callback function.
	 * @param {object} options - Event options.
	 * @returns {void}
	 */
	on(eventName, callback, options = {}) {
		this.videoContainer.addEventListener(eventName, callback, options);
		this.eventListeners = this.eventListeners || [];
		this.eventListeners.push({ eventName, callback, options });
	}

	/**
	 * Remove an event listener to the player.
	 * @param {string} eventName - The name of the event.
	 * @param {function} callback - The event callback function.
	 * @returns {void}
	 */
	off(eventName, callback) {
		this.videoContainer.removeEventListener(eventName, callback);
	}

	/**
	 * Remove all event listeners ever added to the player.
	 * @returns {void}
	 * @private
	 */
	removeEventListeners() {
		if (this.eventListeners) {
			this.eventListeners.forEach(({ eventName, callback, options }) => {
				this.videoContainer.removeEventListener(eventName, callback, options);
			});
		}
	}

	/**
	 * Clear any residual status timeouts.
	 * @private
	 */
	clearResiduals() {
		if (this.statusTimeout) {
			this.statusTimeout = clearTimeout(this.statusTimeout);
		}
	}

	/**
	 * Start video playback.
	 */
	play() {
		if (this.player) {
			this.player.play().catch((error) => {
				console.error("Error while playing:", error);
			});
		}
	}

	/**
	 * Pause video playback.
	 */
	pause() {
		if (this.player) {
			this.player.pause();
		}
	}

	/**
	 * Stop video playback and reset the player.
	 */
	stop() {
		if (this.player) {
			this.player.stop();
		}
	}

	/**
	 * Restart video playback.
	 */
	restart() {
		if (this.player) {
			this.player.stop();
			this.player.play();
		}
	}

	/**
	 * Destroy the player and clean up resources.
	 */
	destroy() {
		this.removeEventListeners();
		this.clearResiduals();
		this.videoContainer.classList.remove("vp-mse-player-container");
		this.videoContainer.innerHTML = "";
		this.video = null;
		this.channelStatus = null;
		this.status = null;
		if (this.player) {
			this.player.stop();
			this.player.ws.destroy();
			this.player = null;
		}
		vpMsePlayer.destroy(this.elementId);
	}
}

window.vpMsePlayer = vpMsePlayer;

export default vpMsePlayer;
