'use strict';

const assert = require('assert');
require('babel-register');
const parse = require('../lib/parser').default;
const stringify = require('./assets/stringify').default;

describe('Parser', () => {
	function abbr(str) {
		return stringify(parse(str));
	}

	it('basic abbreviations', () => {
		assert.equal(abbr('a>b'), '<a><b></b></a>');
		assert.equal(abbr('a+b'), '<a></a><b></b>');
		assert.equal(abbr('a+b>c+d'), '<a></a><b><c></c><d></d></b>');
		assert.equal(abbr('a>b>c+e'), '<a><b><c></c><e></e></b></a>');
		assert.equal(abbr('a>b>c^d'), '<a><b><c></c></b><d></d></a>');
		assert.equal(abbr('a>b>c^^^^d'), '<a><b><c></c></b></a><d></d>');
	});

	it('groups', () => {
		assert.equal(abbr('a>(b>c)+d'), '<a><b><c></c></b><d></d></a>');
		assert.equal(abbr('(a>b)+(c>d)'), '<a><b></b></a><c><d></d></c>');
		assert.equal(abbr('a>((b>c)(d>e))f'), '<a><b><c></c></b><d><e></e></d><f></f></a>');
		assert.equal(abbr('a>((((b>c))))+d'), '<a><b><c></c></b><d></d></a>');
		assert.equal(abbr('a>(((b>c))*4)+d'), '<a>(<b><c></c></b>)*4<d></d></a>');
	});
});
