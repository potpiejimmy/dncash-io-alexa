/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a sample skill built with Amazon Alexa Skills nodejs
 * skill development kit.
 * This sample supports multiple languages (en-US, en-GB, de-GB).
 * The Intent Schema, Custom Slot and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-howto
 **/

'use strict';

const Alexa = require('alexa-sdk');
const fetch = require('node-fetch');

const APP_ID = 'amzn1.ask.skill.5d0cc6ea-d5cd-40c5-ac98-7d8fce354b60';

const languageStrings = {
    'en': {
        translation: {
            SKILL_NAME: 'd n cash i o',
            WELCOME_MESSAGE: "Welcome to %s. You can say, I need a hundred euros ... Now, what can I help you with?",
            WELCOME_REPROMPT: 'For instructions on what you can say, please say help me.',
            HELP_MESSAGE: "You can say, I need a hundred euros, or, you can say exit...Now, what can I help you with?",
            HELP_REPROMPT: "You can say things like, I need a hundred euros, or you can say exit...Now, what can I help you with?",
            STOP_MESSAGE: 'Goodbye!',
            GET_MONEY_REPONSE: 'Okay, just go the next ATM, present your smartphone and you will get %s euros.'
        },
    },
    'de': {
        translation: {
            SKILL_NAME: 'd n cash ei o',
            WELCOME_MESSAGE: 'Willkommen bei %s. Du kannst zum Beispiel sagen: Ich brauche 100 Euro.',
            WELCOME_REPROMPT: 'Wenn du wissen möchtest, was du sagen kannst, sag einfach „Hilf mir“.',
            HELP_MESSAGE: 'Du kannst beispielsweise sagen: „Ich brauche 100 Euro“ oder du kannst „Beenden“ sagen ... Wie kann ich dir helfen?',
            HELP_REPROMPT: 'Du kannst beispielsweise sagen: „Ich brauche 100 Euro“ oder du kannst „Beenden“ sagen ... Wie kann ich dir helfen?',
            STOP_MESSAGE: 'Auf Wiedersehen!',
            GET_MONEY_REPONSE: 'Okay, halte einfach dein Handy an den nächsten Geldautomaten und du bekommst %s Euro.'
        },
    },
};

const handlers = {
    //Use LaunchRequest, instead of NewSession if you want to use the one-shot model
    // Alexa, ask [my-skill-invocation-name] to (do something)...
    'LaunchRequest': function () {
        this.attributes.speechOutput = this.t('WELCOME_MESSAGE', this.t('SKILL_NAME'));
        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again with this text.
        this.attributes.repromptSpeech = this.t('WELCOME_REPROMPT');

        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    'GetMoneyIntent': function () {
        const amount = this.event.request.intent.slots.amount.value;
        
        invokeBackend.call(this, "https://dncashapi.dn-sol.net/dnapi/token/v1/tokens", {method:'POST', body: JSON.stringify({
            device_uuid: process.env.DEVICE_UUID,
            amount: parseInt(amount) * 100,
            symbol: "EUR",
            type: "CASHOUT",
            refname: "alexa-"+this.event.request.requestId
        })}).then(rres => {
            console.log("dncash.io RESULT: " + JSON.stringify(rres));
            this.attributes.speechOutput = this.t('GET_MONEY_REPONSE', amount);
    
            this.response.speak(this.attributes.speechOutput);
            this.response.cardRenderer('dncash.io', this.attributes.speechOutput);
            this.emit(':responseReady');
        });
    },
    'AMAZON.HelpIntent': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');

        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    'AMAZON.RepeatIntent': function () {
        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'AMAZON.CancelIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'SessionEndedRequest': function () {
        this.attributes.speechOutput = this.t('STOP_MESSAGE');
        this.response.speak(this.attributes.speechOutput);
        console.log(`Session ended: ${this.event.request.reason}`);
        this.emit(':responseReady');
    },
    'Unhandled': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');
        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function invokeBackend(url, options) {
    options.headers = {
        "Content-Type": "application/json",
        "DN-API-KEY": process.env.DN_API_KEY,
        "DN-API-SECRET": process.env.DN_API_SECRET
    };
    return fetch(url, options)
        .then(res => res.json())
        .catch(err => {
            this.attributes.speechOutput = "Es ist ein Fehler aufgetreten";
            this.response.speak(this.attributes.speechOutput);
            this.response.cardRenderer('dncash.io', "Fehler: " + JSON.stringify(err));
            this.emit(':responseReady');
        });
}
