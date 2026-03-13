// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface ImportMetaEnv {
		readonly PUBLIC_CONVERSATION_ID: string;
		readonly PUBLIC_INVITE_ID: string;
		readonly PUBLIC_POLIS_URL: string;
		readonly PUBLIC_POLIS_ID: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

export {};
