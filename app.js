var bodyParser = require('body-parser');
var express = require('express');
var routes = require('./routes/main');

var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.set('views', './views');
app.engine('html', require('ejs').renderFile);
app.use(express.static(__dirname + "/views"));
app.use(routes);
app.use(express.urlencoded({extended: true}));
app.locals.islogin = false;

var server = app.listen(8000, function(){
    console.log("Node.js is listening to PORT:" + server.address().port);
});