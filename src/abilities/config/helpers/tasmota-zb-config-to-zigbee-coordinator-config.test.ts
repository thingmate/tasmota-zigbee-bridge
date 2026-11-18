import { hexToUint8Array } from '@xstd/hex';
import { describe, expect, test } from 'vitest';
import { tasmotaZbConfigToZigbeeCoordinatorConfig } from './tasmota-zb-config-to-zigbee-coordinator-config.ts';

describe('tasmotaZbConfigToZigbeeCoordinatorConfig', () => {
  test('Tasmota documentation example (default Z-Stack key)', () => {
    const config = tasmotaZbConfigToZigbeeCoordinatorConfig({
      Channel: 11,
      PanID: '0x1A63',
      ExtPanID: '0xCCCCCCCC00001A63',
      KeyL: '0x0F0D0B0907050301',
      KeyH: '0x0D0C0A0806040200',
      TxRadio: 20,
    });

    expect(config.channel).toBe(11);
    expect(config.panId).toBe(0x1a63);
    expect(config.extPanId).toBe(0xcccccccc00001a63n);
    expect(config.txRadio).toBe(20);
    expect(config.key).toHaveLength(16);
    expect(config.key).toEqual(hexToUint8Array('01030507090b0d0f00020406080a0c0d'));
  });

  test('key halves are stored little-endian (LSB first)', () => {
    const config = tasmotaZbConfigToZigbeeCoordinatorConfig({
      Channel: 11,
      PanID: '0x0001',
      ExtPanID: '0x0000000000000001',
      KeyL: '0x0102030405060708',
      KeyH: '0x090A0B0C0D0E0F10',
      TxRadio: 20,
    });

    // KeyL => bytes 0..7 (reversed), KeyH => bytes 8..15 (reversed)
    expect(config.key).toEqual(hexToUint8Array('0807060504030201100f0e0d0c0b0a09'));
  });

  test('KeyL fills bytes 0..7 and KeyH fills bytes 8..15 (no overlap)', () => {
    const config = tasmotaZbConfigToZigbeeCoordinatorConfig({
      Channel: 11,
      PanID: '0x0001',
      ExtPanID: '0x0000000000000001',
      KeyL: '0x0000000000000001',
      KeyH: '0x0100000000000000',
      TxRadio: 20,
    });

    expect(config.key[0]).toBe(0x01); // LSB of KeyL
    expect(config.key[7]).toBe(0x00);
    expect(config.key[8]).toBe(0x00);
    expect(config.key[15]).toBe(0x01); // MSB of KeyH
    expect(config.key).toEqual(hexToUint8Array('01000000000000000000000000000001'));
  });

  test('extPanId keeps 64-bit precision', () => {
    const config = tasmotaZbConfigToZigbeeCoordinatorConfig({
      Channel: 11,
      PanID: '0x0001',
      ExtPanID: '0xCCCCCCCCE3ABF498',
      KeyL: '0x0000000000000000',
      KeyH: '0x0000000000000000',
      TxRadio: 20,
    });

    expect(config.extPanId).toBe(0xcccccccce3abf498n);
  });

  test('extPanId handles the full u64 range', () => {
    const config = tasmotaZbConfigToZigbeeCoordinatorConfig({
      Channel: 11,
      PanID: '0x0001',
      ExtPanID: '0xFFFFFFFFFFFFFFFF',
      KeyL: '0x0000000000000000',
      KeyH: '0x0000000000000000',
      TxRadio: 20,
    });

    expect(config.extPanId).toBe(0xffffffffffffffffn);
  });
});
