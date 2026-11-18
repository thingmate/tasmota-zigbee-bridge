import {
  type HavingTasmotaCliAbilities,
  type TasmotaCliArguments,
} from '@thingmate/vendor-tasmota';
import { ZigbeeCoordinator } from '@thingmate/zigbee';
import { TasmotaZigbeeCoordinatorConfigBridge } from './abilities/config/tasmota-zigbee-coordinator-config-bridge.ts';
import { TasmotaZigbeeCommandFrameBridge } from './abilities/frame/tasmota-zigbee-command-frame-bridge.ts';

/**
 * A {@link ZigbeeCoordinator} driven by a Tasmota device acting as the Zigbee
 * coordinator (Zigbee2Tasmota).
 *
 * Each Zigbee ability is bridged to a Tasmota CLI command:
 * - the network configuration is read and written through `ZbConfig`,
 * - the network is opened or closed to new devices through `ZbPermitJoin`:
 *   opening it enables pairing for Tasmota's fixed 60-second window, whatever
 *   the requested duration (Tasmota's CLI does not support custom durations,
 *   nor indefinite pairing on Z-Stack 3 coordinators), while a duration of `0`
 *   disables pairing immediately (`ZbPermitJoin 0`),
 * - ZCL command frames are sent through `ZbSend` and observed from
 *   `ZbZCLReceived` log messages.
 */
export class TasmotaZigbeeCoordinatorBridge extends ZigbeeCoordinator {
  /**
   * Creates a Zigbee coordinator bridged to the provided Tasmota CLI.
   * @param cli - Tasmota CLI abilities used to send commands and observe their results.
   */
  constructor(cli: HavingTasmotaCliAbilities) {
    super({
      config: new TasmotaZigbeeCoordinatorConfigBridge(cli),
      permitJoin: cli.send.mapArguments((duration: number): TasmotaCliArguments => {
        // Tasmota's CLI only supports closing (`0`) and its own fixed
        // 60-second window: every non-zero value maps to 60 seconds, and `99`
        // (indefinite pairing) is rejected on Z-Stack 3 coordinators.
        return [
          JSON.stringify({
            ZbPermitJoin: duration > 0 ? '1' : '0',
          }),
        ];
      }),
      command: new TasmotaZigbeeCommandFrameBridge(cli),
    });
  }
}
