'use strict';

import { eatQuoted } from '@emmetio/stream-reader-utils';

const opt = { throws: true };

/**
 * Consumes quoted literal from current stream position and returns it’s inner,
 * unquoted, value
 * @param  {StringReader} stream
 * @return {String} Returns `null` if unable to consume quoted value from current
 * position
 */
export default function(stream) {
	if (eatQuoted(stream, opt)) {
		return stream.current().slice(1, -1);
	}
}
