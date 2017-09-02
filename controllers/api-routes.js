// dependencies: articleSaver helper functions
const articleSaver = require('../helpers/article-saver.js');

// importing database models (mongoose)
const Article = require('../models/Article.js'),
	Comment = require('../models/Comment.js'),
	User = require('../models/User.js');

// exports as function which takes in app as parameter
module.exports = (app, passport) => {
	// get route for search
	app.get('/search', (req, res) => {
		// early returns if no search is specified
		if (!req.query.q) {
			return res.send('No search query has been specified.');
		}
		// graps queryStr from value of /search?q=, replacing multiple spaces with
		// just one space and single spaces with plus signs
		let queryStr = (req.query.q).replace(/\s\s+/g, ' ').replace(/\s/g, '+');
		console.log('User searched: "' + queryStr + '"');
		// sends query string to helper function searching nytimes,
		// which returns a promise with results in the callback
		articleSaver.nytimes.search(queryStr).then((results) => {
			// if no results, break promise chain by throwing error message
			if (!results || !results.length) {
				throw 'NO RESULTS WERE FOUND FOR USER SEARCH';
			}
			console.log('RESULTS FOUND! NUMBER OF ARTICLES: ' + results.length);
			console.log('SYNCING ARTICLES WITH THE DATABASE...');
			// return articleSaver.db.sync to process scraped articles and return them 
			// in a form that is synced with the mongoose database
			return articleSaver.db.sync(results);
		}).then((articles) => {
			console.log('SYNCING COMPLETE! SENDING ARTICLES TO USER.');
			res.json({results: articles, responseMsg: "Number of Articles Found: " + articles.length});
		}).catch((err) => {
			// error handler, responseMsg depending on error
			console.log(err);
			let responseMsg = '';
			if (err === 'NO RESULTS WERE FOUND FOR USER SEARCH') {
				responseMsg = 'User search did not yield any results.';
			} else {
				responseMsg = 'Unable to perform search.';
			}
			res.json({results: [], responseMsg: responseMsg});
		}); // end of promise chain
	}); // end of app.get('/search')

	// route for signing up new users. authenticates with passport local strategy 'local-signup'
	app.post('/user/new', passport.authenticate('local-signup', {
		successRedirect: '/',
		failureRedirect: '/signin'
	}));
	// route for signing in. authenticates with passport local strategy 'local-signin'
	app.post('/user/signin', passport.authenticate('local-signin', {
		successRedirect: '/',
		failureRedirect: '/signin'
	}));
	// route for signing in as guest.
	app.post('/user/guest', passport.authenticate('local-signin', {
		successRedirect: '/',
		failureRedirect: '/signin'
	}));
	// app.post('/user/guest', passport.authenticate('local-signup', {
	// 	successRedirect: '/',
	// 	failureRedirect: '/signin'
	// }));

	// route for letting users save articles
	app.post('/save', (req, res) => {
		// early return if there's no user logged in
		if (!req.user) {
			console.log('Cannot save aritcle - No user logged in.');
			return res.send('Cannot save aritcle - No user logged in.');
		}
		let articleId = req.body._id;
		let userId = req.user._id;
		console.log('SAVING ARTICLE ' + articleId + ' for user...');

		User.update({_id: userId}, { $push: { saved_articles: articleId } }, (err1, data) => {
			if (err1) {
				console.log(err1);
				return res.send('Server error. Unable to save article.');
			}
			console.log("PUSHED ONTO USER'S SAVED ARTICLES!");
			Article.update({_id: articleId}, { $push: { savers: userId } }, (err2, data) => {
				if (err2) {
					console.log(err2);
					return res.send("Server error. Unable to add user to article's savers.");
				}
				console.log("PUSHED ONTO ARTICLE'S SAVERS!");
				res.send('Article successfully saved!');
			});

		});
	});

	// get route for retrieving saved articles
	app.get('/savedarticles/all', (req, res) => {
		// early returns if no user exists in session
		if (!req.user) {
			console.log('NO USER LOGGED IN. REDIRECTING TO SIGNIN PAGE...');
			return res.redirect('/siginin');
		}
		User.findById(req.user._id).populate('saved_articles').exec().then(thisUser => {
			console.log('RESULTS FOUND! NUMBER OF SAVED ARTICLES: ' + thisUser.saved_articles.length);
			console.log('SENDING ARTICLES BACK TO USER...');
			res.json({
				results: thisUser.saved_articles,
				responseMsg: "Number of Articles Found: " + thisUser.saved_articles.length
			});
		}).catch((err) => {
			console.log('SERVER ERROR: UNABLE TO LOCATE SAVED ARTICLES.');
			console.log(err);
			res.json({
				results: [],
				responseMsg: "Server error: Unable to locate saved articles."
			});
		});			
	}); // end of app.get('/search')
};



		/*
		// get user by id, findOneAndUpdate
		User.findOne({_id: req.user._id}, (err1, thisUser) => {
			if (err1) {
				console.log(err1);
				return res.json(err1);
			}
			Article.findOne({_id: articleId}, (err2, article) => {
				if (err2) {
					console.log(err2);
					return res.json(err2);
				}
				// push article onto user's saved articles array
				User.update
				// push user onto article's savers array

				thisUser.saved_articles.push(article);
				article.savers.push(thisUser);
				thisUser.save();
				article.save();
				res.send('Article successfully saved!');
				console.log('ARTICLE SAVED!');
			});
		});
		*/