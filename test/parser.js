'use strict';

const assert = require('assert');
require('babel-register');
const parser = require('../lib/parser').default;
const expander = require('../index').default;
const stringify = require('./assets/stringify').default;

describe('Parser', () => {
	const parse = str => stringify(parser(str));
	const expand = str => stringify(expander(str));
	const expandWithLimit = (str, limit) => stringify(expander(str, limit));

	describe('Parse', () => {
		it('basic abbreviations', () => {
			assert.equal(parse('a>b'), '<a><b></b></a>');
			assert.equal(parse('a+b'), '<a></a><b></b>');
			assert.equal(parse('a+b>c+d'), '<a></a><b><c></c><d></d></b>');
			assert.equal(parse('a>b>c+e'), '<a><b><c></c><e></e></b></a>');
			assert.equal(parse('a>b>c^d'), '<a><b><c></c></b><d></d></a>');
			assert.equal(parse('a>b>c^^^^d'), '<a><b><c></c></b></a><d></d>');
		});

		it('groups', () => {
			assert.equal(parse('a>(b>c)+d'), '<a><b><c></c></b><d></d></a>');
			assert.equal(parse('(a>b)+(c>d)'), '<a><b></b></a><c><d></d></c>');
			assert.equal(parse('a>((b>c)(d>e))f'), '<a><b><c></c></b><d><e></e></d><f></f></a>');
			assert.equal(parse('a>((((b>c))))+d'), '<a><b><c></c></b><d></d></a>');
			assert.equal(parse('a>(((b>c))*4)+d'), '<a>(<b><c></c></b>)*4<d></d></a>');
			assert.equal(parse('(div>dl>(dt+dd)*2)'), '<div><dl>(<dt></dt><dd></dd>)*2</dl></div>');
		});
	});

	describe('Expand', () => {
		it('unroll repeated elements', () => {
			assert.equal(expand('a*2>b*3'), '<a*2@1><b*3@1></b><b*3@2></b><b*3@3></b></a><a*2@2><b*3@1></b><b*3@2></b><b*3@3></b></a>');
			assert.equal(expand('a>(b+c)*2'), '<a><b*2@1></b><c*2@1></c><b*2@2></b><c*2@2></c></a>');
		});

		it('unroll until limit is reached', () => {
			assert.equal(expandWithLimit('a*10', 2), '<a*10@1></a><a*10@2></a>');
			assert.equal(expandWithLimit('(ul>li)*3+span', 5), '<ul*3@1><li></li></ul><ul*3@2><li></li></ul><ul*3@3></ul>');
			assert.equal(expandWithLimit('a+b+c+d+e+f+g+h+i+j', 5), '<a></a><b></b><c></c><d></d><e></e>');
			assert.equal(expandWithLimit('a*2+b*6',5), '<a*2@1></a><a*2@2></a><b*6@1></b><b*6@2></b><b*6@3></b>');
			assert.equal(expandWithLimit('a>b>c>d>e>f>g', 5), '<a><b><c><d><e></e></d></c></b></a>');
		})
	});
});
