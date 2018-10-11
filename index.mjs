import TelegramBot from 'node-telegram-bot-api';
import firebase from 'firebase';
import ogs from 'open-graph-scraper';
import request from 'request';
import cheerio from 'cheerio';

const publics = [
  'https://vk.com/zoomeveryday',
  'https://vk.com/themovieblog',
  'https://vk.com/bleess',
  'https://vk.com/hypewave',
  'https://vk.com/thememeblog',
  'https://vk.com/zaosquad',
  'https://vk.com/imperius_rex'
]

const token = '554855781:AAHD-CC2MTUUArSdf-AGxcHQGhBdsD-0cww';
const bot = new TelegramBot(token, {polling: true});

const app = firebase.initializeApp({
  apiKey: "AIzaSyBtUK_QFIzq0B87usZeoEWh_XBc2QL_nfg",
  authDomain: "botich-database.firebaseapp.com",
  databaseURL: "https://botich-database.firebaseio.com",
  projectId: "botich-database",
  storageBucket: "botich-database.appspot.com",
  messagingSenderId: "11592849269"
});

const ref = firebase.database().ref();
const sitesRef = ref.child("vklinks");

bot.onText(/\/news/, (msg) => {
  bot.sendMessage(msg.chat.id,'Hello Mr. Vadim, what you would like to see today?', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'All',
          callback_data: 'all'
        },{
          text: 'ZED',
          callback_data: 'zed'
        },{
          text: 'Movieblog',
          callback_data: 'movieblog'
        }
      ]]
    }
  });
});

bot.on("callback_query", (callbackQuery) => {
  const message = callbackQuery.message;

  if(callbackQuery.data === 'movieblog') {
    bot.sendMessage(message.chat.id, 'Work in progress')
  }

  if(callbackQuery.data === 'movieblog') {
    bot.sendMessage(message.chat.id, 'Work in progress')
  }

  if(callbackQuery.data === 'all') {
    publics.map(el => {
      request({ url: el}, (err, response, body) => {
        if (err) {
          return err;
        }

        const $ = cheerio.load(body);

        $('.wi_date').each(function(i, elem) {
          const link = `vk.com${$(elem).attr('href')}`

          sitesRef.orderByChild("link").equalTo(link).once('value', function(snapshot) {
            if (!snapshot.exists()){
              sitesRef.push().set({
                link: `vk.com${$(elem).attr('href')}`,
                category: callbackQuery.data
              });
              bot.sendMessage(message.chat.id, link)
            }
          });

        });
      });
    })
  }
});

setInterval(function() {
  publics.map(el => {
    request({ url: el}, (err, response, body) => {
      if (err) {
        return err;
      }

      const $ = cheerio.load(body);

      $('.wi_date').each(function(i, elem) {
        const link = `vk.com${$(elem).attr('href')}`

        sitesRef.orderByChild("link").equalTo(link).once('value', function(snapshot) {
          if (!snapshot.exists()){
            sitesRef.push().set({
              link: `vk.com${$(elem).attr('href')}`,
              category: 'all'
            });
            bot.sendMessage(196420418, link)
          }
        });

      });
    });
  })
}, 1800000)