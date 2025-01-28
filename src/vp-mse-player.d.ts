declare module "vp-mse-player" {
	interface PlayerOptions {
		progressUpdateTime?: number;
	}

	interface PlayerConfig {
		size?: {
			width?: string | number;
			height?: string | number;
		};
		controls?: boolean;
	}

	class VpMsePlayer {
		constructor(
			elementId: string,
			streamUrl: string,
			options?: PlayerOptions,
			config?: PlayerConfig
		);

		play(): void;
		pause(): void;
		stop(): void;
		restart(): void;
		destroy(): void;
		setVolume(volume: number): void;

		on(eventName: string, callback: (event: Event) => void): void;
		fire(eventName: string, detail?: object, options?: object): void;
	}

	export default VpMsePlayer;
}
