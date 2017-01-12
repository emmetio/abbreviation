'use strict';

const assert = require('assert');
const StreamReader = require('@emmetio/stream-reader');
require('babel-register');
const consumeElement = require('../lib/parser/element').default;
const stringify = require('./assets/stringify').default;

describe('Element node', () => {
	const parse = str => stringify(consumeElement(new StreamReader(str)));

	it('simple', () => {
		assert.equal(parse('div'), '<div></div>');
		assert.equal(parse('div.foo'), '<div class="foo"></div>');
		assert.equal(parse('div#foo'), '<div id="foo"></div>');
		assert.equal(parse('div#foo.bar'), '<div id="foo" class="bar"></div>');
		assert.equal(parse('div.foo#bar'), '<div class="foo" id="bar"></div>');
		assert.equal(parse('div.foo.bar.baz'), '<div class="foo bar baz"></div>');
		assert.equal(parse('.foo'), '<? class="foo"></?>');
		assert.equal(parse('#foo'), '<? id="foo"></?>');
		assert.equal(parse('#foo.bar'), '<? id="foo" class="bar"></?>');

		assert.equal(parse('.'), '<? class=""></?>');
		assert.equal(parse('#'), '<? id=""></?>');
		assert.equal(parse('#.'), '<? id="" class=""></?>');
		assert.equal(parse('.#.'), '<? class="" id=""></?>');
	});

	it('with attributes', () => {
		assert.equal(parse('div[foo=bar]'), '<div foo="bar"></div>');
		assert.equal(parse('div.a[b=c]'), '<div class="a" b="c"></div>');
		assert.equal(parse('div[b=c].a'), '<div b="c" class="a"></div>');
		assert.equal(parse('div[a=b][c="d"]'), '<div a="b" c="d"></div>');

		assert.equal(parse('[b=c]'), '<? b="c"></?>');
		assert.equal(parse('.a[b=c]'), '<? class="a" b="c"></?>');
		assert.equal(parse('[b=c].a#d'), '<? b="c" class="a" id="d"></?>');
		assert.equal(parse('[b=c]a'), '<? b="c"></?>', 'Do not consume node name after attribute set');
	});

	it('with text node', () => {
		assert.equal(parse('div{foo}'), '<div>foo</div>');
		assert.equal(parse('{foo}'), 'foo');
	});

	it('mixed', () => {
		assert.equal(parse('div.foo{bar}'), '<div class="foo">bar</div>');
		assert.equal(parse('.foo{bar}#baz'), '<? class="foo" id="baz">bar</?>');
		assert.equal(parse('.foo[b=c]{bar}'), '<? class="foo" b="c">bar</?>');
	});

	it('repeated', () => {
		assert.equal(parse('div.foo*3'), '<div*3 class="foo"></div>');
		assert.equal(parse('.a[b=c]*10'), '<?*10 class="a" b="c"></?>');
		assert.equal(parse('.a*10[b=c]'), '<?*10 class="a" b="c"></?>');
		assert.equal(parse('.a*10{text}'), '<?*10 class="a">text</?>');
	});

	it('self-closing', () => {
		assert.equal(parse('div/'), '<div />');
		assert.equal(parse('.foo/'), '<? class="foo" />');
		assert.equal(parse('.foo[bar]/'), '<? class="foo" bar="" />');
		assert.equal(parse('.foo/*3'), '<?*3 class="foo" />');
		assert.equal(parse('.foo*3/'), '<?*3 class="foo" />');

		assert.throws(() => parse('/'), /Unexpected self\-closing indicator/);
	});

	it('toString()', () => {
		const parse = str => consumeElement(new StreamReader(str));

		assert.equal(parse('div.foo*3').toString(), 'div[class="foo"]*3');
		assert.equal(parse('.foo[bar]/'), '[class="foo" bar]/');
	});
});
