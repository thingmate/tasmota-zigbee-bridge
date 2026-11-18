import type { TasmotaZbConfig } from '@thingmate/vendor-tasmota';
import type { ZigbeeCoordinatorConfig } from '@thingmate/zigbee';
import { hexToBigInt, hexToNumber } from '@xstd/hex';

/**
 * Converts a {@link TasmotaZbConfig}, as returned by the Tasmota `ZbConfig`
 * command, into an equivalent {@link ZigbeeCoordinatorConfig}.
 *
 * Hex strings are decoded back into numbers, and the `KeyL` / `KeyH` halves
 * are reassembled into the 16-byte little-endian 128-bit network key.
 * @returns The equivalent Zigbee coordinator network configuration.
 */
export function tasmotaZbConfigToZigbeeCoordinatorConfig({
  Channel,
  PanID,
  ExtPanID,
  KeyL,
  KeyH,
  TxRadio,
}: TasmotaZbConfig): ZigbeeCoordinatorConfig {
  const buffer: ArrayBuffer = new ArrayBuffer(16);
  const view: DataView = new DataView(buffer);

  view.setBigUint64(0, hexToBigInt(KeyL), true);
  view.setBigUint64(8, hexToBigInt(KeyH), true);

  return {
    channel: Channel,
    panId: hexToNumber(PanID),
    extPanId: hexToBigInt(ExtPanID),
    key: new Uint8Array(buffer),
    txRadio: TxRadio,
  };
}
