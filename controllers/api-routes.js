// dependencies: articleSaver helper functions
const articleSaver = require('../helpers/article-saver.js');
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
};