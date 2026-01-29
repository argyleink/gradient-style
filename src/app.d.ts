// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}

	// Prism global
	const Prism: any;

	// Window extensions
	interface Window {
		syncStateTimer?: NodeJS.Timeout;
		syncColorTimer?: NodeJS.Timeout;
	}

	// Stop type definition
	type Stop = {
		kind: 'stop';
		color: string;
		auto: string;
		position1: string;
		position2: string;
	} | {
		kind: 'hint';
		auto: string;
		percentage: string;
	};

	// HTMLDialogElement interface extension
	interface HTMLDialogElement {
		show(): void;
		showModal(): void;
		close(returnValue?: string): void;
	}
}

export {};
