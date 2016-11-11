'use strict';

import consumeQuoted from './quoted';
import consumeTextNode from './text';
import { isQuote } from '../utils';

const reAttributeName = /^[\w\-:\$@]+\.?$/;
const reSpaceChar = /[\s\u00a0]/;
const reUnquotedValueChar = /[^\s\u00a0\[\]\{\}='"]/;

/**
 * Consumes attributes defined in square braces from given stream.
 * Example:
 * [attr col=3 title="Quoted string" selected. support={react}]
 * @param {StringStream} stream
 * @returns {Array} Array of consumed attributes
 */
export default function(stream) {
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
