require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const urlParser = require('url');

const client = new MongoClient(process.env.MONGO_URI)
const db = client.db('urlshortener')
const urls = db.collection('urls')


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', (req, res) => {
  const url = req.body.url

  const dnslookup = dns.lookup(urlParser.parse(url).hostname, async (err, address) => {
    if (!address) {
      res.json({
        error: 'Invalid URL'
      })
    }

    const urlCount = await urls.countDocuments({})
    const data = {
      url: url,
      short_url: urlCount
    }

    await urls.insertOne(data)

    res.json({
      original_url: url,
      short_url: urlCount
    })
  })
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = req.params.short_url

  const urlDoc = await urls.findOne({ short_url: +shortUrl })

  res.redirect(urlDoc.url)
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
