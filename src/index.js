const STATUS_TIMEOUT = 1500;
const RETRYPLAY_TIMEOUT = 8000;

const LIVE_STATUS = "Live";
const OFFLINE_STATUS = "Offline";
const CONNECTING_STATUS = "Connecting";

const defaultOptions = {
	progressUpdateTime: 750,
	connectionRetries: Infinity,
	errorsBeforeStop: Infinity,
};

const defaultConfig = {
	controls: true,
};

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
		const playerInstance = new msePlayer(elementId);
		players.set(elementId, playerInstance);
		return playerInstance;
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
		this.video = null;
		this.videoContainer = null;
		this.channelStatus = null;
		this.status = null;
		this.playbackStarted = false;
		this.eventListeners = [];
		this.statusTimeout = null;
		this.retryPlayTimeout = null;
		this.visibilityChangeListener = null;
		this.wasPlayingBeforeHidden = false;
	}

	setup(streamUrl, options, config) {
		if (!streamUrl) {
			throw new Error("StreamUrl is required");
		}

		this.streamUrl = streamUrl;
		this.options = { ...defaultOptions, ...options }; // Merge options
		this.config = { ...defaultConfig, ...config }; // Merge config
		this.init();
	}

	/**
	 * Initialize the video player.
	 * @private
	 */
	async init() {
		const videoContainer = document.getElementById(this.elementId);
		if (!videoContainer) {
			console.error(`Element with id "${this.elementId}" not found.`);
			return;
		}
		this.videoContainer = videoContainer;
		this.setupHTMLTemplate();
		try {
			await this.initPlayer();
			this.setInitialState();
			this.addEventListeners();
		} catch (error) {
			console.error("Initialization failed:", error);
			this.nonLiveStatus();
		}
	}

	/**
	 * Initializes the MSE player instance.
	 * If the library is already loaded, instantiates the player directly.
	 * Otherwise, dynamically loads the library and instantiates it afterwards.
	 *
	 * @returns {Promise<void>}
	 */
	async initPlayer() {
		try {
			if (window.msePlayer) {
				this.player = new window.msePlayer(this.video, this.streamUrl, this.options);
			} else {
				await this.loadMsePlayerLibrary();
			}
		} catch (error) {
			console.error("Error initializing vpMsePlayer:", error);
			this.nonLiveStatus();
		}
	}

	/**
	 * Dynamically loads the msePlayer library and initializes the player.
	 * Only loads the script if not already available on the window object.
	 *
	 * @returns {Promise<void>} Resolves when the library is loaded and player is initialized.
	 */
	loadMsePlayerLibrary() {
		if (window.msePlayer) return Promise.resolve();

		return new Promise((resolve, reject) => {
			const script = document.createElement("script");
			script.src = "https://vpplayer-assets.eu-1.cdn77-storage.com/mse-player/msePlayer.js";

			script.onload = () => {
				if (window.msePlayer) {
					this.player = new window.msePlayer(this.video, this.streamUrl, this.options);
					resolve();
				} else {
					reject(new Error("msePlayer loaded but not available on window"));
				}
			};

			script.onerror = () => {
				reject(new Error("Failed to load msePlayer library"));
			};

			document.head.appendChild(script);
		});
	}

	/**
	 * Set the initial state of the video element.
	 * @private
	 */
	async setInitialState() {
		this.video.muted = true;
		this.video.controls = this.config.controls ?? true;
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
	 * Handles the browser's visibilitychange event.
	 * Attempts to resume playback when the tab becomes visible again.
	 * @private
	 */
	handleVisibilityChange() {
		if (!this.player || !this.video) return;

		if (document.hidden) {
			this.wasPlayingBeforeHidden = !this.video.paused;
		} else {
			if (this.playbackStarted && this.wasPlayingBeforeHidden && this.video.paused) {
				// Use a small delay to allow the browser to settle
				setTimeout(() => {
					this.video.play();
				}, 200);
			}
			this.wasPlayingBeforeHidden = !this.video.paused;
		}
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
		this.video.onplaying = this.onPlaying.bind(this);
		this.video.onpause = this.onPause.bind(this); // Track pause events

		// Page Visibility API Listener
		// Use a bound function so 'this' is correct and we can remove it later
		this.visibilityChangeListener = this.handleVisibilityChange.bind(this);
		document.addEventListener("visibilitychange", this.visibilityChangeListener);
	}

	onPlaying() {
		this.wasPlayingBeforeHidden = true;
		clearTimeout(this.statusTimeout);
		this.statusTimeout = null;
		clearTimeout(this.retryPlayTimeout);
		this.retryPlayTimeout = null;
	}

	onPause() {}

	/**
	 * Handle progress event from the MSE player.
	 * @private
	 */
	onProgress(progress) {
		if (!this.playbackStarted) {
			this.onStart();
		}

		this.fire("progress", progress);

		this.retryPlayTimeout = clearTimeout(this.retryPlayTimeout);
		this.retryPlayTimeout = null;
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
		this.statusTimeout = clearTimeout(this.statusTimeout);
		this.statusTimeout = null;

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

		// Remove specific listeners added directly
		if (this.player) {
			this.player.onProgress = null;
		}
		if (this.video) {
			this.video.onerror = null;
			this.video.onwaiting = null;
			this.video.onprogress = null;
			this.video.onplaying = null;
			this.video.onpause = null;
		}

		// Remove Page Visibility listener
		if (this.visibilityChangeListener) {
			document.removeEventListener("visibilitychange", this.visibilityChangeListener);
			this.visibilityChangeListener = null;
		}
	}

	/**
	 * Clear any residual status timeouts.
	 * @private
	 */
	clearResiduals() {
		this.retryPlayTimeout = clearTimeout(this.retryPlayTimeout);
		this.retryPlayTimeout = null;
		this.statusTimeout = clearTimeout(this.statusTimeout);
		this.statusTimeout = null;
	}

	/**
	 * Start video playback.
	 */
	play() {
		if (!this.player) return;

		this.retryPlayTimeout = clearTimeout(this.retryPlayTimeout);
		this.retryPlayTimeout = null;

		this.initRetryPlayTimeout();

		this.player.play()?.catch((error) => {
			if (!this.video) return;
			this.video.pause();
			this.initRetryPlayTimeout();
		});
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
			if (this.player.ws) this.player.ws.destroy();
		}
	}

	initRetryPlayTimeout() {
		if (!this.player) return;
		this.retryPlayTimeout = clearTimeout(this.retryPlayTimeout);
		this.retryPlayTimeout = null;
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
