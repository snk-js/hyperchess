import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

const dev = process.argv.includes('dev');

export default {
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
