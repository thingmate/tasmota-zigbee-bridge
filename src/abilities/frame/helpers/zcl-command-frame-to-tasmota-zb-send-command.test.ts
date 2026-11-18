import { hexToUint8Array } from '@xstd/hex';
import { describe, expect, test } from 'vitest';
import { zclCommandFrameToTasmotaZbSendCommand } from './zcl-command-frame-to-tasmota-zb-send-command.ts';

describe('zclCommandFrameToTasmotaZbSendCommand', () => {
  test('Tasmota documentation example (cluster-specific client-to-server command)', () => {
    const command = zclCommandFrameToTasmotaZbSendCommand({
      device: 0x1234,
      endpoint: 3,
      cluster: 0x0008,
      clusterSpecific: true,
      direction: 'client-to-server',
      command: 0x04,
      payload: hexToUint8Array('800a00'),
    });

    expect(command.Device).toBe('0x1234');
    expect(command.Endpoint).toBe(3);
    expect(command.Send).toBe('0008!04/800A00');
  });

  test.each([
    {
      clusterSpecific: false,
      direction: 'client-to-server' as const,
      marker: '_',
    },
    {
      clusterSpecific: true,
      direction: 'client-to-server' as const,
      marker: '!',
    },
    {
      clusterSpecific: false,
      direction: 'server-to-client' as const,
      marker: '^',
    },
    {
      clusterSpecific: true,
      direction: 'server-to-client' as const,
      marker: '?',
    },
  ])(
    'direction marker is `$marker` (direction: $direction, clusterSpecific: $clusterSpecific)',
    ({ clusterSpecific, direction, marker }) => {
      const command = zclCommandFrameToTasmotaZbSendCommand({
        device: 0x1234,
        endpoint: 1,
        cluster: 0x0006,
        clusterSpecific,
        direction,
        command: 0x00,
        payload: new Uint8Array(0),
      });

      expect(command.Send).toBe(`0006${marker}00/`);
    },
  );

  test('short device addresses are rendered on 2 bytes', () => {
    const command = zclCommandFrameToTasmotaZbSendCommand({
      device: 0x2916,
      endpoint: 1,
      cluster: 0x0006,
      clusterSpecific: true,
      direction: 'client-to-server',
      command: 0x01,
      payload: new Uint8Array(0),
    });

    expect(command.Device).toBe('0x2916');
  });

  test('long device addresses are rendered on 8 bytes', () => {
    const command = zclCommandFrameToTasmotaZbSendCommand({
      device: 0x00124b001f841e41n,
      endpoint: 1,
      cluster: 0x0006,
      clusterSpecific: true,
      direction: 'client-to-server',
      command: 0x01,
      payload: new Uint8Array(0),
    });

    expect(command.Device).toBe('0x00124B001F841E41');
  });

  test('the short/long address threshold is 0x10000', () => {
    const shortAddress = zclCommandFrameToTasmotaZbSendCommand({
      device: 0xffff,
      endpoint: 1,
      cluster: 0x0006,
      clusterSpecific: true,
      direction: 'client-to-server',
      command: 0x01,
      payload: new Uint8Array(0),
    });

    const longAddress = zclCommandFrameToTasmotaZbSendCommand({
      device: 0x10000n,
      endpoint: 1,
      cluster: 0x0006,
      clusterSpecific: true,
      direction: 'client-to-server',
      command: 0x01,
      payload: new Uint8Array(0),
    });

    expect(shortAddress.Device).toBe('0xFFFF');
    expect(longAddress.Device).toBe('0x0000000000010000');
  });
});
