var express = require('express');
var app = express();

// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder'),
//    restify = require('restify'),
    request = require('request').defaults({ encoding: null }),
    url = require('url'),
    validUrl = require('valid-url'),
    imageService = require('./image-service');

// Maximum number of hero cards to be returned in the carousel. If this number is greater than 10, skype throws an exception.
var MAX_CARD_COUNT = 10;

//=========================================================
// Bot Setup
//=========================================================
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

app.use(express.static(__dirname + '/dist'));
app.get('/', function(req, res) {
    res.render('index');
});

app.listen(process.env.port || process.env.PORT || 8080, function() {
    console.log('Humanoid is running');
});
app.get('/api/param/:name', function(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
});
app.post('/api/messages', connector.listen());

// Bot setup
// var bot = new builder.UniversalBot(connector, function (session) {
//     var cards = getCardsAttachments();

//     // create reply with Carousel AttachmentLayout
//     var reply = new builder.Message(session)
//         .attachmentLayout(builder.AttachmentLayout.carousel)
//         .attachments(cards);

//     session.send(reply);
// });

var userStore = [];
var bot = new builder.UniversalBot(connector, function (session) {
    // store user's address
    var address = session.message.address;
    userStore.push(address);

    // end current dialog
    session.endDialog('You\'ve been invited to a survey! It will start in a few seconds...');
});

// Every 5 seconds, check for new registered users and start a new dialog
setInterval(function () {
    var newAddresses = userStore.splice(0);
    newAddresses.forEach(function (address) {

        console.log('Starting survey for address:', address);

        // new conversation address, copy without conversationId
        var newConversationAddress = Object.assign({}, address);
        // delete newConversationAddress.conversation;

        // start survey dialog
        bot.beginDialog(newConversationAddress, 'survey', null, function (err) {
            if (err) {
                // error ocurred while starting new conversation. Channel not supported?
                bot.send(new builder.Message()
                    .text('This channel does not support this operation: ' + err.message)
                    .address(address));
            }
        });

    });
}, 5000);

bot.dialog('survey', [
    function (session) {
        builder.Prompts.text(session, 'Hello... What\'s your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.number(session, 'Hi ' + results.response + ', How many years have you been coding?');
    },
    function (session, results) {
        session.userData.coding = results.response;
        builder.Prompts.choice(session, 'What language do you code Node using? ', ['JavaScript', 'CoffeeScript', 'TypeScript']);
    },
    function (session, results) {
        session.userData.language = results.response.entity;
        session.endDialog('Got it... ' + session.userData.name +
            ' you\'ve been programming for ' + session.userData.coding +
            ' years and use ' + session.userData.language + '.');
    }
]);

function getCardsAttachments(session) {
    return [
        new builder.HeroCard(session)
            .title('Azure Storage')
            .subtitle('Offload the heavy lifting of data center management')
            .text('Store and help protect your data. Get durable, highly available data storage across the globe and pay only for what you use.')
            .images([
                builder.CardImage.create(session, 'https://docs.microsoft.com/en-us/azure/storage/media/storage-introduction/storage-concepts.png')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/storage/', 'Learn More')
            ]),

        new builder.ThumbnailCard(session)
            .title('DocumentDB')
            .subtitle('Blazing fast, planet-scale NoSQL')
            .text('NoSQL service for highly available, globally distributed apps—take full advantage of SQL and JavaScript over document and key-value data without the hassles of on-premises or virtual machine-based cloud database options.')
            .images([
                builder.CardImage.create(session, 'https://docs.microsoft.com/en-us/azure/documentdb/media/documentdb-introduction/json-database-resources1.png')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/documentdb/', 'Learn More')
            ]),

        new builder.HeroCard(session)
            .title('Azure Functions')
            .subtitle('Process events with a serverless code architecture')
            .text('An event-based serverless compute experience to accelerate your development. It can scale based on demand and you pay only for the resources you consume.')
            .images([
                builder.CardImage.create(session, 'https://azurecomcdn.azureedge.net/cvt-5daae9212bb433ad0510fbfbff44121ac7c759adc284d7a43d60dbbf2358a07a/images/page/services/functions/01-develop.png')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/functions/', 'Learn More')
            ]),

        new builder.ThumbnailCard(session)
            .title('Cognitive Services')
            .subtitle('Build powerful intelligence into your applications to enable natural and contextual interactions')
            .text('Enable natural and contextual interaction with tools that augment users\' experiences using the power of machine-based intelligence. Tap into an ever-growing collection of powerful artificial intelligence algorithms for vision, speech, language, and knowledge.')
            .images([
                builder.CardImage.create(session, 'https://azurecomcdn.azureedge.net/cvt-68b530dac63f0ccae8466a2610289af04bdc67ee0bfbc2d5e526b8efd10af05a/images/page/services/cognitive-services/cognitive-services.png')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/cognitive-services/', 'Learn More')
            ])
    ];
}