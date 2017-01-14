export default {
	entry: './index.js',
	external: [
		'@emmetio/stream-reader',
		'@emmetio/node'
	],
	targets: [
		{format: 'cjs', dest: 'dist/abbreviation.cjs.js'},
		{format: 'es',  dest: 'dist/abbreviation.es.js'}
	]
};
