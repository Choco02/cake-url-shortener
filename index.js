const express = require('express');
const app = express();
const helmet = require('helmet');
const mongoose = require('mongoose');
const morgan = require('morgan');
const { createWriteStream } = require('fs');

const urls = require('./models/urlmodel');
require('dotenv').config();

const DEV = process.argv[2];
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected successful'))
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

const accessLogStream = createWriteStream('./access.log', { flags: 'a' });

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));
app.use(morgan('combined', { stream: accessLogStream }));
app.set('view engine', 'ejs');

app.get('/index', async (req, res) => {
  res.render('index', { result: req.query.result })
});

app.post('/index', async (req, res) => {
  const createdUrls = databaseCache.map(a => a.short);

  const customUrl = req.body.custom ? simpleSanitize(req.body.custom) : null;

  const url = req.body.url;
  const re = /(?:https?):\/\/[a-z0-9_-]+\.\w+.*/gi;
  if (!url) return res.redirect('/index?result= ');
  if (!re.test(url)) {
    return res.redirect('/index?result=Invalid URL');
  }
  if (url) {
    let short;
    if (!req.body.custom) {
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
    res.redirect(`/index?result=${req.protocol}://${DEV ? req.hostname + ':' + PORT : req.hostname}/${short}`);
  }
});

app.get('*', async (req, res) => {
  const url = req.path.replace('/', '');
  const dbData = await urls.findOne({ short: url });

  if (!dbData) return res.redirect('/index');

  res.redirect(dbData.url);
});

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);

  const mode = DEV ? '\u001b[31m' : '\u001b[32;1m';

  console.log(`${mode}Running in mode ${DEV ? 'DEV' : 'PROD'} \u001b[0m`);
});
