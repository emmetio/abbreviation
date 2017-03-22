'use strict';

import { isNumber } from '@emmetio/stream-reader-utils';

const ASTERISK = 42; // *

/**
 * Consumes node repeat token from current stream position and returns its
 * parsed value
 * @param  {StringReader} stream
 * @return {Object}
 */
export default function(stream) {
	if (stream.eat(ASTERISK)) {
		stream.start = stream.pos;

		// XXX think about extending repeat syntax with through numbering
		return { count: stream.eatWhile(isNumber) ? +stream.current() : null };
	}
}
