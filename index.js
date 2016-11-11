'use strict';

import Node from './lib/node';
import createStream from './lib/string-stream';

const reNameChar = /[\w\-\$\:@\!%]/;
const reWordChar = /[\w\-:\$@]/;
const reAttributeName = /^[\w\-:\$@]+\.?$/;
const reSpaceChar = /[\s\u00a0]/;
const reUnquotedValueChar = /[^\s\u00a0\[\]\{\}='"]/;

/**
 * Parses given string into a node tree
 * @param  {String} str Abbreviation to parse
 * @return {Node}
 */
export default function parse(str) {
	const stream = createStream(str.trim());
	const root = new Node();
	let ctx = root;
	let groupStack = [];

	while (!stream.eol()) {
		const ch = stream.peek();
		if (ch === '(') { // start of group
			// The grouping node should be detached to properly handle
			// out-of-bounds `^` operator. Node will be attached right on group end
			const node = new Node();
			const groupCtx = groupStack.length ? last(groupStack)[0] : ctx;
			groupStack.push([node, groupCtx, stream.pos]);
			ctx = node;
			stream.next();
			continue;
		} else if (ch === ')') { // end of group
			const lastGroup = groupStack.pop();
			if (!lastGroup) {
				throw stream.error('Unexpected ")" group end');
			}

			const node = lastGroup[0];
			ctx = lastGroup[1];
			stream.next();

			// a group can have a repeater
			if (stream.peek() === '*') {
				node.repeat = consumeRepeat(stream);
				ctx.appendChild(node);
			} else {
				// move all children of group into parent node
				while (node.firstChild) {
					ctx.appendChild(node.firstChild);
				}
				// for convenience, groups can be joined with optional `+` operator
				stream.eat('+');
			}

			continue;
		}

		const node = consumeNode(stream);
		ctx.appendChild(node);

		switch (stream.peek()) {
			case '':  // end-of-line
			case '+': // sibling operator
				stream.next();
				continue;

			case '>': // child operator
				stream.next();
				ctx = node;
				continue;

			case '^': // climb-up operator
				// it’s perfectly valid to have multiple `^` operators
				while (stream.next() === '^') {
					ctx = ctx.parent || ctx;
				}
				stream.backUp(1);
				continue;
		}
	}

	if (groupStack.length) {
		stream.pos = groupStack.pop()[2];
		throw stream.error('Expected group close');
	}

	return root;
}

/**
 * Consumes a single node from current abbreviation stream
 * @param  {StringStream} stream
 * @return {Node}
 */
export function consumeNode(stream) {
	const node = new Node();
	const start = stream.pos;

	while (!stream.eol()) {
		const ch = stream.peek();

		if (ch === '.') {
			stream.next();
			node.addClass(stream.consume(reWordChar));
		} else if (ch === '#') {
			stream.next();
			node.setAttribute('id', stream.consume(reWordChar));
		} else if (ch === '[') {
			const attrs = consumeAttributes(stream);
			for (let i = 0, il = attrs.length; i < il; i++) {
				node.setAttribute(attrs[i]);
			}
		} else if (ch === '{') {
			node.value = consumeTextNode(stream);
		} else if (reNameChar.test(ch) && stream.pos === start) {
			node.name = stream.consume(reNameChar);
		} else if (ch === '*') {
			node.repeat = consumeRepeat(stream);
		} else if (ch === '/') {
			// A self-closing indicator must be at the end of non-grouping node
			if (node.isGroup) {
				throw stream.error('Unexpected self-closing indicator');
			}
			stream.next();
			node.selfClosing = true;
			break;
		} else {
			break;
		}
	}

	if (start === stream.pos) {
		throw stream.error(`Unable to consume abbreviation node, unexpected ${stream.peek()}`);
	}

	return node;
}

/**
 * Consumes attributes defined in square braces from given stream.
 * Example:
 * [attr col=3 title="Quoted string" selected. support={react}]
 * @param {StringStream} stream
 * @returns {Array}
 */
export function consumeAttributes(stream) {
	if (stream.next() !== '[') {
		throw stream.error('Expected "[" brace');
	}

	const result = [];

	while (!stream.eol()) {
		stream.consume(reSpaceChar);
		const next = stream.peek();

		if (next === ']') { // end of attribute set
			stream.next();
			return result;
		}

		if (isQuote(next)) {
			// Found quoted default value
			result.push({name: null, value: consumeQuoted(stream)});
			continue;
		}

		// Consume next word: could be either attribute name or unquoted default value
		const nextWord = stream.consume(reUnquotedValueChar);
		if (!nextWord) {
			throw stream.error('Expected attribute name or default value');
		}

		if (!reAttributeName.test(nextWord)) {
			result.push({name: null, value: nextWord});
			continue;
		}

		const attr = {name: nextWord};
		result.push(attr);

		// Check for last character: if it’s a `.`, user wants boolean attribute
		if (nextWord[nextWord.length - 1] === '.') {
			attr.name = nextWord.slice(0, nextWord.length - 1);
			attr.options = {boolean: true};
			continue;
		}

		// Explicitly defined value. Could be a word, a quoted string
		// or React-like expression
		if (stream.peek() === '=') {
			stream.next();
			const next = stream.peek();

			if (isQuote(next)) {
				attr.value = consumeQuoted(stream);
				continue;
			}

			if (next === '{') {
				attr.value = consumeTextNode(stream);
				attr.options = {
					before: '{',
					after: '}'
				}
				continue;
			}

			attr.value = stream.consume(reUnquotedValueChar);
		}
	}

	throw stream.error('Expected closing "]" brace in attribute set');
}

/**
 * Consumes text node, e.g. contents of `{...}` and returns its inner value
 * @param  {StringStream} stream [description]
 * @return {String}
 */
export function consumeTextNode(stream) {
	if (stream.next() !== '{') {
		stream.backUp(1);
		throw stream.error('Expected { as a beginning of text node');
	}

	const start = stream.pos;
	let stack = 1;

	while (!stream.eol()) {
		if (isQuote(stream.peek())) {
			consumeQuoted(stream);
			continue;
		}

		const ch = stream.next();
		if (ch === '{') {
			stack++;
			continue;
		} else if (ch === '}') {
			stack--;
			if (!stack) {
				return stream.string.slice(start, stream.pos - 1);
			}
		} else if (ch === '\\') {
			stream.next();
			continue;
		}
	}

	throw stream.error('Unable to find matching } for text node');
}

/**
 * Consumes quoted literal from current stream position and returns it’s inner,
 * unquoted, value
 * @param  {StringStream} stream
 * @return {String}
 */
export function consumeQuoted(stream) {
	const quote = stream.next();
	if (!isQuote(quote)) {
		stream.backUp(1);
		throw stream.error('Expected single or double quote for string literal');
	}

	const start = stream.pos;
	if (!stream.skipQuoted(quote)) {
		throw stream.error(`Unable to find matching ${quote} for string literal`);
	}

	return stream.string.slice(start, stream.pos - 1);
}

/**
 * Consumes node repeat token from current stream position and returns its
 * @param  {StringStream} stream
 * @return {Object}
 */
export function consumeRepeat(stream) {
	if (stream.next() !== '*') {
		stream.backUp(1);
		throw stream.error('Expected * character for repeater');
	}

	const value = stream.consume(/[0-9]/);
	// XXX think about extending repeat syntax with through numbering
	return {count: value ? +value : null};
}

/**
 * Check if given character is a valid quote
 * @param  {String}  ch
 * @return {Boolean}
 */
function isQuote(ch) {
	return ch === '"' || ch === "'";
}

/**
 * Returns last item from given array
 * @param  {Array} arr
 * @return {*}
 */
function last(arr) {
	return arr[arr.length - 1];
}
