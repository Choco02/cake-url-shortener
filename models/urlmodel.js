const { model, Schema } = require('mongoose');

const urlModel = new Schema({
  url: String,
  short: String
});

module.exports = model('urls', urlModel);
