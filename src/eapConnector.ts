import { Http2ServerResponse } from 'http2';
import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse, AxiosError } from 'axios';
import {Md5} from 'md5-typescript';
import { ExampleHomebridgePlatform } from './platform';

export class EAPConnector {

    //private axios = await require('axios').default;
    private sessionCookie = '';

    private EAP_Ip: string;
    private EAP_User: string;
    private EAP_Password: string;

    private EAP_Url : string;
    private EAP_PasswordHash: string;

    constructor(
        private readonly ip: string,
        private readonly user: string,
        private readonly password: string,
        private readonly platform: ExampleHomebridgePlatform,
    ) {

      this.EAP_Ip = ip;
      this.EAP_User = user;
      this.EAP_Password = password;
 
      this.EAP_Url = 'http://' + this.EAP_Ip;

      this.EAP_PasswordHash = Md5.init(this.EAP_Password).toUpperCase();

      this.platform.log.debug('INIT Connector');
  
    }

    extractCookie(cookieObj : string) {

      this.sessionCookie = cookieObj[0].split(';')[0];

    }

    async connect() {
      this.platform.log.debug('1. CONNECT Connector START');

      return axios.get(this.EAP_Url)
        .then( (response) => {

          this.extractCookie(response.headers['set-cookie']);
          this.platform.log.debug('2. CONNECT Connector COOKIE: ', this.sessionCookie);
          this.platform.log.debug('3. CONNECT Connector END');
                  
        })
        .catch( (error) => {
          this.platform.log.debug('2. CONNECT Connector COOKIE FAIL');
          this.platform.log.debug('3. CONNECT Connector END');
        });
              

    }

    async login() {                 
      let canLogin = true;
      let isLoggedIn = false;
      let isConnected = false;

      await this.connect().then( () => {
        if (this.sessionCookie === '') {
          isConnected = false;
        } else {
          isConnected = true;
        }
      });

      this.platform.log.debug('1. LOGIN Connector START');
      const formData = 'username='+ this.EAP_User +'&password=' + this.EAP_PasswordHash;

      if (isConnected) {
    
        this.platform.log.debug('3. GET LOGIN STATUS END');        
   
        try {
          const loginStatusResponse = await this.getLoginStatus(); 

          this.platform.log.debug('3. GET LOGIN STATUS Response: ', loginStatusResponse.data);

          if (loginStatusResponse.data.error === 0) {
            canLogin = true;
          } else{
            canLogin = false;
          }    
          
        } catch (error) {
          this.platform.log.debug('2. GET LOGIN STATUS FAIL! Error: ', error);
          this.platform.log.debug('3. GET LOGIN STATUS END');
          canLogin = false;
        }

      }         


      if (canLogin) {
        const loginResponse = await axios.post(this.EAP_Url, 
          formData                  
          ,
          {
            headers: 
                    {
                      'Cookie': this.sessionCookie, 
                      'Content-Type':'application/x-www-form-urlencoded',
                      'Referer':  this.EAP_Url + '/',
                      'Origin':  this.EAP_Url,
                      'X-Requested-With': 'XMLHttpRequest',
                    },
          }).then( (response) => {
                 
          this.platform.log.debug('2. LOGIN Connector SUCCESS!');
          this.platform.log.debug('3. LOGIN Connector END');
          isLoggedIn = true;

        })
          .catch( (error) => {
            this.platform.log.debug('2. LOGIN Connector FAIL! Error: ', error);
            this.platform.log.debug('3. LOGIN Connector END');
            isLoggedIn = false;
          });

      } else {
        this.platform.log.debug('2. LOGIN Connector FAIL! Error: Cant Log In');
        this.platform.log.debug('3. LOGIN Connector END');
      }           
                
      return isLoggedIn;

    }

    async getLoginStatus() {

      this.platform.log.debug('1. GET LOGIN STATUS Connector START');

      ///data/login.json

      return axios.post(this.EAP_Url + '/data/login.json',
        'operation=read',
        {
          headers: 
            {'Cookie': this.sessionCookie, 
              'Content-Type':'application/x-www-form-urlencoded',
              'Referer':  this.EAP_Url + '/',
              'Origin':  this.EAP_Url,
              'X-Requested-With': 'XMLHttpRequest',
            },
        },
      );
       
      

    }


    async getLEDEnable() {
        
      let isEnabled = false;
      let isLoggedIn = false;
            
      await this.login().then( (logged) => {                     
        //this.platform.log.debug('Logged in?', logged);
        isLoggedIn = logged;
      });

      this.platform.log.debug('1. GET LED Connector START');

      if (isLoggedIn) {
        const formData = 'operation=read';

        const response = await axios.post(this.EAP_Url + '/data/ledctrl.json', 
          formData,
          {
            headers: 
                    { 'Cookie': this.sessionCookie, 
                      'Content-Type':'application/x-www-form-urlencoded',
                      'Referer':  this.EAP_Url + '/',
                      'Origin':  this.EAP_Url,
                      'X-Requested-With': 'XMLHttpRequest',
                    },
          });
    
        //this.platform.log.debug('Full Response: ', response); 
    
        if (response.data.data) {
          this.platform.log.debug('2. GET LED Connector Status:', response.data.data.enable); 
    
          if (response.data.data.enable === 'on') {
            isEnabled = true;
          } else {
            isEnabled = false;
          }
        } else {
          this.platform.log.debug('2. GET LED Connector Status FAIL'); 
        }
      } else {
        this.platform.log.debug('2. GET LED Connector Status FAIL: Cant Log in'); 
      }

      this.platform.log.debug('3. GET LED Connector END');
      return isEnabled;
         
    }



    async setLEDEnable(enabled: boolean) {
      let isEnabled = false;
      let isLoggedIn = false;

      await this.login().then( (logged) => {                     
        //this.platform.log.debug('Logged in?', logged);
        isLoggedIn = logged;
      });

      this.platform.log.debug('1. SET LED Connector START');

      if (isLoggedIn) {           

        let internalValue = 'on';

        if (enabled) {
          internalValue = 'on';
        } else {
          internalValue = 'off';
        }

        const formData = 'operation=write&enable=' + internalValue;

        const response = await axios.post(this.EAP_Url + '/data/ledctrl.json', 
          formData,
          {
            headers: 
                {'Cookie': this.sessionCookie, 
                  'Content-Type':'application/x-www-form-urlencoded',
                  'Referer':  this.EAP_Url + '/',
                  'Origin':  this.EAP_Url,
                  'X-Requested-With': 'XMLHttpRequest',
                },
          });

        if (response.data.data.enable === 'on') {
          isEnabled = true;
        } else {
          isEnabled = false;
        }

        this.platform.log.debug('2. SET LED Connector Status: ', response.data.data.enable); 
      } else {
        this.platform.log.debug('2. SET LED Connector Status FAIL: Cant Log in'); 
      }

      this.platform.log.debug('3. SET LED Connector END');
      return isEnabled;
    }

    async getOnlineStatus() {
      let isOnline = true;

      this.platform.log.debug('1. GET Online Status START');

      const response = await axios.get(this.EAP_Url + '/data/rebootState.json', 
        {
          headers: 
                {
                  'Content-Type':'application/x-www-form-urlencoded',
                  'Referer':  this.EAP_Url + '/',
                  'Origin':  this.EAP_Url,
                  'X-Requested-With': 'XMLHttpRequest',
                },
        }).then( (response) => {                   
        isOnline = true;
      })
        .catch( (error) => {
          isOnline = false;
        });

      this.platform.log.debug('3. GET Online Status STATUS: ', isOnline );
            
      this.platform.log.debug('3. GET Online Status END');
      return isOnline;
    }

    async rebootDevice() {
      let isRequested = false;
      let isLoggedIn = false;

      await this.login().then( (logged) => {                     
        //this.platform.log.debug('Logged in?', logged);
        isLoggedIn = logged;
      });

      this.platform.log.debug('1. SET REBOOT Request Connector START');

      if (isLoggedIn) {

        ///data/configReboot.json
        const response = await axios.get(this.EAP_Url + '/data/configReboot.json', 
          {
            headers: 
                {
                  'Cookie': this.sessionCookie, 
                  'Content-Type':'application/x-www-form-urlencoded',
                  'Referer':  this.EAP_Url + '/',
                  'Origin':  this.EAP_Url,
                  'X-Requested-With': 'XMLHttpRequest',
                },
          }).then( (response) => {
              
          isRequested = true;
        })
          .catch( (error) => {
           
            isRequested = false;
          });

      } else {
        this.platform.log.debug('2. SET REBOOT Request Connector FAIL: Cant Log in');
        isRequested = false;
      }

      this.platform.log.debug('3. SET REBOOT Request Connector END');
            
      return isRequested;
    }

}

