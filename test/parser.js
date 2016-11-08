'use strict';

const assert = require('assert');
require('babel-register');
const parser = require('../');
const createStream = require('../lib/string-stream').default;

describe('Parser', () => {
	it('parse attributes', () => {
		const stream = createStream('[foo bar="baz"]')
		const attributes = parser.consumeAttributes(stream);
		assert.equal(attributes.length, 2);

		assert.equal(attributes[0].name, 'foo');
		assert.equal(attributes[0].value, undefined);

		assert.equal(attributes[1].name, 'bar');
		assert.equal(attributes[1].value, 'baz');
	});
});
