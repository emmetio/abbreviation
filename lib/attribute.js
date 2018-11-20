'use strict';

import { isWhiteSpace, isSpace, isQuote, isAlphaNumeric } from '@emmetio/stream-reader-utils';
import consumeQuoted from './quoted';
import consumeTextNode from './text';

const EXCL       = 33; // .
const DOT        = 46; // .
const EQUALS     = 61; // =
const ATTR_OPEN  = 91; // [
const ATTR_CLOSE = 93; // ]

const reAttributeName = /^\!?[\w\-:\$@]+\.?$|^\!?\[[\w\-:\$@]+\]\.?$/;

/**
 * Consumes attributes defined in square braces from given stream.
 * Example:
 * [attr col=3 title="Quoted string" selected. support={react}]
 * @param {StringReader} stream
 * @returns {Array} Array of consumed attributes
 */
export default function(stream) {
	if (!stream.eat(ATTR_OPEN)) {
		return null;
	}

	const result = [];
	let token, attr;

	while (!stream.eof()) {
		stream.eatWhile(isWhiteSpace);

		if (stream.eat(ATTR_CLOSE)) {
			return result; // End of attribute set
		} else if ((token = consumeQuoted(stream)) != null) {
			// Consumed quoted value: anonymous attribute
			result.push({
				name: null,
				value: token
			});
		} else if (eatUnquoted(stream)) {
			// Consumed next word: could be either attribute name or unquoted default value
			token = stream.current();

			// In angular attribute names can be surrounded by []
			if (token[0] === '[' && stream.peek() === ATTR_CLOSE) {
				stream.next();
				token = stream.current();
			}
			
			if (!reAttributeName.test(token)) {
				// anonymous attribute
				result.push({ name: null, value: token });
			} else {
				// Looks like a regular attribute
				attr = parseAttributeName(token);
				result.push(attr);

				if (stream.eat(EQUALS)) {
					// Explicitly defined value. Could be a word, a quoted string
					// or React-like expression
					if ((token = consumeQuoted(stream)) != null) {
						attr.value = token;
					} else if ((token = consumeTextNode(stream)) != null) {
						attr.value = token;
						attr.options = {
							before: '{',
							after: '}'
						}
					} else if (eatUnquoted(stream)) {
						attr.value = stream.current();
					}
				}
			}
		} else {
			throw stream.error('Expected attribute name');
		}
	}

	throw stream.error('Expected closing "]" brace');
}

function parseAttributeName(name) {
	const options = {};

	// If a first character in attribute name is `!` — it’s an implied
	// default attribute
	if (name.charCodeAt(0) === EXCL) {
		name = name.slice(1);
		options.implied = true;
	}

	// Check for last character: if it’s a `.`, user wants boolean attribute
	if (name.charCodeAt(name.length - 1) === DOT) {
		name = name.slice(0, name.length - 1);
		options.boolean = true;
	}

	const attr = { name };
	if (Object.keys(options).length) {
		attr.options = options;
	}

	return attr;
}

/**
 * Eats token that can be an unquoted value from given stream
 * @param  {StreamReader} stream
 * @return {Boolean}
 */
function eatUnquoted(stream) {
	const start = stream.pos;
	if (stream.eatWhile(isUnquoted)) {
		stream.start = start;
		return true;
	}
}

function isUnquoted(code) {
	return !isSpace(code) && !isQuote(code)
		 && code !== ATTR_CLOSE && code !== EQUALS;
}
