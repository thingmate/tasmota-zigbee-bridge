import type { TasmotaZbZCLReceived } from '@thingmate/vendor-tasmota';
import type { ZCLCommandFrame } from '@thingmate/zigbee';
import { hexToNumber, hexToUint8Array } from '@xstd/hex';

/**
 * Converts a `ZbZCLReceived` Tasmota log message into an equivalent
 * {@link ZCLCommandFrame}.
 *
 * Hex strings are decoded back into numbers and bytes, the frame type and
 * direction flags are normalized (`frametype: 1` becomes `clusterSpecific`,
 * `direction: 0` becomes `client-to-server`).
 * @returns The equivalent ZCL command frame.
 */
export function tasmotaZbZCLReceivedToZCLCommandFrame({
  srcaddr,
  srcendpoint,
  clusterid,
  direction,
  frametype,
  cmdid,
  payload,
}: TasmotaZbZCLReceived): ZCLCommandFrame {
  return {
    device: hexToNumber(srcaddr),
    endpoint: srcendpoint,
    cluster: hexToNumber(clusterid),
    clusterSpecific: frametype === 1,
    direction: direction === 0 ? 'client-to-server' : 'server-to-client',
    command: hexToNumber(cmdid),
    payload: hexToUint8Array(payload),
  };
}
