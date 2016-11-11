'use strict';

import { isQuote } from '../utils';

/**
 * Consumes quoted literal from current stream position and returns it’s inner,
 * unquoted, value
 * @param  {StringStream} stream
 * @return {String}
 */
export default function(stream) {
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
