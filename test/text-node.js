'use strict';

const assert = require('assert');
require('babel-register');
const parser = require('../');
const createStream = require('../lib/string-stream').default;

describe('Text node', () => {
	const parse = str => parser.consumeTextNode(createStream(str));

	it('parse', () => {
		assert.equal(parse('{a b c}'), 'a b c');
		assert.equal(parse('{a "b c"}'), 'a "b c"');
		assert.equal(parse('{foo(a => {return "b"});}'), 'foo(a => {return "b"});');
		assert.equal(parse('{foo(a => {return "b}"});}'), 'foo(a => {return "b}"});');
		assert.equal(parse('{foo\\}bar}'), 'foo\\}bar');
		assert.equal(parse('{foo\\"}bar}'), 'foo\\"');
	});

	it('errors', () => {
		assert.throws(() => parse('{foo'), /Unable to find matching \}/);
		assert.throws(() => parse('{foo"}'), /Unable to find matching "/);
		assert.throws(() => parse('{foo => {}'), /Unable to find matching \}/);
	});
});
