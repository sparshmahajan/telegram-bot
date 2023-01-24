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
        if (newMessage.message.peerId.className === 'PeerChat' || newMessage.originalUpdate.className === 'UpdateNewChannelMessage' || newMessage.originalUpdate.className === 'MessageReplyHeader') {
          return;
        }

        await client.sendMessage(newMessage.message.fromId, {
          message: 'Searching for the file , please wait'
        });

        const messageToSend = new Set();
        const mediaIDs = new Set();

        const searchInTelegram = async (messageIGet, season) => {
          for await (const message of client.iterMessages(undefined, {
            search: messageIGet,
            limit: undefined,
            filter: new Api.InputMessagesFilterDocument()
          }
          )) {
            if (message.media?.document?.size.value < 52428800) {
              continue;
            }
            if (message.media !== null) {
              if (!mediaIDs.has(message.media.document.id.value)) {
                if (season === '') {
                  mediaIDs.add(message.media.document.id.value);
                  messageToSend.add(message);
                } else if (message.message.toLowerCase().includes(season)) {
                  mediaIDs.add(message.media.document.id.value);
                  messageToSend.add(message);
                }
              }
            }
          }

          for await (const message of client.iterMessages(undefined, {
            search: messageIGet,
            limit: undefined,
            filter: new Api.InputMessagesFilterVideo(),
          }
          )) {
            if (message.media?.document?.size.value < 52428800) {
              continue;
            }
            if (message.media !== null) {
              if (!mediaIDs.has(message.media.document.id.value)) {
                if (season === '') {
                  mediaIDs.add(message.media.document.id.value);
                  messageToSend.add(message);
                } else if (message.message.toLowerCase().includes(season)) {
                  mediaIDs.add(message.media.document.id.value);
                  messageToSend.add(message);
                }
              }
            }
          }

          for await (const message of client.iterMessages(undefined, {
            search: messageIGet,
            limit: undefined,
            filter: new Api.InputMessagesFilterRoundVideo(),
          }
          )) {
            if (message.media?.document?.size.value < 52428800) {
              continue;
            }
            if (message.media !== null) {
              if (!mediaIDs.has(message.media.document.id.value)) {
                if (season === '') {
                  mediaIDs.add(message.media.document.id.value);
                  messageToSend.add(message);
                } else if (message.message.toLowerCase().includes(season)) {
                  mediaIDs.add(message.media.document.id.value);
                  messageToSend.add(message);
                }
              }
            }
          }
        };

        let season = newMessage.message.message.slice(-3).toLowerCase();
        let messageIGet = newMessage.message.message.replace('/search ', '');

        if (season.includes('s0') || season.includes('s1')) {
          messageIGet = messageIGet.slice(0, -3);
        } else {
          season = '';
        }
        await searchInTelegram(messageIGet, season);

        if (messageIGet.includes(' ')) {
          messageIGet = messageIGet.replace(' ', '.');
          await searchInTelegram(messageIGet, season);
        }

        if (messageToSend.size === 0) {
          await client.sendMessage(newMessage.message.fromId, {
            message: 'No results found , please wait for Sparsh to reply'
          });
          return;
        }

        const userId = newMessage.message.fromId;

        await client.markAsRead(userId);
        
        messageToSend.forEach(async (message) => {
          if (message.peerId?.channelId) {
            const channels = await client.invoke(new Api.channels.GetChannels({
              id: [new Api.InputChannel({
                channelId: message.peerId.channelId,
                accessHash: message.peerId.accessHash,
              })],
            }));

            if (channels.noforwards === true) {
              messageToSend.delete(message);
            }
          }
        });
        console.log(messageToSend.size);

        if (messageToSend.size > 100) {
          await client.sendMessage(userId, {
            message: `Too many results, please be more specific in your search .\n\n Try to mention the year of the movie or the season of the series like s01 and for episodes e01 but don't use both at the same time`
          });
          return;
        }

        await client.invoke(new Api.messages.ForwardMessages({
          fromPeer: userId,
          id: Array.from(messageToSend).map(message => message.id),
          randomId: Array.from(messageToSend).map(message => message.id * 2),
          toPeer: userId,
          dropAuthor: true,
          asAlbum: false,
        }));

        await client.sendMessage(userId, {
          message: 'These are all the results we could find , if you want to search for something else , please use the /search command'
        });
      } else if(newMessage.message.message.toLowerCase() === 'hello bot'){
        await client.sendMessage(newMessage.message.fromId, {
          message: 'Hello there, I am a bot made by Sparsh to help you find movies and series in the telegram group , if you want to search for something , please use the /search command'
        });
      }
    };
    client.addEventHandler(messageHandler, new NewMessage({}));
  })();
} catch (error) {
  console.log(error);
}