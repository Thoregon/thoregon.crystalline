/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import EError from "/evolux.supervise/lib/error/eerror.mjs";

export const ErrNotImplemented          = (msg)         => new EError(`Method not implemented: ${msg}`,         "CRYST:00001");


export const ErrNoQueue                 = (msg)         => new EError(`No Queue found: ${msg}`,                 "CRYST:00002");
