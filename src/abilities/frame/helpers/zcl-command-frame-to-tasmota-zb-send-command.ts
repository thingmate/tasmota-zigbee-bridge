import type { TasmotaZbSendCommand } from '@thingmate/vendor-tasmota';
import type { ZCLCommandFrame } from '@thingmate/zigbee';
import { numberToHex, uint8ArrayToHex } from '@xstd/hex';

/**
 * Converts a {@link ZCLCommandFrame} into a Tasmota `ZbSend` command using the
 * "low-level" `Send` syntax.
 *
 * The low-level command follows the `<cluster><direction-marker><command>/<payload>`
 * syntax, where the direction marker is:
 * - `_` for a profile-wide client-to-server command,
 * - `!` for a cluster-specific client-to-server command,
 * - `^` for a profile-wide server-to-client command,
 * - `?` for a cluster-specific server-to-client command.
 *
 * The target device is rendered as an uppercase hex string: a short address
 * (`0x10000` and below) on 2 bytes, a long address on 8 bytes.
 * @returns The equivalent `ZbSend` command payload.
 * @see https://tasmota.github.io/docs/Zigbee/#low-level-commands
 */
export function zclCommandFrameToTasmotaZbSendCommand({
  device,
  endpoint,
  cluster,
  clusterSpecific,
  direction,
  command,
  payload,
}: ZCLCommandFrame): TasmotaZbSendCommand {
  return {
    Device: numberToHex(device, {
      bytes: device < 0x10000n ? 2 : 8,
      uppercase: true,
      prefixed: true,
    }),
    Endpoint: endpoint,
    // https://github.com/arendst/Tasmota/blob/f2bf8b96e7cde4e95a810b62fe9e4e6b0a0241ab/tasmota/tasmota_xdrv_driver/xdrv_23_zigbee_1z_libs.ino#L644
    Send: `${numberToHex(cluster, { bytes: 2, uppercase: true })}${
      direction === 'client-to-server' ? (clusterSpecific ? '!' : '_') : clusterSpecific ? '?' : '^'
    }${numberToHex(command, { bytes: 1, uppercase: true })}/${uint8ArrayToHex(payload, { uppercase: true })}`,
  };
}
