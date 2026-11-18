import type { TasmotaZbConfig } from '@thingmate/vendor-tasmota';
import type { ZigbeeCoordinatorConfig } from '@thingmate/zigbee';
import { numberToHex } from '@xstd/hex';

/**
 * Converts a {@link ZigbeeCoordinatorConfig} into a {@link TasmotaZbConfig},
 * as accepted by the Tasmota `ZbConfig` command.
 *
 * Numeric identifiers (PAN id, extended PAN id) are rendered as uppercase
 * `0x`-prefixed hex strings. The 128-bit network key is split into its two
 * little-endian u64 halves (`KeyL` for the low bytes, `KeyH` for the high
 * bytes).
 * @returns The equivalent Tasmota Zigbee network configuration.
 * @throws {RangeError} When the network key is not exactly 16 bytes, when the
 *         PAN id is not an unsigned 16-bit integer, or when the extended PAN id
 *         is not an unsigned 64-bit integer.
 */
export function zigbeeCoordinatorConfigToTasmotaZbConfig({
  channel,
  panId,
  extPanId,
  key,
  txRadio,
}: ZigbeeCoordinatorConfig): TasmotaZbConfig {
  if (key.byteLength !== 16) {
    throw new RangeError(`Invalid network key: expected 16 bytes, got ${key.byteLength}`);
  }
  if (!Number.isInteger(panId) || panId < 0 || panId > 0xffff) {
    throw new RangeError(`Invalid PAN id: expected an unsigned 16-bit integer, got ${panId}`);
  }
  if (extPanId < 0n || extPanId > 0xffffffffffffffffn) {
    throw new RangeError(
      `Invalid extended PAN id: expected an unsigned 64-bit integer, got ${extPanId}`,
    );
  }

  const view: DataView = new DataView(key.buffer, key.byteOffset, key.byteLength);

  return {
    Channel: channel,
    PanID: numberToHex(panId, {
      bytes: 2,
      uppercase: true,
      prefixed: true,
    }),
    ExtPanID: numberToHex(extPanId, {
      bytes: 8,
      uppercase: true,
      prefixed: true,
    }),
    KeyL: numberToHex(view.getBigUint64(0, true), {
      bytes: 8,
      uppercase: true,
      prefixed: true,
    }),
    KeyH: numberToHex(view.getBigUint64(8, true), {
      bytes: 8,
      uppercase: true,
      prefixed: true,
    }),
    TxRadio: txRadio,
  };
}
