'use strict';

import consumeQuoted from './quoted';
import consumeTextNode from './text';

const reAttributeName = /^\!?[\w\-:\$@]+\.?$/;
const reSpaceChar = /[\s\u00a0]/;
const reUnquotedValueChar = /[^\s\u00a0\[\]='"]/;

/**
 * Consumes attributes defined in square braces from given stream.
 * Example:
 * [attr col=3 title="Quoted string" selected. support={react}]
 * @param {StringReader} stream
 * @returns {Array} Array of consumed attributes
 */
export default function(stream) {
	if (!stream.eat('[')) {
		return null;
	}

	const result = [];

	while (!stream.eol()) {
		stream.eatWhile(reSpaceChar);

		if (stream.eat(']')) {  // end of attribute set
			return result;
		}

		let next = consumeQuoted(stream);
		if (next !== null) {
			// Found quoted default value
			result.push({name: null, value: next});
			continue;
		}

		// Consume next word: could be either attribute name or unquoted default value
		if (next = stream.consume(reUnquotedValueChar)) {
			if (!reAttributeName.test(next)) {
				result.push({name: null, value: next});
				continue;
			}
		} else {
			throw stream.error('Expected attribute name or default value');
		}

		const attr = {name: next};
		result.push(attr);

		// Check for last character: if it’s a `.`, user wants boolean attribute
		if (next[next.length - 1] === '.') {
			attr.name = next.slice(0, next.length - 1);
			attr.options = {boolean: true};
			continue;
		}

		// If a first character in attribute name is `!` — it’s an implied
		// default attribute
		if (next[0] === '!') {
			attr.name = next.slice(1);
			attr.options = {implied: true};
		}

		// Explicitly defined value. Could be a word, a quoted string
		// or React-like expression
		if (stream.eat('=')) {
			if ((next = consumeQuoted(stream)) !== null) {
				attr.value = next;
			} else if ((next = consumeTextNode(stream)) !== null) {
				attr.value = next;
				attr.options = {
					before: '{',
					after: '}'
				}
			} else {
				attr.value = stream.consume(reUnquotedValueChar);
			}
		}
	}

	throw stream.error('Expected closing "]" brace in attribute set');
}
