(function() {
  'use strict';
  const NVReadkey_Buff =  new Uint8Array([0x2e,0x35,0x25,0x64,0x4a,0x04,0x42,0x72,0x8c,0x8d,0xa6,0xec,0xc2,0x81,0xb5,0xb0]); 	// The 16 byte key matched for read enable		
  const NVWritekey_Buff = new Uint8Array([0x06,0x33,0x77,0xd7,0x5a,0xef,0x4a,0xc0,0xb5,0x0e,0xe8,0xb4,0xc3,0x75,0x9a,0x22]);		// The 16 byte key matched for read & write enable
  const characteristicRWAccess = 'f0ba0103-c6b5-11e2-8b8b-0800200c9a66';
  const serviceRWAccess = 'f0ba0100-c6b5-11e2-8b8b-0800200c9a66';
  const serviceDataRegister = 'f0ba1b00-c6b5-11e2-8b8b-0800200c9a66';
  class TKBA {
    constructor() {
      this.device = null;
      this.server = null;
      this._characteristics = new Map();
    }
    connect() {
      return navigator.bluetooth.requestDevice({
        filters: [{
          services : [serviceDataRegister]
        }],
        optionalServices: [serviceRWAccess]
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
            console.log('CCD & Acc service ok...');
            return Promise.all([
              this._cacheCharacteristic(service, 'f0ba1b01-c6b5-11e2-8b8b-0800200c9a66'),
              this._cacheCharacteristic(service, 'f0ba1b02-c6b5-11e2-8b8b-0800200c9a66'),
              this._cacheCharacteristic(service, 'f0ba1b03-c6b5-11e2-8b8b-0800200c9a66'),
            ])
          }),
           server.getPrimaryService(serviceRWAccess).then(service => {
            console.log('RW service ok...');
            return Promise.all([
              this._cacheCharacteristic(service, characteristicRWAccess),
            ])
          })
        ]);
      })
    }

    /* Notifications */

    startNotificationsCCD() {
      console.log('Starting notifications for CCD');
      return this._startNotifications('f0ba1b01-c6b5-11e2-8b8b-0800200c9a66');
    }
    stopNotificationsCCD() {
      console.log('Starting notifications for CCD');
      return this._stopNotifications('f0ba1b01-c6b5-11e2-8b8b-0800200c9a66');
    }
    startNotificationsAccelerometer() {
      console.log('Starting notifications for Accelerometer');
      return this._startNotifications('f0ba1b02-c6b5-11e2-8b8b-0800200c9a66');
    }
    stopNotificationsAccelerometer() {
      return this._stopNotifications('f0ba1b02-c6b5-11e2-8b8b-0800200c9a66');
    }
    writeKeyPermission(){
    	console.log('Write key permission to the sensor');
    	return this._writeCharacteristicValue(characteristicRWAccess, NVWritekey_Buff);
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
