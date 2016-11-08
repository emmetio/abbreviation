'use strict';

const assert = require('assert');
require('babel-register');
const parser = require('../');
const createStream = require('../lib/string-stream').default;

describe('Attributes', () => {
	const parse = str => parser.consumeAttributes(createStream(str));

	it('names', () => {
		let attrs = parse('[a]');
		assert.deepEqual(parse('[a]'), [{name: 'a'}]);

		attrs = parse('[a b c]');
		assert.equal(attrs.length, 3);
		assert.deepEqual(attrs[0], {name: 'a'});
		assert.deepEqual(attrs[1], {name: 'b'});
		assert.deepEqual(attrs[2], {name: 'c'});
	});

	it('unquoted values', () => {
		let attrs = parse('[a=b]');
		assert.equal(attrs.length, 1);
		assert.deepEqual(attrs[0], {name: 'a', value: 'b'});

		attrs = parse('[a=b c= d=e]');
		assert.equal(attrs.length, 3);
		assert.deepEqual(attrs[0], {name: 'a', value: 'b'});
		assert.deepEqual(attrs[1], {name: 'c', value: ''});
		assert.deepEqual(attrs[2], {name: 'd', value: 'e'});
	});

	it('with quoted values', () => {
		let attrs = parse('[a="b"]');
		assert.equal(attrs.length, 1);
		assert.deepEqual(attrs[0], {name: 'a', value: 'b'});

		attrs = parse('[a="b" c=\'d\' e=""]');
		assert.equal(attrs.length, 3);
		assert.deepEqual(attrs[0], {name: 'a', value: 'b'});
		assert.deepEqual(attrs[1], {name: 'c', value: 'd'});
		assert.deepEqual(attrs[2], {name: 'e', value: ''});
	});

	it('mixed quotes', () => {
		const attrs = parse('[a="foo\'bar" b=\'foo"bar\' c="foo\\\"bar"]');
		assert.equal(attrs.length, 3);
		assert.deepEqual(attrs[0], {name: 'a', value: 'foo\'bar'});
		assert.deepEqual(attrs[1], {name: 'b', value: 'foo"bar'});
		assert.deepEqual(attrs[2], {name: 'c', value: 'foo\\"bar'});
	});

	it('boolean', () => {
		const options = {boolean: true};
		const attrs = parse('[a. b. c.d e.f.g.]');

		assert.equal(attrs.length, 4);
		assert.deepEqual(attrs[0], {name: 'a', options});
		assert.deepEqual(attrs[1], {name: 'b', options});

		// somewhere in MS world dots are used in attribute names
		assert.deepEqual(attrs[2], {name: 'c.d'});
		assert.deepEqual(attrs[3], {name: 'e.f.g', options});
	});

	it('React expressions', () => {
		const options = {before: '{', after: '}'};
		const attrs = parse('[foo={1 + 2} bar={fn(1, "foo")}]');

		assert.equal(attrs.length, 2);
		assert.deepEqual(attrs[0], {name: 'foo', value: '1 + 2', options});
		assert.deepEqual(attrs[1], {name: 'bar', value: 'fn(1, "foo")', options});
	});

	it('errors', () => {
		assert.throws(() => parse('[a'), /Expected closing "]" brace/);
		assert.throws(() => parse('[a="foo]'), /Unable to find matching "/);
		assert.throws(() => parse('[a={foo]'), /Unable to find matching \}/);
		assert.throws(() => parse('[a=b=c]'), /Expected attribute name/);
	});
});
