import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/kit/vite';
const dev = process.argv.includes('dev');

/** @type { import('@sveltejs/kit/vite')} */
export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		paths: {
			base: dev ? '' : '/hyperchess'
		}
	},
	plugins: [sveltekit()],
	ssr: {
		noExternal: ['three']
	}
};
