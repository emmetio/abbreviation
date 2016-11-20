'use strict';

import Attribute from './attribute';
import { last } from './utils';

/**
 * A parsed abbreviation AST node. Nodes build up an abbreviation AST tree
 */
export default class Node {
	/**
	 * Creates a new node
	 * @param {String} [name] Node name
	 * @param {Array} [attributes] Array of attributes to add
	 */
	constructor(name, attributes) {
		// own properties
		this.name = name || null;
		this.value = null;
		this.repeat = null;
		this.selfClosing = false;

		/** @type Node */
		this.parent = null;
		this.children = [];
		this.next = null;
		this.previous = null;
		this._attributes = [];

		if (Array.isArray(attributes)) {
			attributes.forEach(attr => this.setAttribute(attr));
		}
	}

	/**
	 * Array of current node attributes
	 * @return {Array} Array of plain attribute objects with
	 * `name` and `value` properties
	 */
	get attributes() {
		return this._attributes.map(attrToObject);
	}

	/**
	 * Check if current node is a grouping one, e.g. has no actual representation
	 * and is used for grouping subsequent nodes only
	 * @return {Boolean}
	 */
	get isGroup() {
		return !this.name && !this.value && !this._attributes.length;
	}

	/**
	 * Returns first child node
	 * @return {Node}
	 */
	get firstChild() {
		return this.children[0];
	}

	/**
	 * Sets given attribute for current node
	 * @param {String|Object|Attribute} name Attribute name or attribute object
	 * @param {String} [value] Attribute value
	 */
	setAttribute(name, value) {
		const attr = createAttribute(name, value);
		const curAttr = this.getAttribute(name);
		if (curAttr) {
			this.replaceAttribute(curAttr, attr);
		} else {
			this._attributes.push(attr);
		}
	}

	/**
	 * Check if attribute with given name exists in node
	 * @param  {String} name
	 * @return {Boolean}
	 */
	hasAttribute(name) {
		return !!this.getAttribute(name);
	}

	/**
	 * Returns attribute object by given name
	 * @param  {String} name
	 * @return {Attribute}
	 */
	getAttribute(name) {
		if (typeof name === 'object') {
			name = name.name;
		}

		for (var i = 0; i < this._attributes.length; i++) {
			const attr = this._attributes[i];
			if (attr.name === name) {
				return attr;
			}
		}
	}

	/**
	 * Replaces attribute with new instance
	 * @param {String|Attribute} curAttribute Current attribute name or instance
	 * to replace
	 * @param {String|Object|Attribute} newName New attribute name or attribute object
	 * @param {String} [newValue] New attribute value
	 */
	replaceAttribute(curAttribute, newName, newValue) {
		if (typeof curAttribute === 'string') {
			curAttribute = this.getAttribute(curAttribute);
		}

		const ix = this._attributes.indexOf(curAttribute);
		if (ix !== -1) {
			this._attributes.splice(ix, 1, createAttribute(newName, newValue));
		}
	}

	/**
	 * Removes attribute with given name
	 * @param  {String|Attribute} attr Atrtibute name or instance
	 */
	removeAttribute(attr) {
		if (typeof attr === 'string') {
			attr = this.getAttribute(attr);
		}

		const ix = this._attributes.indexOf(attr);
		if (ix !== -1) {
			this._attributes.splice(ix, 1);
		}
	}

	/**
	 * Adds given class name to class attribute
	 * @param {String} token Class name token
	 */
	addClass(token) {
		token = normalize(token);
		const attr = this.getAttribute('class');

		if (!attr) {
			this.setAttribute('class', token);
		} else if (token != null && token !== '') {
			attr.value.add(token);
		}
	}

	/**
	 * Check if current node contains given class name
	 * @param {String} token Class name token
	 * @return {Boolean}
	 */
	hasClass(token) {
		token = normalize(token);
		const attr = this.getAttribute('class');
		return attr && attr.value.has(token);
	}

	/**
	 * Removes given class name from class attribute
	 * @param {String} token Class name token
	 */
	removeClass(token) {
		token = normalize(token);
		const attr = this.getAttribute('class');
		attr && attr.value.delete(token);
	}

	/**
	 * Appends child to current node
	 * @param {Node} node
	 */
	appendChild(node) {
		this.insertAt(node, this.children.length);
	}

	/**
	 * Inserts given `newNode` before `refNode` child node
	 * @param {Node} newNode
	 * @param {Node} refNode
	 */
	insertBefore(newNode, refNode) {
		this.insertAt(newNode, this.children.indexOf(refNode));
	}

	/**
	 * Insert given `node` at `pos` position of child list
	 * @param {Node} node
	 * @param {Number} pos
	 */
	insertAt(node, pos) {
		if (pos < 0 || pos > this.children.length) {
			throw new Error('Unable to insert node: position is out of child list range');
		}

		const prev = this.children[pos - 1];
		const next = this.children[pos];

		node.remove();
		node.parent = this;
		this.children.splice(pos, 0, node);

		if (prev) {
			node.previous = prev;
			prev.next = node;
		}

		if (next) {
			node.next = next;
			next.previous = node;
		}
	}

	/**
	 * Removes given child from current node
	 * @param {Node} node
	 */
	removeChild(node) {
		const ix = this.children.indexOf(node);
		if (ix !== -1) {
			this.children.splice(ix, 1);
			if (node.previous) {
				node.previous.next = node.next;
			}

			if (node.next) {
				node.next.previous = node.previous;
			}

			node.parent = node.next = node.previous = null;
		}
	}

	/**
	 * Removes current node from its parent
	 */
	remove() {
		if (this.parent) {
			this.parent.removeChild(this);
		}
	}

	/**
	 * Creates a detached copy of current node
	 * @param {Boolean} deep Clone node contents as well
	 * @return {Node}
	 */
	clone(deep) {
		const clone = new Node(this.name);
		clone.value = this.value;
		clone.selfClosing = this.selfClosing;
		if (this.repeat) {
			clone.repeat = Object.assign({}, this.repeat);
		}

		this._attributes.forEach(attr => clone.setAttribute(attr.clone()));

		if (deep) {
			this.children.forEach(child => clone.appendChild(child.clone(true)));
		}

		return clone;
	}

	/**
	 * Walks on each descendant node and invokes given `fn` function on it.
	 * The function receives two arguments: the node itself and its depth level
	 * from current node. If function returns `false`, it stops walking
	 * @param {Function} fn
	 */
	walk(fn, _level) {
		_level = _level || 0;
		let ctx = this.firstChild;

		while (ctx) {
			// in case if context node will be detached during `fn` call
			const next = ctx.next;

			if (fn(ctx, _level) === false || ctx.walk(fn, _level + 1) === false) {
				return false;
			}

			ctx = next;
		}
	}

	/**
	 * A helper method for transformation chaining: runs given `fn` function on
	 * current node and returns the same node
	 */
	use(fn) {
		const args = [this];
		for (var i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}

		fn.apply(null, args);
		return this;
	}
}

/**
 * Attribute factory
 * @param  {String|Attribute|Object} name  Attribute name or attribute descriptor
 * @param  {*} value Attribute value
 * @return {Attribute}
 */
function createAttribute(name, value) {
	if (name instanceof Attribute) {
		return name;
	}

	if (typeof name === 'string') {
		return new Attribute(name, value);
	}

	if (name && typeof name === 'object') {
		return new Attribute(name.name, name.value, name.options);
	}
}

function attrToObject(attr) {
	return {
		name: attr.name,
		value: attr.valueOf()
	};
}

/**
 * @param  {String} str
 * @return {String}
 */
function normalize(str) {
	return String(str).trim();
}
