const express = require('express');
const app = express();
const helmet = require('helmet');
const mongoose = require('mongoose');

const urls = require('./models/urlmodel');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected sucessfull'))
  .catch(err => console.log(err.stack));

let databaseCache;

urls.find({})
  .then(data => {
    databaseCache = data;
  });

const generateUrl = () => {
  const str = `${Math.floor(Math.random() * 200).toString(36)}${Date.now().toString(36)}`;
  return str;
};

/* eslint-disable */
const simpleSanitize = (str) => str.replace(/[^\w:\/\/\.@#\-=?%]/gi, '');

app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/index', async (req, res) => {
  const createdUrls = databaseCache.map(a => a.short);

  const customUrl = req.query.custom ? simpleSanitize(req.query.custom) : null;

  const url = req.query.url;
  const re = /(https?:\/\/)?(www\.)?((\w+-){1,4}|\w+)\w+\.\w+\/.*/gi;
  if (!url) return res.render('index', { result: ' ' });
  if (!re.test(url)) return res.render('index', { result: 'URL invalida' });
  if (url) {
    let short;
    if (!req.query.custom) {
      short = generateUrl();
    }
    else if (createdUrls.includes(customUrl)) {
      let rand;
      let currentCustom = customUrl;
      while (createdUrls.includes(currentCustom)) {
        rand = Math.random().toFixed(2) * 1000;

        currentCustom = `${currentCustom}${rand}`;
      }
      short = currentCustom;
    }
    else short = customUrl;
    /* eslint-disable */
    await new urls({
      url: url,
      short: short
    }).save()
    /* eslint-enable */
    databaseCache = await urls.find({});
    res.render('index', { result: `${req.protocol}://${req.hostname}/${short}` });
  }
});

app.get('/favicon.ico', (req, res) => {
  // Consertar isso depois
  res.end();
});

app.get('*', async (req, res) => {
  const url = req.path.replace('/', '');

  const dbData = await urls.findOne({ short: url });

  if (!dbData) return res.redirect('/index');

  res.redirect(dbData.url);
});

app.listen(3000, () => {
  console.log('Logged in');
});
