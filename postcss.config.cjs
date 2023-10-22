const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const postcssnesting = require('postcss-nesting');

const config = {
	plugins: [
		postcssnesting(),
		//Some plugins, like tailwindcss/nesting, need to run before Tailwind,
		tailwindcss(),
		//But others, like autoprefixer, need to run after,
		autoprefixer
	]
};

module.exports = config;
