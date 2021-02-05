//import { strict } from 'assert';
import { Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback } from 'homebridge';

import { ExampleHomebridgePlatform } from './platform';
import { EAPConnector } from './eapConnector';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private servicePower: Service;
  private serviceFrontLED: Service;
  private serviceRebootButton: Service;
  private counter: number;
  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private exampleStates = {
    On: true,
    isSettingOn: false,
    LedOn: true,
    IsRebooting: false,
  }; 

  private eapConnector: EAPConnector;

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.counter = 0;
    this.eapConnector = new EAPConnector(platform.config.ip as string, platform.config.username as string, 
      platform.config.password as string, this.platform);

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'TP-Link')
      .setCharacteristic(this.platform.Characteristic.Model, 'EAP 225')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, '0C-80-63-1F-7F-1A');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.servicePower = this.accessory.getService('Power') || this.accessory.addService(this.platform.Service.Switch, 'Power', 'btn-pw');
    //this.servicePower = this.accessory.getService('Power') || 
    //this.accessory.addService(this.platform.Service.StatelessProgrammableSwitch, 'Power', 'btn-pw'); 

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.servicePower.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.servicePower.getCharacteristic(this.platform.Characteristic.On)
      .on('set', this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .on('get', this.getOn.bind(this));               // GET - bind to the `getOn` method below

   
    this.serviceFrontLED = this.accessory.getService(this.platform.Service.Lightbulb) || 
    this.accessory.addService(this.platform.Service.Lightbulb);
    this.serviceFrontLED.setCharacteristic(this.platform.Characteristic.Name, 'EAP 225 Front LED');
  
    this.serviceFrontLED.getCharacteristic(this.platform.Characteristic.On)
      .on('set', this.setLEDOn.bind(this))                // SET - bind to the `setOn` method below
      .on('get', this.getLEDOn.bind(this));               // GET - bind to the `getOn` method below


    this.serviceRebootButton = this.accessory.getService('Reboot') || 
    this.accessory.addService(this.platform.Service.Switch, 'Reboot', 'btn-reboot');
    this.serviceRebootButton.setCharacteristic(this.platform.Characteristic.Name, 'Reboot EAP 225');

    this.serviceRebootButton.getCharacteristic(this.platform.Characteristic.On)
      .on('set', this.setRebootOn.bind(this))                // SET - bind to the `setOn` method below
      .on('get', this.getRebootOn.bind(this));               // GET - bind to the `getOn` method below
      
    /**
     * Creating multiple services of the same type.
     * 
     * To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
     * when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
     * this.accessory.getService('NAME') || this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE_ID');
     * 
     * The USER_DEFINED_SUBTYPE must be unique to the platform accessory (if you platform exposes multiple accessories, each accessory
     * can use the same sub type id.)
     */

    // Example: add two "motion sensor" services to the accessory
    // const motionSensorOneService = this.accessory.getService('Motion Sensor One Name') ||
    //   this.accessory.addService(this.platform.Service.MotionSensor, 'Motion Sensor One Name', 'YourUniqueIdentifier-1');

    // const motionSensorTwoService = this.accessory.getService('Motion Sensor Two Name') ||
    //   this.accessory.addService(this.platform.Service.MotionSensor, 'Motion Sensor Two Name', 'YourUniqueIdentifier-2');

    /**
     * Updating characteristics values asynchronously.
     * 
     * Example showing how to update the state of a Characteristic asynchronously instead
     * of using the `on('get')` handlers.
     * Here we change update the motion sensor trigger states on and off every 10 seconds
     * the `updateCharacteristic` method.
     * 
     */
    // let motionDetected = false;
    // setInterval(() => {
    //   // EXAMPLE - inverse the trigger
    //   motionDetected = !motionDetected;

    //   // push the new value to HomeKit
    //   motionSensorOneService.updateCharacteristic(this.platform.Characteristic.MotionDetected, motionDetected);
    //   motionSensorTwoService.updateCharacteristic(this.platform.Characteristic.MotionDetected, !motionDetected);

    //   this.platform.log.debug('Triggering motionSensorOneService:', motionDetected);
    //   this.platform.log.debug('Triggering motionSensorTwoService:', !motionDetected);
    // }, 10000);
 
  }

  async setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    
    if (this.exampleStates.IsRebooting) {
      this.exampleStates.On = false;
    } else {
      this.exampleStates.On = true;
    }

    this.platform.log.info('1. Set Power START');
 
    setTimeout(() => {
      this.platform.log.debug('2. Set Power TIMER');
      this.servicePower.updateCharacteristic(this.platform.Characteristic.On, this.exampleStates.On);
      
    }, 3000);
 
    this.platform.log.info('3. Set Power END');
    callback(null);
  }

  async setLEDOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {

    // implement your own code to turn your device on/off
   
    if (!this.exampleStates.isSettingOn && !this.exampleStates.IsRebooting) {
      this.exampleStates.isSettingOn = true;

      this.platform.log.info('1. SET LED On START');

      await this.eapConnector.setLEDEnable(value as boolean).then( (result) => { 

        this.exampleStates.LedOn = result;
        this.platform.log.debug('2. SET LED On RESULT: ', this.exampleStates.LedOn);

        this.serviceFrontLED.updateCharacteristic(this.platform.Characteristic.On, this.exampleStates.LedOn);

        this.platform.log.info('3. SET LED On END');
  
      });


      this.exampleStates.isSettingOn = false;

    }

    callback(null);
  }

  async setRebootOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {

    if (!this.exampleStates.IsRebooting) {
      this.platform.log.info('1. Set Reboot On START');

      this.exampleStates.IsRebooting = true;
      this.serviceRebootButton.updateCharacteristic(this.platform.Characteristic.On, this.exampleStates.IsRebooting);

      this.exampleStates.On = false;
      this.servicePower.updateCharacteristic(this.platform.Characteristic.On, this.exampleStates.On);

      const requested = await this.eapConnector.rebootDevice();

      if (requested) {

        const interval = setInterval( async () => {
       
          const isOnline = await this.eapConnector.getOnlineStatus();
          this.exampleStates.IsRebooting = !isOnline;
  
          this.platform.log.debug('2. Set Reboot On After Timer', this.exampleStates.IsRebooting);
  
          if (isOnline) {          
            clearInterval(interval);
  
            this.exampleStates.On = true;
            this.servicePower.updateCharacteristic(this.platform.Characteristic.On, this.exampleStates.On);
  
            this.serviceRebootButton.updateCharacteristic(this.platform.Characteristic.On, this.exampleStates.IsRebooting);
            this.platform.log.info('3. Set Reboot On END');
          }
    
        }, 4000); 

      } else {
        this.exampleStates.IsRebooting = false;
        this.serviceRebootButton.updateCharacteristic(this.platform.Characteristic.On, this.exampleStates.IsRebooting);

        this.exampleStates.On = true;
        this.servicePower.updateCharacteristic(this.platform.Characteristic.On, this.exampleStates.On);

        this.platform.log.warn('3. Set Reboot On FAILED - Request Failed');
      }
    } else {
      
      setTimeout(() => {
       
        this.servicePower.updateCharacteristic(this.platform.Characteristic.On, this.exampleStates.IsRebooting);
        
      }, 2000);

    }
   
    callback(null);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   * 
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   * 
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(callback: CharacteristicGetCallback) {

    this.platform.log.info('1. Get Power On START');

    if (!this.exampleStates.IsRebooting) {
      await this.eapConnector.getOnlineStatus().then( (result) => {
  
        this.exampleStates.On = result;
        this.platform.log.debug('2. Get Power On RESULT: ', this.exampleStates.On);
  
        this.servicePower.updateCharacteristic(this.platform.Characteristic.On, this.exampleStates.On);
  
      });
    } else {   
      this.exampleStates.On = false;
    }

    this.platform.log.debug('2. Get Power On RESULT: ', this.exampleStates.On);
    this.platform.log.info('3. Get Power On END');

    // you must call the callback function
    // the first argument should be null if there were no errors
    // the second argument should be the value to return
    callback(null, this.exampleStates.On);
  }


  async getLEDOn(callback: CharacteristicGetCallback) {

    if (!this.exampleStates.IsRebooting) {
      this.platform.log.info('1. Get LED On START');

      await this.eapConnector.getLEDEnable().then( (result) => {
  
        this.exampleStates.LedOn = result;
        this.platform.log.debug('2. Get LED On RESULT: ', this.exampleStates.LedOn);
  
        this.serviceFrontLED.updateCharacteristic(this.platform.Characteristic.On, this.exampleStates.LedOn);
  
        this.platform.log.info('3. Get LED On END');
  
      });
    } else {
      this.platform.log.warn('1. Get LED On FAIL: Is Rebooting');
    }
    
    // you must call the callback function
    // the first argument should be null if there were no errors
    // the second argument should be the value to return
    callback(null, this.exampleStates.LedOn);
  }

  async getRebootOn(callback: CharacteristicGetCallback) {
    
    if (this.exampleStates.IsRebooting) {
      this.platform.log.info('1. Get Reboot On START');

      this.platform.log.debug('2. Get Reboot On STATUS: ', this.exampleStates.IsRebooting);

      this.platform.log.info('3. Get Reboot On END');
    } else {
      this.platform.log.warn('1. Get Reboot On FAIL: Is NOT Rebooting');
    }

  

    callback(null, this.exampleStates.IsRebooting);
  }

}
