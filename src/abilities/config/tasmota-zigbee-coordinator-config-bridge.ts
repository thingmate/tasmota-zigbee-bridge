import { PropertyAbilities } from '@thingmate/abilities';
import {
  type HavingTasmotaCliAbilities,
  parseTasmotaLogging,
  parseTasmotaLoggingAsTasmotaResult,
  parseTasmotaResultAsTasmotaZbConfigResponse,
  type TasmotaCliArguments,
  type TasmotaZbConfigRequest,
  type TasmotaZbConfigResponse,
} from '@thingmate/vendor-tasmota';
import type { ZigbeeCoordinatorConfig, ZigbeeCoordinatorConfigAbilities } from '@thingmate/zigbee';
import { AsyncFunction } from '@xstd/async-function';
import { NONE, type None } from '@xstd/none';
import type { ObservableAsyncFunction } from '@xstd/observable-async-function';

import { tasmotaZbConfigToZigbeeCoordinatorConfig } from './helpers/tasmota-zb-config-to-zigbee-coordinator-config.ts';
import { zigbeeCoordinatorConfigToTasmotaZbConfig } from './helpers/zigbee-coordinator-config-to-tasmota-zb-config.ts';

/**
 * Property abilities over the network configuration of a Tasmota Zigbee
 * coordinator, bridged to the Tasmota CLI:
 * - `read` sends an empty `ZbConfig` command and waits for the configuration
 *   reported in the resulting `ZbConfig` log message,
 * - `write` sends the configuration as a `ZbConfig` command: it resolves once
 *   the command is published, without waiting for the coordinator's
 *   confirmation,
 * - `observe` emits every configuration reported by the coordinator through
 *   `ZbConfig` log messages.
 */
export class TasmotaZigbeeCoordinatorConfigBridge
  extends PropertyAbilities<ZigbeeCoordinatorConfig>
  implements ZigbeeCoordinatorConfigAbilities
{
  /**
   * Creates config property abilities bridged to the provided Tasmota CLI.
   * @param cli - Tasmota CLI abilities used to send commands and observe their results.
   */
  constructor(cli: HavingTasmotaCliAbilities) {
    const observe: ObservableAsyncFunction<ZigbeeCoordinatorConfig> = cli.observe.mapFilter(
      ([payload]: TasmotaCliArguments): ZigbeeCoordinatorConfig | None => {
        try {
          const result: string | null = parseTasmotaLoggingAsTasmotaResult(
            parseTasmotaLogging(payload),
          );

          if (result === null) {
            return NONE;
          }

          const configResponse: TasmotaZbConfigResponse | null =
            parseTasmotaResultAsTasmotaZbConfigResponse(result);

          if (configResponse === null) {
            return NONE;
          }

          return tasmotaZbConfigToZigbeeCoordinatorConfig(configResponse.ZbConfig);
        } catch {
          // Log lines published by the device are untrusted input: anything
          // failing to parse is filtered out rather than interrupting the
          // observation chain.
          return NONE;
        }
      },
    );

    super({
      read: AsyncFunction.fromSendAndReceive<[], ZigbeeCoordinatorConfig>({
        send: cli.send.mapArguments((): TasmotaCliArguments => {
          return [
            JSON.stringify({
              ZbConfig: '',
            }),
          ];
        }),
        receive: new AsyncFunction<[], ZigbeeCoordinatorConfig>(
          (signal: AbortSignal): Promise<ZigbeeCoordinatorConfig> => {
            return observe.first(signal);
          },
        ),
      }),
      write: cli.send.mapArguments((config: ZigbeeCoordinatorConfig): TasmotaCliArguments => {
        return [
          JSON.stringify({
            ZbConfig: zigbeeCoordinatorConfigToTasmotaZbConfig(config),
          } satisfies TasmotaZbConfigRequest),
        ];
      }),
      observe,
    });
  }
}
