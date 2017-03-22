'use strict';

import { eatPair } from '@emmetio/stream-reader-utils';

const LCURLY = 123; // {
const RCURLY = 125; // }

const opt = { throws: true };

/**
 * Consumes text node, e.g. contents of `{...}` and returns its inner value
 * @param  {StringReader} stream
 * @return {String} Consumed text content or `null` otherwise
 */
export default function(stream) {
	return eatPair(stream, LCURLY, RCURLY, opt)
		? stream.current().slice(1, -1)
		: null;
}
