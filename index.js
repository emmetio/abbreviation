'use strict';

import Node from './lib/node';
import createStream from './lib/string-stream';

const operators = new Set(['>', '^', '+']);
const reNameChar = /[\w\-\$\:@\!%]/;
const reWordChar = /[\w\-:\$@]/;
const reAttributeChar = /[\w\-:\$@\.]/;
const reSpace = /[\s\u00a0]/;
const reNonSpace = /[^\s\u00a0]/;

/**
 * Parses given string into a node tree
 * @param  {String} str Abbreviation to parse
 * @return {Node}
 */
export default function parse(str) {
    const stream = createStream(str.trim());
    const root = new Node();
    let ctx = root;

    while (!stream.eol()) {
        const operator = operators.has(stream.peek()) ? stream.next() : null;

        // resolve node insertion point by operator
        switch (operator) {
            case '+': // sibling operator
                if (ctx.parent) {
                    ctx = ctx.parent;
                }
                break;

            case '^': // climb up operator
                stream.backUp(1);

                // it’s perfectly valid to have multiple `^` operators
                while (stream.peek() === '^') {
                    if (ctx.parent) {
                        ctx = ctx.parent;
                    }
                    stream.next();
                }
                break;
        }

        const node = ctx.parent(stream);
        ctx = ctx.appendChild(node);
        ctx = node;
    }

    return root;
}

/**
 * Consumes a single node from current abbreviation string
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
			node.addAttribute('id', stream.consume(reWordChar));
		} else if (ch === '[') {
			consumeAttributes(stream).forEach(attr => node.addAttribute(attr));
		} else if (ch === '{') {
			node.value = consumeTextNode(stream);
		} else if (reNameChar.test(ch)) {
			node.name = stream.consume(reNameChar);
		} else {
			break;
		}
    }

	if (start === stream.pos) {
		throw stream.error('Unable to consume abbreviation node');
	}

	return node;
}

/**
 * Consumes attributes defined in square braces.
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
	stream.start = stream.pos;

	while (!stream.eol()) {
		stream.consume(reSpace);
		if (stream.peek() === ']') { // end of attribute set
			break;
		}

		const attrName = stream.consume(reWordChar);
		if (!attrName) {
			throw stream.error('Expected attribute name');
		}

		const attr = {name: attrName};
		result.push(attr);

		// Check for last character: if it’s a `.`, user wants boolean attribute
		if (attrName[attrName.length - 1] === '.') {
			attr.name = attrName.slice(0, attrName.length - 1);
			attr.boolean = true;
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
				continue;
			}

			attr.value = stream.consume(reNonSpace);
			if (!attr.value) {
				throw stream.error('Expected attribute value');
			}
		}
	}

	return result;
}

/**
 * Consumes quoted literal from current stream position and returns it’s inner,
 * unquoted, value
 * @param  {StringStream} stream
 * @return {String}
 */
function consumeQuoted(stream) {
	const quote = stream.next();
	if (!isQuote(quote)) {
		throw stream.error('Expected single or double quote for string literal');
	}

	stream.start = stream.pos;
	if (!stream.skipQuoted(quote)) {
		throw stream.error(`Unable to find matching ${quote} for string literal`);
	}

	return stream.string.slice(stream.start, stream.pos - 1);
}

/**
 * Consumes text node, e.g. contents of `{...}` and returns its inner value
 * @param  {StringStream} stream [description]
 * @return {String}
 */
function consumeTextNode(stream) {
	if (stream.next() !== '{') {
		stream.backUp(1);
		throw stream.error('Expected { as a beginning of text node');
	}

	stream.start = stream.pos;

	while (!stream.eol()) {
		const ch = stream.peek();
		if (isQuote(ch)) {
			consumeQuoted(stream);
			continue;
		}

		if (ch === '}') {
			const result = stream.current();
			stream.next();
			return result;
		}

		stream.next();
	}

	throw stream.error('Unexpected end-of-line when consuming text node');
}

/**
 * Check if given character is a valid quote
 * @param  {String}  ch
 * @return {Boolean}
 */
function isQuote(ch) {
	return ch === '"' || ch === "'";
}
