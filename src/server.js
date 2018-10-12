import express from 'express';
import request from 'request-promise';

const app = express();
let currentUrl = '';

setInterval(async () => {
  try {
    const res = await request({ url: `${currentUrl}ping` });
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}, 120000);

app.get('/', (req, res) => {
  currentUrl = req.query.url ? req.query.url : '';
  res.send(`Server is available. Current url is ${currentUrl}`);
});

app.get('/ping', (req, res) => res.send(`I am alive on url ${currentUrl}`));

app.listen(443, () => {
  console.log('App listening on port 3000');
});
