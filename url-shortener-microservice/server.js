'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var dns = require('dns');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// DB Models
var db = mongoose.connect(process.env.DB_URI);

var Schema = mongoose.Schema;


var urlSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, index: true, unique: true, required: true }
});

var ShortUrl = mongoose.model('urls', urlSchema);


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post("/api/shorturl/new", function(req,res){
  try {
    var url = new URL(req.body.url);
    var host = url.hostname; 
  }
  catch (err) {
    res.json({"error":"invalid URL"});
  }
  
  dns.lookup(host, (err, hostname) => {
    if (err) {
      console.log(err);
      res.json({"error":"invalid URL"});
    }
    else {
      var result;
      ShortUrl.findOne({ original_url: url.href }, (err, doc) => {
        if (err) return console.log(err);
        
        if (doc) {
          result = { orginal_url: doc.original_url, short_url: doc.short_url };
          res.json(result);
        }
        else {
          ShortUrl.estimatedDocumentCount((err, count) => {
            var created = new ShortUrl({ original_url: url.href, short_url: count });
            created.save();
            
            result = { original_url: created.original_url, short_url: created.short_url };
            res.json(result);
          });
        }
      });
    }
  });
});

app.get('/api/shorturl/:id?', (req, res) => {
  var id = req.params.id
  ShortUrl.findOne({ short_url: id }, (err, found) => {
    if(found){
     res.redirect(found.original_url); 
    }
    else {
      res.status(404).send('Not found');
    }
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});