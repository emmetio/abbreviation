'use strict';

const assert = require('assert');
require('babel-register');
const parser = require('../');
const createStream = require('../lib/string-stream').default;

describe('Element node', () => {
	const create = str => parser.consumeNode(createStream(str));
	const read = node => {
		if (typeof node === 'string') {
			node = create(node);
		}

		if (node.name || node.attributes.length) {
			const name = node.name || '@';
			const output = `<${name}` + node.attributes.map(attr => ` ${attr.name}="${attr.value || ''}"`).join('');
			return output + (node.value ? `>${node.value}</${name}>` : ' />');
		}

		return node.value;
	};

	it('simple', () => {
		assert.equal(read('div'), '<div />');
		assert.equal(read('div.foo'), '<div class="foo" />');
		assert.equal(read('div#foo'), '<div id="foo" />');
		assert.equal(read('div#foo.bar'), '<div id="foo" class="bar" />');
		assert.equal(read('div.foo#bar'), '<div class="foo" id="bar" />');
		assert.equal(read('div.foo.bar.baz'), '<div class="foo bar baz" />');
		assert.equal(read('.foo'), '<@ class="foo" />');
		assert.equal(read('#foo'), '<@ id="foo" />');
		assert.equal(read('#foo.bar'), '<@ id="foo" class="bar" />');

		assert.equal(read('.'), '<@ class="" />');
		assert.equal(read('#'), '<@ id="" />');
		assert.equal(read('#.'), '<@ id="" class="" />');
		assert.equal(read('.#.'), '<@ class="" id="" />');
	});

	it('with attributes', () => {
		assert.equal(read('div[foo=bar]'), '<div foo="bar" />');
		assert.equal(read('div.a[b=c]'), '<div class="a" b="c" />');
		assert.equal(read('div[b=c].a'), '<div b="c" class="a" />');
		assert.equal(read('div[a=b][c="d"]'), '<div a="b" c="d" />');

		assert.equal(read('[b=c]'), '<@ b="c" />');
		assert.equal(read('.a[b=c]'), '<@ class="a" b="c" />');
		assert.equal(read('[b=c].a#d'), '<@ b="c" class="a" id="d" />');
		assert.equal(read('[b=c]a'), '<@ b="c" />', 'Do not consume node name after attribute set');
	});

	it('with text node', () => {
		assert.equal(read('div{foo}'), '<div>foo</div>');
		assert.equal(read('{foo}'), 'foo');
	});

	it('mixed', () => {
		assert.equal(read('div.foo{bar}'), '<div class="foo">bar</div>');
		assert.equal(read('.foo{bar}#baz'), '<@ class="foo" id="baz">bar</@>');
		assert.equal(read('.foo[b=c]{bar}'), '<@ class="foo" b="c">bar</@>');
	});

	// TODO implement repeater
	// TODO implement forced void element
});
