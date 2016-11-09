'use strict';

const assert = require('assert');
require('babel-register');
const parser = require('../');
const createStream = require('../lib/string-stream').default;

describe('Repeat', () => {
	const parse = str => parser.consumeRepeat(createStream(str));

	it('basic', () => {
		assert.deepEqual(parse('*3'), {count: 3});
		assert.deepEqual(parse('*123'), {count: 123});
		assert.deepEqual(parse('*123foo'), {count: 123});
		assert.deepEqual(parse('*'), {count: null});
	});

	it('error', () => {
		assert.throws(() => parse('123'), /Expected \* character for repeater/);
	});
});
