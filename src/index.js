import FlussonicMsePlayer from "@flussonic/flussonic-mse-player";

class VpMsePlayer {
	/**
	 * Create a new VpMsePlayer instance.
	 * @param {string} elementId - The ID of the HTML element to contain the player.
	 * @param {string} streamUrl - The URL of the video stream.
	 * @param {object} [options={}] - Options for the Flussonic MSE player.
	 * @param {object} [config={}] - Configuration settings for the player.
	 * @throws Will throw an error if elementId or streamUrl is not provided.
	 */
	constructor(elementId, streamUrl, options = {}, config = {}) {
		if (!elementId || !streamUrl) {
			throw new Error("Both elementId and streamUrl are required");
		}

		this.elementId = elementId;
		this.streamUrl = streamUrl;
		this.options = options;
		this.config = config;
		this.player = null;
		this.initPlayer();
	}

	/**
	 * Initialize the video player.
	 * @private
	 */
	initPlayer() {
		const videoContainer = document.getElementById(this.elementId);
		if (!videoContainer) {
			throw new Error(`Element with id "${this.elementId}" not found.`);
		}
		this.videoContainer = videoContainer;
		this.createVideo();
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
		this.video.controls = this.config.controls || false;
		this.play();
	}

	/**
	 * Create the video element inside the container.
	 * @private
	 */
	createVideo() {
		this.video = document.createElement("video");
		this.videoContainer.appendChild(this.video);
		this.styleVideoContainer();
		this.styleVideo();
	}

	/**
	 * Apply styles to the video container.
	 * @private
	 */
	styleVideoContainer() {
		const { width = "100%", height = "100%" } = this.config.size || {};
		this.videoContainer.style.width = typeof width === "number" ? `${width}px` : width;
		this.videoContainer.style.height = typeof height === "number" ? `${height}px` : height;
		this.videoContainer.style.position = "relative";
		this.videoContainer.style.overflow = "hidden";
		this.videoContainer.style.backgroundColor = "black";
		this.videoContainer.classList.add("vp-mse-player-container");
	}

	/**
	 * Apply styles to the video element.
	 * @private
	 */
	styleVideo() {
		this.video.style.position = "absolute";
		this.video.style.objectFit = "cover";
		this.video.style.border = "none";
		this.video.style.width = "100%";
		this.video.style.height = "100%";
	}

	/**
	 * Add event listeners to the player.
	 * @private
	 */
	addEventListeners() {
		this.player.onProgress = (progress) => {
			console.warn("Progress:", progress);
		};
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
	 * Destroy the player and clean up resources.
	 */
	destroy() {
		if (this.player) {
			this.player.destroy();
			this.player = null;
		}
	}

	/**
	 * Set the player volume.
	 * @param {number} volume - The volume level (0 to 1).
	 */
	setVolume(volume) {
		if (this.player) {
			this.player.setVolume(volume);
		}
	}
}

window.VpMsePlayer = VpMsePlayer;

export default VpMsePlayer;
