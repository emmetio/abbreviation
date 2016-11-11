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
		this._attributes = new Map();

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
		return Array.from(this._attributes.values()).map(attrToObject);
	}

	/**
	 * Check if current node is a grouping one, e.g. has no actual representation
	 * and is used for grouping subsequent nodes only
	 * @return {Boolean}
	 */
	get isGroup() {
		return !this.name && !this.value && !this._attributes.size;
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
	 * @param {String|Object|Attribute} Attribute name or attribute object
	 * @param {String} [value] Attribute value
	 */
	setAttribute(name, value) {
		let attr;
		if (name instanceof Attribute) {
			attr = name;
		} else if (typeof name === 'string') {
			attr = new Attribute(name, value);
		} else if (name && typeof name === 'object') {
			attr = new Attribute(name.name, name.value, name.options);
		}

		this._attributes.set(attr.name, attr);
	}

	/**
	 * Check if attribute with given name exists in node
	 * @param  {String} name
	 * @return {Boolean}
	 */
	hasAttribute(name) {
		return this._attributes.has(name);
	}

	/**
	 * Returns attribute object by given name
	 * @param  {String} name
	 * @return {Attribute}
	 */
	getAttribute(name) {
		return this._attributes.get(name);
	}

	/**
	 * Removes attribute with given name
	 * @param  {String} name
	 */
	removeAttribute(name) {
		return this._attributes.delete(name);
	}

	/**
	 * Adds given class name to class attribute
	 * @param {String} token Class name token
	 */
	addClass(token) {
		token = normalize(token);
		if (!this.hasAttribute('class')) {
			this.setAttribute('class', token);
		} else if (token != null && token !== '') {
			this.getAttribute('class').value.add(token);
		}
	}

	/**
	 * Check if current node contains given class name
	 * @param {String} token Class name token
	 * @return {Boolean}
	 */
	hasClass(token) {
		token = normalize(token);
		return this.hasAttribute('class') && this.getAttribute('class').value.has(token);
	}

	/**
	 * Removes given class name from class attribute
	 * @param {String} token Class name token
	 */
	removeClass(token) {
		token = normalize(token);
		if (this.hasClass(token)) {
			this.getAttribute('class').value.delete(token);
		}
	}

	/**
	 * Appends child to current node
	 * @param {Node} node
	 */
	appendChild(node) {
		node.remove();
		const lastChild = last(this.children);

		node.parent = this;
		if (lastChild) {
			node.previous = lastChild;
			lastChild.next = node;
		}

		this.children.push(node);
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
	 * @return {Node}
	 */
	clone() {
		const clone = new Node(this.name);
		clone.value = this.value;
		clone.selfClosing = this.selfClosing;
		if (this.repeat) {
			clone.repeat = Object.assign({}, this.repeat);
		}

		this._attributes.forEach(attr => clone.setAttribute(attr.clone()));

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
