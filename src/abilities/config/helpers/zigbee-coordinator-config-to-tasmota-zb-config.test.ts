import { hexToUint8Array } from '@xstd/hex';
import { describe, expect, test } from 'vitest';
import { tasmotaZbConfigToZigbeeCoordinatorConfig } from './tasmota-zb-config-to-zigbee-coordinator-config.ts';
import { zigbeeCoordinatorConfigToTasmotaZbConfig } from './zigbee-coordinator-config-to-tasmota-zb-config.ts';

const config: Parameters<typeof zigbeeCoordinatorConfigToTasmotaZbConfig>[0] = {
  channel: 11,
  panId: 0x1a63,
  extPanId: 0xcccccccc00001a63n,
  key: hexToUint8Array('01030507090b0d0f00020406080a0c0d'),
  txRadio: 20,
};

describe('zigbeeCoordinatorConfigToTasmotaZbConfig', () => {
  test('Tasmota documentation example (default Z-Stack key)', () => {
    const zbConfig = zigbeeCoordinatorConfigToTasmotaZbConfig(config);

    expect(zbConfig.Channel).toBe(11);
    expect(zbConfig.PanID).toBe('0x1A63');
    expect(zbConfig.ExtPanID).toBe('0xCCCCCCCC00001A63');
    expect(zbConfig.KeyL).toBe('0x0F0D0B0907050301');
    expect(zbConfig.KeyH).toBe('0x0D0C0A0806040200');
    expect(zbConfig.TxRadio).toBe(20);
  });

  test('key halves are read little-endian (LSB first)', () => {
    const config = zigbeeCoordinatorConfigToTasmotaZbConfig({
      channel: 11,
      panId: 0x0001,
      extPanId: 1n,
      key: hexToUint8Array('0807060504030201100f0e0d0c0b0a09'),
      txRadio: 20,
    });

    expect(config.KeyL).toBe('0x0102030405060708');
    expect(config.KeyH).toBe('0x090A0B0C0D0E0F10');
  });

  test('round-trips with tasmotaZbConfigToZigbeeCoordinatorConfig', () => {
    const zbConfig = {
      Channel: 11,
      PanID: '0x1A63',
      ExtPanID: '0xCCCCCCCC00001A63',
      KeyL: '0x0F0D0B0907050301',
      KeyH: '0x0D0C0A0806040200',
      TxRadio: 20,
    };

    const roundTripped: unknown = zigbeeCoordinatorConfigToTasmotaZbConfig(
      tasmotaZbConfigToZigbeeCoordinatorConfig(zbConfig),
    );

    expect(roundTripped).toEqual(zbConfig);
  });

  test('throws on a network key that is not 16 bytes', () => {
    expect(() =>
      zigbeeCoordinatorConfigToTasmotaZbConfig({
        ...config,
        key: hexToUint8Array('01030507090b0d0f'),
      }),
    ).toThrow(RangeError);
  });

  test('throws on a PAN id outside of the unsigned 16-bit integer range', () => {
    expect(() =>
      zigbeeCoordinatorConfigToTasmotaZbConfig({
        ...config,
        panId: 0x10000,
      }),
    ).toThrow(RangeError);
  });

  test('throws on a non-integer PAN id', () => {
    expect(() =>
      zigbeeCoordinatorConfigToTasmotaZbConfig({
        ...config,
        panId: 0.5,
      }),
    ).toThrow(RangeError);
  });

  test('throws on an extended PAN id outside of the unsigned 64-bit integer range', () => {
    expect(() =>
      zigbeeCoordinatorConfigToTasmotaZbConfig({
        ...config,
        extPanId: 0x10000000000000000n,
      }),
    ).toThrow(RangeError);
  });
});
