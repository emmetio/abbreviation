'use strict';

const assert = require('assert');
require('babel-register');
const consumeRepeat = require('../lib/parser/repeat').default;
const createStream = require('../lib/string-stream').default;

describe('Repeat', () => {
	const parse = str => consumeRepeat(createStream(str));

	it('basic', () => {
		assert.deepEqual(parse('*3'), {count: 3});
		assert.deepEqual(parse('*123'), {count: 123});
		assert.deepEqual(parse('*123foo'), {count: 123});
		assert.deepEqual(parse('*'), {count: null});
	});
});
