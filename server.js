// ================ Dependencies ================
const express = require('express'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
    exphbs = require('express-handlebars'),
    logger = require('morgan'),
    request = require('request'),
    cheerio = require('cheerio'),
    mongoose = require('mongoose'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    bcrypt = require('bcryptjs'); // for encryption;

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

// importing database models (mongoose)
const Article = require('./models/Article.js'),
	Comment = require('./models/Comment.js'),
	User = require('./models/User.js');

// ================ Passport Configuration (User Authentication) ================
// Passport session setup
passport.serializeUser((user, done) => {
	console.log("serializing " + user.username);
	done(null, user);
});
passport.deserializeUser((obj, done) => {
	console.log("deserializing " + obj);
	done(null, obj);
});
// sets up sign-in LocalStrategy within Passport
passport.use('local-signin', new LocalStrategy({
    passReqToCallback : true //allows us to pass back the request to the callback
	}, (req, username, password, done) => {
		// checks database for user by username
		User.where({'username' : username}).findOne((err, user) => {
			if (err) {
				// sends and returns error if database throws an error
				console.log("SERVER ERROR");
				req.session.error = 'Server error.';
				return done(err);
			}
			// if no result is found, return done(null, false), set session msg
			if (user == null) {
				console.log("USER NOT FOUND:", username);
				req.session.notice = 'No user exists with that username.'
								+ ' Please try again or create a new account.';
				return done(null, false);
			}
			console.log("FOUND USER: " + username);
			// saves encrypted password as locally scoped variable
			const hash = user.password;
			// uses bcrypt to see if password matches hash. if so, returns done(null, user)
			if (bcrypt.compareSync(password, hash)) {
				console.log("PASSWORD MATCHED!");
				console.log("LOGGED IN AS: " + username);
				req.session.success = 'You are successfully logged in as ' + username + '!';
				return done(null, user);
			}
			// if strategy reaches this point, it must mean the password doesn't match
			console.log("PASSWORD DOESN'T MATCH");
			req.session.notice = 'Password is incorrect. Please try again.';
			return done(null, false);
		}); // end of .findOne callback
	} //end of passport callback
)); // end of passport.use
// Sets up sign-up LocalStrategy within Passport
passport.use('local-signup', new LocalStrategy({
	passReqToCallback : true //allows us to pass back the request to the callback
	}, (req, username, password, done) => {
		// first searches to see if username exists in database
		User.where({'username' : username}).findOne((err, user) => {
			// early returns if there's an error
			if (err) {
				console.log(err);
				console.log('FAILED TO CREATE USER:', username);
				req.session.error = 'Server error: Failed to create new user account.'
									+ ' Please try again later.';
				return done(err);
			}				
			// if user exists, display fail messages and return done(null, false)
			if (user != null) {
				console.log("USER ALREADY EXISTS:" + username);
				req.session.notice = "An account has already been created with"
								+ " that username. Please try another one."
				return done(null, false);
			}
			// instantiates locally scoped constables, encrypts password argument.
			// values come from username parameter, hash (encrypted pw), and req.body
			const hash = bcrypt.hashSync(password, 8);
			const userData = {
				username: username,
				password: hash,
				email: req.body.email,
				first_name: req.body.first_name,
				last_name: req.body.last_name
			};
			const newUser = new User(userData);
			console.log("CREATING USER: " + username + "...");
			// attempts to save new user into database.
			newUser.save().then(userDoc => {
				console.log('ACCOUNT SUCCESSFULLY CREATED! ' + username);
				console.log('New User Data:');
				console.log(userDoc);
				// if user was successfully able to create an account, display success
				// message and return done(null, user)
				req.session.success = "Account successfully created! Signed in as: " + username;
				return done(null, userDoc);
			}).catch(err => {
				console.log('ERROR. FAILED TO CREATE USER.');
				console.log(err);
				req.session.error = 'Failed to create user.';
				return done(err);
			});
		// if an error was thrown then display server error messages
		}); // end of .findOne callback
	} // end of passport callback
)); // end of passport.use

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

// Passport, Session and cookieParser configuration with express instance
app.use(cookieParser());
app.use(session({secret: 'plainbozo', saveUninitialized: true, resave: true}));
app.use(passport.initialize());
app.use(passport.session());

// Session-persisted message middleware
app.use((req, res, next) => {
  var err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});

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
		require('./controllers/api-routes.js')(app, passport);
	});
});