'use strict';

import consumeQuoted from './quoted';
import { isQuote } from '../utils';

/**
 * Consumes text node, e.g. contents of `{...}` and returns its inner value
 * @param  {StringStream} stream [description]
 * @return {String}
 */
export default function(stream) {
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
