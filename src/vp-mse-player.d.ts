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

	class msePlayer {
		setup(streamUrl: string, options?: PlayerOptions, config?: PlayerConfig): void;

		play(): void;
		pause(): void;
		stop(): void;
		restart(): void;
		destroy(): void;
		setVolume(volume: number): void;

		on(
			eventName: string,
			callback: (event: Event) => void,
			options?: AddEventListenerOptions
		): void;
		off(eventName: string, callback: (event: Event) => void): void;

		fire(eventName: string, detail?: object, options?: object): void;
	}

	interface vpMsePlayerFunction {
		(elementId: string): msePlayer;
		destroy(elementId: string): void;
	}

	const vpMsePlayer: vpMsePlayerFunction;

	export default vpMsePlayer;
}
