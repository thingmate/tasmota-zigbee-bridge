import { CommandAbilities } from '@thingmate/abilities';
import {
  type HavingTasmotaCliAbilities,
  parseTasmotaLogging,
  parseTasmotaLoggingAsTasmotaZbZCLReceivedLogging,
  type TasmotaCliArguments,
  type TasmotaZbZCLReceivedLogging,
} from '@thingmate/vendor-tasmota';
import type { ZCLCommandFrame } from '@thingmate/zigbee';
import { NONE, type None } from '@xstd/none';

import { tasmotaZbZCLReceivedToZCLCommandFrame } from './helpers/tasmota-zb-z-c-l-received-to-z-c-l-command-frame.ts';
import { zclCommandFrameToTasmotaZbSendCommand } from './helpers/zcl-command-frame-to-tasmota-zb-send-command.ts';

/**
 * Arguments accepted when sending a command through the bridge: a single
 * {@link ZCLCommandFrame} to forward to the Zigbee network.
 */
export type TasmotaZigbeeCommandFrameBridgeArguments = readonly [command: ZCLCommandFrame];

/**
 * Command abilities of a Tasmota Zigbee coordinator, bridging
 * {@link ZCLCommandFrame}s to the Tasmota CLI:
 * - `send` serializes a frame into a `ZbSend` command,
 * - `observe` emits the frames received by the coordinator, extracted from
 *   `ZbZCLReceived` log messages.
 */
export class TasmotaZigbeeCommandFrameBridge extends CommandAbilities<TasmotaZigbeeCommandFrameBridgeArguments> {
  /**
   * Creates command abilities bridged to the provided Tasmota CLI.
   * @param cli - Tasmota CLI abilities used to send commands and observe their results.
   */
  constructor(cli: HavingTasmotaCliAbilities) {
    super({
      send: cli.send.mapArguments((command: ZCLCommandFrame): TasmotaCliArguments => {
        return [
          JSON.stringify({
            ZbSend: zclCommandFrameToTasmotaZbSendCommand(command),
          }),
        ];
      }),
      observe: cli.observe.mapFilter(
        ([payload]: TasmotaCliArguments): TasmotaZigbeeCommandFrameBridgeArguments | None => {
          try {
            const received: TasmotaZbZCLReceivedLogging | null =
              parseTasmotaLoggingAsTasmotaZbZCLReceivedLogging(parseTasmotaLogging(payload));
            return received === null
              ? NONE
              : [tasmotaZbZCLReceivedToZCLCommandFrame(received.ZbZCLReceived)];
          } catch {
            // Log lines published by the device are untrusted input: anything
            // failing to parse is filtered out rather than interrupting the
            // observation chain.
            return NONE;
          }
        },
      ),
    });
  }
}
