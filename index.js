require('dotenv').config();
const { TelegramClient, Api } = require("telegram");
const { StoreSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");

const apiId = process.env.API_ID * 1;
const apiHash = process.env.API_HASH;
const storeSession = new StoreSession('/session');

try {
    (async () => {
        const client = new TelegramClient(storeSession, apiId, apiHash, {
            connectionRetries: 5,
        });
        await client.start({
            phoneNumber: process.env.PHONE_NUMBER,
            phoneCode: async () => await input.text("Please enter the code you received: "),
            onError: (err) => console.log(err),
        });

        console.log('Bot started');

        const messageHandler = async (newMessage) => {
            if (newMessage.message.message.includes('/search')) {
                if (newMessage.message.peerId.className === 'PeerChat' || newMessage.message.out === true || newMessage.originalUpdate.className === 'UpdateNewChannelMessage' || newMessage.originalUpdate.className === 'MessageReplyHeader') {
                    return;
                }

                const messageToSend = new Set();
                const mediaIDs = new Set();

                const searchInTelegram = async (messageIGet) => {
                    for await (const message of client.iterMessages(undefined, {
                        search: messageIGet,
                        limit: undefined,
                        filter: new Api.InputMessagesFilterDocument()
                    }
                    )) {
                        if (message.media !== null) {
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
                        if (message.media !== null) {
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
                        if (message.media !== null) {
                            if (!mediaIDs.has(message.media.document.id.value)) {
                                mediaIDs.add(message.media.document.id.value);
                                messageToSend.add(message);
                            }
                        }
                    }
                };

                let messageIGet = newMessage.message.message.replace('/search ', '');
                await searchInTelegram(messageIGet);

                if (messageIGet.includes(' ')) {
                    messageIGet = messageIGet.replace(' ', '.');
                    await searchInTelegram(messageIGet);
                }

                if (messageToSend.size === 0) {
                    await client.sendMessage(newMessage.message.fromId, {
                        message: 'No results found , please wait for Sparsh to reply'
                    });
                    return;
                }

                await client.markAsRead(newMessage.message.fromId);
                console.log(messageToSend.size)
                for(let i=0;i<messageToSend.size;i++){
                    await client.sendMessage(newMessage.message.fromId, {
                        message: Array.from(messageToSend)[i]
                    });

                    if( i != 0 && i % 50 === 0){
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                }
            }
        };
        client.addEventHandler(messageHandler, new NewMessage({}));
    })();
} catch (error) {
    console.log(error);
}