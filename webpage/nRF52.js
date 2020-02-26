(function() {
  'use strict';
  const serviceDataRegister = '000000a0-1212-efde-1523-785fef13d123';
  const characteristicAcc = '000000a1-1212-efde-1523-785fef13d123';
  class TKBA {
    constructor() {
      this.device = null;
      this.server = null;
      this._characteristics = new Map();
    }
    connect() {
      return navigator.bluetooth.requestDevice({
        filters: [{
          //services : [serviceDataRegister]
          namePrefix:'iNanny'
        }],
        optionalServices: [serviceDataRegister]
      })
      .then(device => {
        this.device = device;
        return device.gatt.connect();
      })
      .then(server => {
        this.server = server;
        console.log('Getting Service');
        return Promise.all([
          server.getPrimaryService(serviceDataRegister).then(service => {
            console.log('Acc service ok...');
            return Promise.all([
              this._cacheCharacteristic(service, characteristicAcc),
            ])
          }),
        ]);
      })
    }

    /* Notifications */
    startNotificationsAccelerometer() {
      console.log('Starting notifications for Accelerometer');
      return this._startNotifications(characteristicAcc);
    }
    stopNotificationsAccelerometer() {
      return this._stopNotifications(characteristicAcc);
    }

   
    /* Utils */

    _cacheCharacteristic(service, characteristicUuid) {
      return service.getCharacteristic(characteristicUuid)
      .then(characteristic => {
        this._characteristics.set(characteristicUuid, characteristic);
      });
    }
    _readCharacteristicValue(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      return characteristic.readValue()
      .then(value => {
        // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        value = value.buffer ? value : new DataView(value);
        return value;
      });
    }
    _writeCharacteristicValue(characteristicUuid, value) {
      let characteristic = this._characteristics.get(characteristicUuid);
      return characteristic.writeValue(value);
    }
    _startNotifications(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      // Returns characteristic to set up characteristicvaluechanged event
      // handlers in the resolved promise.
      return characteristic.startNotifications()
      .then(() => characteristic);
    }
    _stopNotifications(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      // Returns characteristic to remove characteristicvaluechanged event
      // handlers in the resolved promise.
      return characteristic.stopNotifications()
      .then(() => characteristic);
    }
  }

  window.tkba = new TKBA();

})();
