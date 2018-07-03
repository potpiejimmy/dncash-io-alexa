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

const languageStrings = {
    'en': {
        translation: {
            SKILL_NAME: 'd n cash i o',
            WELCOME_MESSAGE: "Welcome to %s. You can say, I need a hundred euros ... Now, what can I help you with?",
            WELCOME_REPROMPT: 'For instructions on what you can say, please say help me.',
            HELP_MESSAGE: "You can say, I need a hundred euros, or, you can say exit...Now, what can I help you with?",
            HELP_REPROMPT: "You can say things like, I need a hundred euros, or you can say exit...Now, what can I help you with?",
            STOP_MESSAGE: 'Goodbye!',
            GET_MONEY_RESPONSE: 'Okay, just go the next ATM, present your smartphone and you will get %s euros.',
            AUTHENTICATE_MESSAGE: 'To start using this skill, please use the companion app to authenticate to %s',
            MULTIPLE_OF_TEN_ALLOWED: 'Only numbers multiple of 10 are allowed. Please choose a different amount.',
            AMOUNT_REPROMT: 'Which amount you want to withdraw?',
            AMOUNT_GREATER_TEN: 'You cannot withdraw less than 10 Euro. Please choose a different amount.'
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
            GET_MONEY_RESPONSE: 'Okay, halte einfach dein Handy an den nächsten Geldautomaten und du bekommst %s Euro.',
            AUTHENTICATE_MESSAGE: 'Um diesen Skill nutzen zu können, musst du dich in der Alexa App mit %s verknüpfen.',
            MULTIPLE_OF_TEN_ALLOWED: 'Es sind nur vielfache von 10 erlaubt. Bitte wählte einen anderen Betrag',
            AMOUNT_REPROMT: 'Welchen Betrag möchtest du auszahlen?',
            AMOUNT_GREATER_TEN: 'Du kannst nicht weniger als 10 Euro auszahlen. Bitte wähle einen anderen Betrag.'
        },
    },
};

const handlers = {
    //Use LaunchRequest, instead of NewSession if you want to use the one-shot model
    // Alexa, ask [my-skill-invocation-name] to (do something)...
    'LaunchRequest': function () {
        //if no amazon token, return a LinkAccount card
        if (this.event.session.user.accessToken == undefined) {
            this.emit(':tellWithLinkAccountCard', this.t('AUTHENTICATE_MESSAGE', this.t('SKILL_NAME')));
            return;
        }

        this.attributes.speechOutput = this.t('WELCOME_MESSAGE', this.t('SKILL_NAME'));
        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again with this text.
        this.attributes.repromptSpeech = this.t('WELCOME_REPROMPT');

        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    'GetMoneyIntent': function () {
        if (this.event.session.user.accessToken == undefined) {
            this.emit(':tellWithLinkAccountCard', this.t('AUTHENTICATE_MESSAGE', this.t('SKILL_NAME')));
            return;
        }

        var amount = this.event.request.intent.slots.amount.value;

        if(amount < 10) {
            this.response.speak(this.t('AMOUNT_GREATER_TEN')).listen(this.t('AMOUNT_REPROMT'));
            this.emit(':responseReady');
            return;
        } else if(amount%10 != 0) {
            this.response.speak(this.t('MULTIPLE_OF_TEN_ALLOWED')).listen(this.t('AMOUNT_REPROMT'));
            this.emit(':responseReady');
            return;
        }

        //checks done -> round every 2.0 to 2!
        amount = Math.round(amount);
        
        invokeBackend.call(this, "https://dncashapi.dn-sol.net/dnapi/token/v1/tokens", {method:'POST', body: JSON.stringify({
            device_uuid: JSON.parse(alexa.event.session.user.accessToken).DEVICE_UUID,
            amount: parseInt(amount) * 100,
            symbol: "EUR",
            type: "CASHOUT",
            refname: "alexa-"+this.event.request.requestId
        })}).then(rres => {
            console.log("dncash.io RESULT: " + JSON.stringify(rres));
            this.attributes.speechOutput = this.t('GET_MONEY_RESPONSE', amount);
    
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
    alexa.APP_ID = process.env.APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function invokeBackend(alexa, url, options) {

    options.headers = {
        "Content-Type": "application/json",
        "DN-API-KEY": JSON.parse(alexa.event.session.user.accessToken).DN_API_KEY,
        "DN-API-SECRET": JSON.parse(alexa.event.session.user.accessToken).DN_API_SECRET
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
