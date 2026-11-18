[![npm (scoped)](https://img.shields.io/npm/v/@thingmate/tasmota-zigbee-bridge.svg)](https://www.npmjs.com/package/@thingmate/tasmota-zigbee-bridge)
![npm](https://img.shields.io/npm/dm/@thingmate/tasmota-zigbee-bridge.svg)
![NPM](https://img.shields.io/npm/l/@thingmate/tasmota-zigbee-bridge.svg)
![npm type definitions](https://img.shields.io/npm/types/@thingmate/tasmota-zigbee-bridge.svg)
![AI generation](https://img.shields.io/badge/AI_generation-low-yellow)

<picture>
  <source height="64" media="(prefers-color-scheme: dark)" srcset="https://github.com/thingmate/website/blob/main/assets/logo/png/logo-large-dark.png?raw=true">
  <source height="64" media="(prefers-color-scheme: light)" srcset="https://github.com/thingmate/website/blob/main/assets/logo/png/logo-large-light.png?raw=true">
  <img height="64" alt="Shows a black logo in light color mode and a white one in dark color mode." src="https://github.com/thingmate/website/blob/main/assets/logo/png/logo-large-light.png?raw=true">
</picture>

## @thingmate/tasmota-zigbee-bridge

Drive a [Zigbee coordinator](https://www.npmjs.com/package/@thingmate/zigbee) from a
[Tasmota](https://tasmota.github.io/) device running
[Zigbee2Tasmota](https://tasmota.github.io/docs/Zigbee/).

## 📦 Installation

```shell
yarn add @thingmate/tasmota-zigbee-bridge
# or
npm install @thingmate/tasmota-zigbee-bridge --save
```

## 📜 Documentation

This library bridges a
[`ZigbeeCoordinator`](https://www.npmjs.com/package/@thingmate/zigbee) to a Tasmota device acting as
the network's Zigbee coordinator (Zigbee2Tasmota), through the Tasmota CLI provided by
[`@thingmate/vendor-tasmota`](https://www.npmjs.com/package/@thingmate/vendor-tasmota).

Each coordinator ability is mapped to a Tasmota CLI command:

| Ability                          | Tasmota command | Behaviour                                                                                                                      |
| -------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `config.read` / `config.observe` | `ZbConfig`      | reads and observes the network configuration reported by the device                                                            |
| `config.write`                   | `ZbConfig`      | publishes the new configuration: it resolves once the command is published, without waiting for the coordinator's confirmation |
| `permitJoin`                     | `ZbPermitJoin`  | opens Tasmota's fixed 60-second pairing window for any positive duration, or closes the network immediately for `0`            |
| `command.send`                   | `ZbSend`        | sends a `ZCLCommandFrame` using Tasmota's low-level syntax                                                                     |
| `command.observe`                | `ZbZCLReceived` | emits the frames received by the coordinator                                                                                   |

> [!NOTE]
> Tasmota's CLI only supports closing (`0`) and its own fixed 60-second pairing window: the
> requested duration cannot be honoured beyond that (Tasmota limitation).

### Usage

```ts
import { MqttResource } from '@xstd/mqtt-resource';
import { MqttTasmotaCli } from '@thingmate/vendor-tasmota';
import { TasmotaZigbeeCoordinatorBridge } from '@thingmate/tasmota-zigbee-bridge';

// connect to the MQTT broker the Tasmota device is connected to
const controller: AbortController = new AbortController();
const mqtt: MqttResource = await MqttResource.open.call(
  controller.signal,
  'mqtt://192.168.1.10:1883',
);

const tasmota: MqttTasmotaCli = new MqttTasmotaCli({
  mqtt,
  deviceId: 'tasmota_XXXXXX', // the device's MQTT topic
});

// the standard ZigbeeCoordinator abilities, backed by the Tasmota device
const coordinator: TasmotaZigbeeCoordinatorBridge = new TasmotaZigbeeCoordinatorBridge(tasmota);

// read the current network configuration
const config = await coordinator.config.read.call(controller.signal);

// open the network to new devices (Tasmota's fixed 60-second window)
await coordinator.permitJoin.call(controller.signal, 60);

// send a ZCL command frame to a device
await coordinator.command.send.call(controller.signal, {
  device: 0x2916,
  endpoint: 1,
  cluster: 0x0006,
  clusterSpecific: true,
  direction: 'client-to-server',
  command: 0x01,
  payload: new Uint8Array(0),
});

// observe the frames received by the coordinator
for await (const [frame] of coordinator.command.observe) {
  console.log(frame);
}
```

> [!IMPORTANT]
> The Tasmota device must be configured with `MqttLog 2` minimum to observe command results, and
> `MqttLog 3` to also observe received Zigbee frames (see
> [`MqttTasmotaCli`](https://www.npmjs.com/package/@thingmate/vendor-tasmota)).
