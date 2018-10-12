import firebase from 'firebase';
import request from 'request-promise';
import cheerio from 'cherio';
import TelegramBot from 'node-telegram-bot-api';
import moment from 'moment';

import { telegramToken, firebaseConfig, publics } from './config';

moment.locale('ru');

const bot = new TelegramBot(telegramToken, { polling: true });

firebase.initializeApp(firebaseConfig);
const ref = firebase.database().ref();
const sitesRef = ref.child('vklinks');

const getAllPublications = async (chatId, category) => {
  await Promise.all(publics.map(async (url) => {
    try {
      const response = await request({ url });

      const $ = cheerio.load(response);

      $('.wi_date').each((i, elem) => {
        const link = `vk.com${$(elem).attr('href')}`;

        sitesRef.orderByChild('link').equalTo(link).once('value', (snapshot) => {
          if (!snapshot.exists()) {
            sitesRef.push().set({
              link,
              category,
            });

            bot.sendMessage(chatId, link);
          }
        });
      });
    } catch (error) {
      console.error(error);
    }
  }));
};

bot.onText(/\/news/, (msg) => {
  bot.sendMessage(msg.chat.id, "I'm back, baby! Bite my shiny metal ass", {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'All',
          callback_data: 'all',
        }, {
          text: 'ZED',
          callback_data: 'zed',
        }, {
          text: 'Movieblog',
          callback_data: 'movieblog',
        },
      ]],
    },
  });
});

bot.on('callback_query', (callbackQuery) => {
  const { message, data: category } = callbackQuery;

  if (category === 'all') {
    getAllPublications(message.chat.id, category);
  }

  if (category === 'movieblog') {
    bot.sendMessage(message.chat.id, 'Work in progress');
  }

  if (category === 'zed') {
    bot.sendMessage(message.chat.id, 'Work in progress');
  }
});

setInterval(() => getAllPublications(196420418, 'all'), 180000);

if (moment().format('H') === '9') {
  bot.sendMessage(196420418, 'Good morning, good luck!😎');
}
