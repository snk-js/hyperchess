import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

// Standalone from vite.config.ts on purpose: unit tests don't need the SvelteKit
// plugin or the ws dev-server hook, just $lib resolution in a node environment.
export default defineConfig({
	resolve: {
		alias: {
			$lib: resolve('./src/lib')
		}
	},
	test: {
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
