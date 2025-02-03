import FlussonicMsePlayer from "@flussonic/flussonic-mse-player";

const STATUS_TIMEOUT = 1500;
const RETRYPLAY_TIMEOUT = 8000;

const LIVE_STATUS = "Live";
const OFFLINE_STATUS = "Offline";
const CONNECTING_STATUS = "Connecting";

const defaultOptions = {
	progressUpdateTime: 750,
	connectionRetries: Infinity, // 60 retries, 1 minute wait(hard coded in Flussonic-Mse-Player) for each retry
	errorsBeforeStop: Infinity,
};

const defaultConfig = {};

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

	setup(streamUrl, options, config) {
		if (!streamUrl) {
			throw new Error("StreamUrl is required");
		}

		this.streamUrl = streamUrl;
		this.options = options || defaultOptions;
		this.config = config || defaultConfig;
		this.init();
	}

	/**
	 * Initialize the video player.
	 * @private
	 */
	init() {
		const videoContainer = document.getElementById(this.elementId);
		if (!videoContainer) {
			throw new Error(`Element with id "${this.elementId}" not found.`);
		}
		this.videoContainer = videoContainer;
		this.setupHTMLTemplate();
		this.initPlayer();
		this.setInitialState();
		this.addEventListeners();
	}

	initPlayer() {
		try {
			this.player = new FlussonicMsePlayer(this.video, this.streamUrl, this.options);
		} catch (error) {
			console.error("Error initializing FlussonicMsePlayer:", error);
			this.nonLiveStatus();
		}
	}
	/**
	 * Set the initial state of the video element.
	 * @private
	 */
	async setInitialState() {
		this.video.muted = true;
		this.video.controls = this.config.controls || true;
		this.playbackStarted = false;
		this.nonLiveStatus();
		this.play();
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
		if (this.config.size === undefined) {
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
		this.player.onProgress = this.onProgress.bind(this);
		this.video.onerror = this.onError.bind(this);
		this.video.onwaiting = this.onWaiting.bind(this);
		this.video.onprogress = this.onVideoProgress.bind(this);
	}
	/**
	 * Handle progress event from the MSE player.
	 * @private
	 */
	onProgress(progress) {
		if (!this.playbackStarted) {
			this.onStart();
		}

		this.fire("progress", progress);

		if (this.retryPlayTimeout) {
			this.retryPlayTimeout = clearTimeout(this.retryPlayTimeout);
		}
	}

	/**
	 * @private
	 */
	onVideoProgress() {
		if (!this.playbackStarted) return;

		// Set status from non-live to live in case a progress event is received.
		if (this.status !== LIVE_STATUS) {
			this.liveStatus();
		}
	}

	/**
	 * @private
	 */
	onStart() {
		this.playbackStarted = true;
	}

	/**
	 * @private
	 */
	onWaiting() {
		if (this.statusTimeout) {
			this.statusTimeout = clearTimeout(this.statusTimeout);
		}

		// If no progress event is received within the timeout, set status to offline.
		this.statusTimeout = setTimeout(() => {
			this.nonLiveStatus();
		}, STATUS_TIMEOUT);
	}

	/**
	 * @private
	 */
	onError(error) {
		console.warn("Video error:", error);
	}

	/**
	 * Set the player status to live.
	 * @private
	 */
	liveStatus() {
		const status = LIVE_STATUS;
		if (this.status === status) return;
		this.status = status;
		this.channelStatus.innerHTML = status;
		this.channelStatus.style.backgroundColor = "#ffffff8e";
		this.channelStatus.style.color = "#ff0000";
		this.fire(`channel${status}`, { message: `Channel is ${status}` });
	}

	/**
	 * Set the player status to non-live.
	 * @private
	 */
	nonLiveStatus() {
		const status = this.playbackStarted ? OFFLINE_STATUS : CONNECTING_STATUS;
		if (this.status === status) return;
		this.status = status;
		this.channelStatus.innerHTML = status;
		this.channelStatus.style.backgroundColor = "#0000008e";
		this.channelStatus.style.color = "#ffffff";
		this.fire(`channel${status}`, { message: `Channel is ${status}` });
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
		if (this.statusTimeout) this.statusTimeout = clearTimeout(this.statusTimeout);
		if (this.retryPlayTimeout) this.retryPlayTimeout = clearTimeout(this.retryPlayTimeout);
	}

	/**
	 * Start video playback.
	 */
	play() {
		if (this.player) {
			if (this.retryPlayTimeout) {
				this.retryPlayTimeout = clearTimeout(this.retryPlayTimeout);
			}

			this.handleRetry();
			this.player.play().catch((error) => {
				if (!this.video) return;
				this.video.pause();
				this.handleRetry();
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
	 * Restart connection to the stream.
	 */
	restart() {
		console.warn("Restarting player...");
		const elementId = this.elementId;
		const streamUrl = this.streamUrl;
		const options = this.options;
		const config = this.config;
		this.destroy();
		vpMsePlayer(elementId).setup(streamUrl, options, config);
	}

	/**
	 * Destroy the WebSocket worker used by the mse-player.
	 * @private
	 */
	destroyWsWorker() {
		if (this.player) {
			this.stop();
			this.player.ws?.destroy();
		}
	}

	handleRetry() {
		if (this.retryPlayTimeout) {
			this.retryPlayTimeout = clearTimeout(this.retryPlayTimeout);
		}

		this.retryPlayTimeout = setTimeout(() => {
			this.restart();
		}, RETRYPLAY_TIMEOUT);
	}

	/**
	 * Destroy the player and clean up resources.
	 */
	destroy() {
		this.removeEventListeners();
		this.clearResiduals();
		this.videoContainer.classList.remove("vp-mse-player-container");
		this.videoContainer.innerHTML = "";
		this.video.src = "";
		this.video = null;
		this.channelStatus = null;
		this.status = null;
		if (this.player) {
			this.destroyWsWorker();
			this.player = null;
		}
		vpMsePlayer.destroy(this.elementId);
	}
}

window.vpMsePlayer = vpMsePlayer;

export default vpMsePlayer;
