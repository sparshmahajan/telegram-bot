require('dotenv').config();
const { TelegramClient, Api } = require("telegram");
const { StoreSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");

const apiId = process.env.API_ID * 1;
const apiHash = process.env.API_HASH;
const storeSession = new StoreSession('/session');

(async () => {
    const client = new TelegramClient(storeSession, apiId, apiHash, {
        connectionRetries: 5,
    });
    await client.start({
        phoneNumber: process.env.PHONE_NUMBER,
        phoneCode: async () => await input.text("Please enter the code you received: "),
        onError: (err) => console.log(err),
    });



    const messageHandler = async (newMessage) => {
        if (newMessage.message.message.includes('/search')) {
            if (newMessage.message.peerId.className === 'PeerChat' || newMessage.message.out === true || newMessage.originalUpdate.className === 'UpdateNewChannelMessage' || newMessage.originalUpdate.className === 'MessageReplyHeader') {
                return;
            }
            const messageIGet = newMessage.message.message.replace('/search ', '');
            console.log(messageIGet);

            const messageToSend = new Set();
            const mediaIDs = new Set();

            for await (const message of client.iterMessages(undefined, {
                search: messageIGet,
                limit: undefined,
                filter: new Api.InputMessagesFilterDocument()
            }
            )) {
                if (message.message !== 'This group is unavailable due to copyright infringement.' && message.message !== 'This channel is unavailable due to copyright infringement.' && message.message !== 'This message is unavailable due to a copyright infringement.') {
                    if (message.message.toLowerCase().includes(messageIGet.toLowerCase()) && message.message !== '')
                        if (!mediaIDs.has(message.media.document.id.value)) {
                            mediaIDs.add(message.media.document.id.value);
                            messageToSend.add(message);
                        }
                }
            }

            for await (const message of client.iterMessages(undefined, {
                search: messageIGet,
                limit: undefined,
                filter: new Api.InputMessagesFilterVideo()
            }
            )) {
                if (message.message !== 'This group is unavailable due to copyright infringement.' && message.message !== 'This channel is unavailable due to copyright infringement.' && message.message !== 'This message is unavailable due to a copyright infringement.') {
                    if (message.message.toLowerCase().includes(messageIGet.toLowerCase()) && message.message !== '')
                        if (!mediaIDs.has(message.media.document.id.value)) {
                            mediaIDs.add(message.media.document.id.value);
                            messageToSend.add(message);
                        }
                }
            }

            for await (const message of client.iterMessages(undefined, {
                search: messageIGet,
                limit: undefined,
                filter: new Api.InputMessagesFilterRoundVideo()
            }
            )) {
                if (message.message !== 'This group is unavailable due to copyright infringement.' && message.message !== 'This channel is unavailable due to copyright infringement.' && message.message !== 'This message is unavailable due to a copyright infringement.') {
                    if (message.message.toLowerCase().includes(messageIGet.toLowerCase()) && message.message !== '')
                        if (!mediaIDs.has(message.media.document.id.value)) {
                            mediaIDs.add(message.media.document.id.value);
                            messageToSend.add(message);
                        }
                }
            }

            if (messageToSend.size === 0) {
                await client.sendMessage(newMessage.message.fromId, {
                    message: 'No results found , please wait for Sparsh to reply'
                });
            }

            await client.markAsRead(newMessage.message.fromId);

            for await (const message of messageToSend) {
                await client.sendMessage(newMessage.message.fromId, {
                    message: message,
                });
            }
        }
    };
    client.addEventHandler(messageHandler, new NewMessage({}));
})();

console.log('Bot started');