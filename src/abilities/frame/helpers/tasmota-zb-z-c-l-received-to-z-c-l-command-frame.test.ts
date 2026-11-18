import type { TasmotaZbZCLReceived } from '@thingmate/vendor-tasmota';
import { hexToUint8Array } from '@xstd/hex';
import { describe, expect, test } from 'vitest';
import { tasmotaZbZCLReceivedToZCLCommandFrame } from './tasmota-zb-z-c-l-received-to-z-c-l-command-frame.ts';
import { zclCommandFrameToTasmotaZbSendCommand } from './zcl-command-frame-to-tasmota-zb-send-command.ts';

const received: TasmotaZbZCLReceived = {
  groupid: 0,
  clusterid: '0x0006',
  srcaddr: '0x2916',
  srcendpoint: 1,
  dstendpoint: 1,
  wasbroadcast: 0,
  LinkQuality: 120,
  securityuse: 0,
  seqnumber: 1,
  fc: '0x19',
  frametype: 1,
  direction: 0,
  disableresp: 0,
  manuf: '0x0000',
  transact: 5,
  cmdid: '0x01',
  payload: '0a00',
};

describe('tasmotaZbZCLReceivedToZCLCommandFrame', () => {
  test('converts a cluster-specific client-to-server received frame', () => {
    expect(tasmotaZbZCLReceivedToZCLCommandFrame(received)).toEqual({
      device: 0x2916,
      endpoint: 1,
      cluster: 0x0006,
      clusterSpecific: true,
      direction: 'client-to-server',
      command: 0x01,
      payload: hexToUint8Array('0a00'),
    });
  });

  test('frametype 0 is a profile-wide command', () => {
    const command = tasmotaZbZCLReceivedToZCLCommandFrame({ ...received, frametype: 0 });

    expect(command.clusterSpecific).toBe(false);
  });

  test('direction 1 is a server-to-client command', () => {
    const command = tasmotaZbZCLReceivedToZCLCommandFrame({ ...received, direction: 1 });

    expect(command.direction).toBe('server-to-client');
  });

  test('hex identifiers are decoded in uppercase and lowercase', () => {
    const command = tasmotaZbZCLReceivedToZCLCommandFrame({
      ...received,
      srcaddr: '0xFFFF',
      clusterid: '0x0402',
      cmdid: '0x00',
    });

    expect(command.device).toBe(0xffff);
    expect(command.cluster).toBe(0x0402);
    expect(command.command).toBe(0x00);
  });

  test('empty payload converts to an empty byte array', () => {
    const command = tasmotaZbZCLReceivedToZCLCommandFrame({ ...received, payload: '' });

    expect(command.payload).toHaveLength(0);
  });

  test('round-trips with zclCommandFrameToTasmotaZbSendCommand', () => {
    const command = zclCommandFrameToTasmotaZbSendCommand(
      tasmotaZbZCLReceivedToZCLCommandFrame(received),
    );

    expect(command.Device).toBe('0x2916');
    expect(command.Endpoint).toBe(1);
    expect(command.Send).toBe('0006!01/0A00');
  });
});
