'use strict';

const assert = require('assert');
require('babel-register');
const Node = require('../lib/node').default;
const Attribute = require('../lib/attribute').default;

describe('Node', () => {
	it('create tree', () => {
		const root = new Node();
		const a = new Node('a');
		const b = new Node('b');
		const c = new Node('c');

		assert.equal(a.name, 'a');
		assert.equal(b.name, 'b');
		assert.equal(c.name, 'c');

		root.appendChild(a);
		assert.equal(root.children.length, 1);
		assert.equal(root.firstChild, a);
		assert.equal(a.parent, root);
		assert.equal(a.previous, null);
		assert.equal(a.next, null);

		// ensure children are making up a linked list
		root.appendChild(b);
		assert.equal(root.children.length, 2);
		assert.equal(root.firstChild, a);
		assert.equal(a.previous, null);
		assert.equal(a.next, b);
		assert.equal(b.previous, a);
		assert.equal(b.next, null);

		root.appendChild(c);
		assert.equal(root.children.length, 3);
		assert.equal(root.firstChild, a);
		assert.equal(a.previous, null);
		assert.equal(a.next, b);
		assert.equal(b.previous, a);
		assert.equal(b.next, c);
		assert.equal(c.previous, b);
		assert.equal(c.next, null);

		// re-append existing child to change children order
		root.appendChild(a);
		assert.equal(root.children.length, 3);
		assert.equal(root.firstChild, b);
		assert.equal(b.previous, null);
		assert.equal(b.next, c);
		assert.equal(c.previous, b);
		assert.equal(c.next, a);
		assert.equal(a.previous, c);
		assert.equal(a.next, null);

		// remove node and maintain a linked list
		c.remove();
		assert.equal(root.children.length, 2);
		assert.equal(root.firstChild, b);
		assert.equal(b.previous, null);
		assert.equal(b.next, a);
		assert.equal(a.previous, b);
		assert.equal(a.next, null);
		assert.equal(c.previous, null);
		assert.equal(c.next, null);
		assert.equal(c.parent, null);

		// remove detached node: do not throw error
		c.remove();
	});

	it('attributes', () => {
		const a = new Node('a');
		assert.equal(a.attributes.length, 0);

		a.setAttribute('foo', 'bar');
		assert(a.hasAttribute('foo'));
		assert(!a.hasAttribute('bar'));
		assert.deepEqual(a.attributes, [{name: 'foo', value: 'bar'}]);

		a.setAttribute('foo', 'baz');
		assert.deepEqual(a.attributes, [{name: 'foo', value: 'baz'}]);
		assert.equal(a.getAttribute('foo').value, 'baz');

		a.setAttribute('a', 'b');
		assert.deepEqual(a.attributes, [
			{name: 'foo', value: 'baz'},
			{name: 'a', value: 'b'}
		]);

		a.removeAttribute('foo');
		assert.equal(a.attributes.length, 1);
		assert.deepEqual(a.attributes, [{name: 'a', value: 'b'}]);

		const b = new Node('b', [{name: 'foo', value: 'bar'}, 'a']);
		assert.equal(b.attributes.length, 2);
		assert.deepEqual(b.attributes, [
			{name: 'foo', value: 'bar'},
			{name: 'a', value: null}
		]);
	});

	it('class names', () => {
		const a = new Node('a');
		assert.equal(a.attributes.length, 0);

		a.addClass('foo');
		assert.deepEqual(a.attributes, [{name: 'class', value: 'foo'}]);

		a.addClass('foo');
		a.addClass('bar');
		assert(a.hasClass('foo'));
		assert(a.hasClass('bar'));
		assert(!a.hasClass('baz'));
		assert.deepEqual(a.attributes, [{name: 'class', value: 'foo bar'}]);

		a.removeClass('foo');
		a.removeClass('baz');
		assert.deepEqual(a.attributes, [{name: 'class', value: 'bar'}]);

		const b = new Node('b', [{name: 'class', value: 'foo bar'}]);
		assert(b.hasClass('foo'));
		assert(b.hasClass('bar'));
	});

	it('clone', () => {
		const a = new Node('a', [
			{name: 'class', value: 'foo bar'},
			new Attribute('selected', null, {boolean: true})
		]);

		assert.deepEqual(a.attributes, [
			{name: 'class', value: 'foo bar'},
			{name: 'selected', value: null}
		]);

		const b = a.clone();

		assert.equal(b.name, 'a');
		assert.deepEqual(b.attributes, [
			{name: 'class', value: 'foo bar'},
			{name: 'selected', value: null}
		]);

		assert(b.getAttribute('selected').options.boolean);

		// update origin and make sure changes are not reflected to clone
		a.removeClass('bar');
		const opt = a.getAttribute('selected').options;
		opt.boolean = false;

		assert.equal(a.getAttribute('class').valueOf(), 'foo');
		assert.equal(b.getAttribute('class').valueOf(), 'foo bar');

		assert.equal(a.getAttribute('selected').options.boolean, false);
		assert.equal(b.getAttribute('selected').options.boolean, true);
	});

	it('deep clone', () => {
		const a = new Node('a', [{name: 'foo', 'value': 'bar'}]);
		const b = new Node('b', [{name: 'bar', 'value': 'baz'}]);
		a.appendChild(b);

		const a2 = a.clone(true);
		const b2 = a2.firstChild;

		a2.setAttribute('foo', 'bar2');
		b2.setAttribute('bar', 'baz2');

		assert(a !== a2);
		assert(b !== b2);

		assert.equal(a.name, a2.name);
		assert.equal(a.getAttribute('foo').value, 'bar');
		assert.equal(a2.getAttribute('foo').value, 'bar2');
		assert.equal(b.getAttribute('bar').value, 'baz');
		assert.equal(b2.getAttribute('bar').value, 'baz2');
	});

	it('walk', () => {
		const root = new Node();
		const a = new Node('a');
		const b = new Node('b');
		const c = new Node('c');
		const d = new Node('d');

		root.appendChild(a);
		a.appendChild(b);
		b.appendChild(c);
		root.appendChild(d);

		let walked = [];
		const fn = (node, level) => walked.push(`${node.name}:${level}`);

		root.walk(fn);
		assert.deepEqual(walked, ['a:0', 'b:1', 'c:2', 'd:0']);
		walked.length = 0;

		a.walk(fn);
		assert.deepEqual(walked, ['b:0', 'c:1']);
		walked.length = 0;

		// Explicitly stop iterator
		root.walk((node, level) => {
			walked.push(`${node.name}:${level}`);
			return node !== c;
		});
		assert.deepEqual(walked, ['a:0', 'b:1', 'c:2']);
		walked.length = 0;

		// Make sure iterator continues even if node is detached
		root.walk((node, level) => {
			walked.push(`${node.name}:${level}`);
			node.remove();
		});
		assert.deepEqual(walked, ['a:0', 'b:1', 'c:2', 'd:0']);
		walked.length = 0;
	});
});
