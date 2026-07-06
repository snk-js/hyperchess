import { vitePreprocess } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess({})],

	kit: {
		adapter: adapter()
		// CSRF origin check left at its secure default now that everything is
		// same-origin (the external ws relay that needed it is gone).
	}
};

export default config;
