/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import EError from "/evolux.supervise/lib/error/eerror.mjs";

export const ErrNotImplemented          = (msg)         => new EError(`Method not implemented: ${msg}`,         "CRYST:00001");
