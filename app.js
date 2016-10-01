var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3987, function() {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
// var connector = new builder.ChatConnector({
//     appId: process.env.MICROSOFT_APP_ID,
//     appPassword: process.env.MICROSOFT_APP_PASSWORD
// });

var connector = new builder.ConsoleConnector().listen();
// server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector);
var intents = new builder.IntentDialog();
bot.dialog('/', intents);

// Bot Dialogs

intents.matches(/^change name/i, [
    function(session) {
        session.beginDialog('/profile');
    },
    function (session, results) {
        session.send("Ok... changed your name to %s", session.userData.name);
    }
]);

intents.matches(/^help/i, [
    function(session) {
        session.beginDialog('/help');
    },
])

intents.matches(/^resume/i, [
    function(session) {
        session.beginDialog('/resume');
    }
])

intents.onDefault([
    function(session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function(session, results) {
        session.send("Hello %s", session.userData.name);
    }
]);

bot.dialog('/profile', [
    function(session) {
        builder.Prompts.text(session, 'What is your name?');
    },
    function(session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

bot.dialog('/help', [
    function(session) {
        session.send("Ask me anything about Arnold! Try 'experience', 'projects', or 'work'");
        session.endDialog();
    }
])

bot.dialog('/resume', [
    function(session, args, next) {
        builder.Prompts.text(session, "Would you like to download or the resume or have it emailed to you?");
    },
    function(session, results, next) {
        if (results.response == 'download') {
            request('/actions/resume_download', function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    session.send("Success! You should have his resume downloaded");
                } else {
                    session.send("Something went wrong! His resume could not be downloaded");
                }
                session.endDialog();
            });
        } else {
            builder.Prompts.text(session, "What is your email?");
            session.userData.email = results.response;
            next();
        }
    },
    function(session, results, next) {
        session.userData.email = results.response;
        session.send("Ok, I'm sending Arnold's resume to %s", session.userData.email);
        session.endDialog();
    },
]);