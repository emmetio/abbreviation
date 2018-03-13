export default {
	input: './index.js',
	external: [
		'@emmetio/stream-reader',
		'@emmetio/stream-reader-utils',
		'@emmetio/node'
	],
	output: [{
		format: 'cjs',
		sourcemap: true,
		file: 'dist/abbreviation.cjs.js'
	}, {
		format: 'es',
		sourcemap: true,
		file: 'dist/abbreviation.es.js'
	}]
};
