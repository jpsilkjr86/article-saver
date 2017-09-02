// ================ Dependencies ================
const express = require('express'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
    exphbs = require('express-handlebars'),
    logger = require('morgan'),
    request = require('request'),
    cheerio = require('cheerio'),
    mongoose = require('mongoose');

// sets up express app
const app = express();
const port = process.env.PORT || 3000;

// ================ Mongoose Configuration ================
// configure mongoose promises to ES6 Promises
mongoose.Promise = Promise;
// set database configuration
const remoteUri = 'mongodb://heroku_21s8xm66:bl3i996k7smok7vsfbomhre6en@ds023540.mlab.com:23540/heroku_21s8xm66';
mongoose.connect(remoteUri, { useMongoClient: true });
// const localUri = 'mongodb://localhost/article-saver';
// mongoose.connect(localUri, { useMongoClient: true });

// save connection as variable
const db = mongoose.connection;

// ================ Express Configuration ================
// Configures Express and body parser
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride('X-HTTP-Method-Override'));

// serves public directory as static, enabling html pages to link with their assets
app.use(express.static('public'));

// Handlebars Engine Configuration
// Override with POST having ?_method=DELETE
app.use(methodOverride('_method'));
// Sets handlebars as rendering engine
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// ================ Connection Establishment ================
// show any mongoose connection errors
db.on('error', function(error) {
 	console.log('Mongoose Error: ', error);
});

// attempts to establish connection to mongoose db
db.once('open', function() {
	console.log('Mongoose connection successful.');
	// listens to port for running server within mongoose connection callback
	app.listen(port, () => {
		console.log('App listening on port ' + port);
		// sets up routes
		require('./controllers/html-routes.js')(app);
		require('./controllers/api-routes.js')(app);
	});
});