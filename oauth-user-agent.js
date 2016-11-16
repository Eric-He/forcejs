/**
 * ForceJS - REST toolkit for Salesforce.com
 * Author: Christophe Coenraets @ccoenraets
 * Version: 0.8.0
 */
"use strict";

let instanceCounter = 0;

let // if page URL is http://localhost:3000/myapp/index.html, context is /myapp
    context = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")),

    // if page URL is http://localhost:3000/myapp/index.html, serverURL is http://localhost:3000
    serverURL = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : ''),

    // if page URL is http://localhost:3000/myapp/index.html, baseURL is http://localhost:3000/myapp
    baseURL = serverURL + context,

    // Reference to the Salesforce OAuth plugin
    oauthPlugin;

let getQueryStringAsObject = url => {
    let obj = {},
        index = url.indexOf('#');
    if (index > -1) {
        let queryString = decodeURIComponent(url.substr(index + 1)),
            params = queryString.split('&');
        params.forEach(param => {
            let splitter = param.split('=');
            obj[splitter[0]] = splitter[1];
        });
    }
    return obj;
};

export default {
    createInstance: (oauth, options) => {
        return window.cordova ? new OAuthCordova(oauth, options) : new OAuthWeb(oauth, options);
    }
}

class OAuth {

    constructor(appId, loginURL, oauthCallbackURL) {
        instanceCounter = instanceCounter + 1;
        this.instanceId = instanceCounter;
        this.appId = appId || "3MVG9fMtCkV6eLheIEZplMqWfnGlf3Y.BcWdOf1qytXo9zxgbsrUbS.ExHTgUPJeb3jZeT8NYhc.hMyznKU92";
        this.loginURL = loginURL || "https://login.salesforce.com";
        this.oauthCallbackURL = oauthCallbackURL || baseURL + '/oauthcallback.html';
    }

    login() {
    }

}

class OAuthCordova extends OAuth{

    login() {
        return new Promise((resolve, reject) => {
            document.addEventListener("deviceready", () => {
                oauthPlugin = cordova.require("com.salesforce.plugin.oauth");
                if (!oauthPlugin) {
                    console.error('Salesforce Mobile SDK OAuth plugin not available');
                    reject('Salesforce Mobile SDK OAuth plugin not available');
                    return;
                }
                oauthPlugin.getAuthCredentials(
                    function (creds) {
                        resolve({
                            accessToken: creds.accessToken,
                            instanceURL: creds.instanceUrl,
                            refreshToken: creds.refreshToken
                        });
                    },
                    function (error) {
                        console.log(error);
                        reject(error);
                    }
                );
            }, false);
        });
    }

}

class OAuthWeb extends OAuth {

    login() {
        return new Promise((resolve, reject) => {

            console.log('loginURL: ' + this.loginURL);
            console.log('oauthCallbackURL: ' + this.oauthCallbackURL);

            document.addEventListener("oauthCallback", (event) => {

                let url = event.detail,
                    oauthResult = getQueryStringAsObject(url);

                if (oauthResult.state == this.instanceId) {

                    if (oauthResult.access_token) {
                        resolve({
                            accessToken: oauthResult.access_token,
                            instanceURL: oauthResult.instance_url,
                            refreshToken: oauthResult.refresh_token
                        });
                    } else {
                        reject(oauthResult);
                    }
                }

            });

            let loginWindowURL = this.loginURL + `/services/oauth2/authorize?client_id=${this.appId}&redirect_uri=${this.oauthCallbackURL}&response_type=token&state=${this.instanceId}`;
            window.open(loginWindowURL, '_blank', 'location=no');

        });

    }

}