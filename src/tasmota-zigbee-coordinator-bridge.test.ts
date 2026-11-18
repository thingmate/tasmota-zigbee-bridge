import { CommandAbilities } from '@thingmate/abilities';
import {
  type HavingTasmotaCliAbilities,
  type TasmotaCliArguments,
} from '@thingmate/vendor-tasmota';
import { AsyncFunction } from '@xstd/async-function';
import { ObservableAsyncFunction } from '@xstd/observable-async-function';
import { describe, expect, test } from 'vitest';
import { TasmotaZigbeeCoordinatorBridge } from './tasmota-zigbee-coordinator-bridge.ts';

function createTasmotaCli(): { cli: HavingTasmotaCliAbilities; sent: string[] } {
  const sent: string[] = [];
  const cli: HavingTasmotaCliAbilities = new CommandAbilities<TasmotaCliArguments>({
    send: new AsyncFunction<TasmotaCliArguments, void>(
      async (_signal: AbortSignal, payload: string): Promise<void> => {
        sent.push(payload);
      },
    ),
    observe: new ObservableAsyncFunction<TasmotaCliArguments>(
      (): Promise<never> => new Promise<never>(() => {}),
    ),
  });
  return { cli, sent };
}

describe('TasmotaZigbeeCoordinatorBridge', () => {
  test('permitJoin opens the network for the requested duration', async () => {
    const { cli, sent } = createTasmotaCli();
    const bridge = new TasmotaZigbeeCoordinatorBridge(cli);

    await bridge.permitJoin.call(new AbortController().signal, 60);

    expect(sent).toEqual([JSON.stringify({ ZbPermitJoin: '1' })]);
  });

  test('permitJoin closes the network for a zero duration', async () => {
    const { cli, sent } = createTasmotaCli();
    const bridge = new TasmotaZigbeeCoordinatorBridge(cli);

    await bridge.permitJoin.call(new AbortController().signal, 0);

    expect(sent).toEqual([JSON.stringify({ ZbPermitJoin: '0' })]);
  });
});
