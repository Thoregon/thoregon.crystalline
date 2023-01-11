/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { doAsync, timeout } from "/evolux.universe";
import { isNil, isString }  from "/evolux.util/lib/objutils.mjs";

export const isDev = () => { try { return thoregon.isDev } catch (ignore) { return false } };

let $persistenceRoot = universe.gun;     // Node.root() for testing
export const persistenceRoot = () => $persistenceRoot ?? ($persistenceRoot = universe.gun);

/** persistence ***********************************************************************************/

export async function materialized(root) {
    if (isString(root)) root = persistenceRoot.get(root);
    if (await is(root)) return true;
    await timeout(200);  // get rid of this workaround! gun sometimes sync to slow with other peers
    return await is(root);   // check again
}

/** native gun access ***********************************************************************************/

export function is(gunnode) {
    return new Promise(resolve => {
        gunnode
            .once(() => resolve(true))
            .not(() => resolve(false));
    });
}

export function soul(gunnode) {
    return new Promise(resolve => {
        gunnode
            .once(item => resolve(universe.Gun.node.soul(item)))
            .not(() => resolve(undefined));
    });
}

export function val(gunnode) {
    return new Promise(resolve => {
        gunnode.once((data, key) => {
            resolve(data);
        }).not(() => resolve());
    });
}

/********************************************************************************************************/
