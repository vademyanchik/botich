import firebase from 'firebase';
import request from 'request-promise';
import cheerio from 'cherio';
import TelegramBot from 'node-telegram-bot-api';

import { telegramToken, firebaseConfig } from './config';

const bot = new TelegramBot(telegramToken, { polling: true });
firebase.initializeApp(firebaseConfig);
const ref = firebase.database().ref();
const sitesRef = ref.child('vklinks');
const publicsRef = ref.child('publics');

const getAllPublications = (chatId, category) => {
  publicsRef.once('value')
    .then((snapshot) => {
      snapshot.forEach((childSnapshot) => {
        request({ url: childSnapshot.val().link })
          .then((response) => {
            const $ = cheerio.load(response);

            $('.wi_date').each((i, elem) => {
              const link = `vk.com${$(elem).attr('href')}`;

              sitesRef.orderByChild('link').equalTo(link).once('value', async (snp) => {
                if (!snp.exists()) {
                  sitesRef.push().set({
                    link,
                    category,
                  });

                  const res = await request({ url: `https://${link}` });
                  const images = [];
                  let message = '';
                  const cherio = cheerio.load(res);

                  cherio('.wi_body > .pi_text').find('br').replaceWith('\n');
                  /* eslint-disable */
                  cherio('.wi_body > .pi_text').map((i, el) => message = $(el).text());
                  cherio('div > .wi_body .thumbs_map > a > div').each((index, element) => images.push($(element).attr('data-src_big')));

                  if(images.length === 1 ) {
                    await bot.sendPhoto(chatId, images[0].substring(0, images[0].indexOf('|')), {caption: `${message}\n\n${link}`});
                  } 
                  if(images.length > 1) {
                    await bot.sendMediaGroup(chatId, images.filter(n => n).map(el => ({ type: 'photo', media: el.substring(0, el.indexOf('|')) })));
                  }
                }
              });
            });
          })
          .catch(error => console.error(error));
      });
    });
};

const getListOfPublic = async (chatId) => {
  const snapshot = await publicsRef.once('value');

  snapshot.forEach((childSnapshot) => {
    const url = childSnapshot.val().link;

    request({ url })
      .then((response) => {
        const $ = cheerio.load(response);

        $('.op_header').each((i, elem) => bot.sendMessage(
          chatId,
          `${$(elem).text().trim()}`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                {
                  text: 'Remove',
                  callback_data: `remove ${url}`,
                },
              ]],
            },
          },
        ));
      })
      .catch(err => console.error(err));
  });
};

bot.onText(/\/news/, msg => getAllPublications(msg.chat.id, 'all'));

bot.onText(/\/commands/, (msg) => {
  bot.sendMessage(msg.chat.id, "I'm back, baby! Bite my shiny metal ass", {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'News',
          callback_data: 'news',
        }, {
          text: 'List',
          callback_data: 'list',
        }, {
          text: 'Add new',
          callback_data: 'new',
        },
      ]],
    },
  });
});

bot.onText(/\/list/, async (msg) => {
  getListOfPublic(msg.chat.id);
});

bot.onText(/\/add (.+)/, async (msg, match) => {
  const link = match[1];

  request({ url: link })
    .then(res => publicsRef.orderByChild('link').equalTo(link).once('value', (snp) => {
      if (!snp.exists()) {
        publicsRef.push().set({ link });
        const $ = cheerio.load(res);

        bot.sendMessage(msg.chat.id, `Public ${$('.op_header').text().trim()} successfully added!`);
      } else {
        bot.sendMessage(msg.chat.id, 'Already exist!');
      }
    }))
    .catch(() => bot.sendMessage(msg.chat.id, `Public ${link} does not exist!`));
});

bot.onText(/\/remove (.+)/, async (msg, match) => {
  const link = match[1];

  publicsRef.orderByChild('link').equalTo(link).once('value', (snp) => {
    if (snp.exists()) {
      bot.sendMessage(msg.chat.id, 'Need to check how remove node on firebase!');
    } else {
      bot.sendMessage(msg.chat.id, 'Does not exist!');
    }
  });
});

bot.on('callback_query', (callbackQuery) => {
  const { message, data: category } = callbackQuery;

  if (category === 'news') {
    getAllPublications(message.chat.id, category);
  }

  if (category === 'list') {
    getListOfPublic(message.chat.id);
  }

  if (category === 'new') {
    bot.sendMessage(message.chat.id, 'Write /add url');
  }
});

setInterval(() => getAllPublications(196420418, 'all'), 180000);
