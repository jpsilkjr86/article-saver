// dependencies: articleSaver helper functions
const articleSaver = require('../helpers/article-saver.js');
// exports as function which takes in app as parameter
module.exports = (app) => {
	// post route for search
	// app.get('/search/:query', (req, res) => {
	app.get('/search', (req, res) => {
		// graps queryStr from value of /search?q= 
		let queryStr = req.query.q;
		// replaces multiple spaces with just one space
		queryStr = queryStr.replace(/\s\s+/g, ' ');
		// replaces single spaces with plus sign
		queryStr = queryStr.replace(/\s/g, '+');
		console.log('User searched: "' + queryStr + '"');
		// sends query string to helper function searching nytimes,
		// which returns a promise with results in the callback
		articleSaver.nytimes.search(queryStr).then((results) => {
			// if no results, tells user that their search did not yield results.
			if (!results || !results.length) {
				console.log('NO RESULTS WERE FOUND FOR USER SEARCH');
				res.json({results: [], responseMsg: "Search did not yield any results"});
				throw 'NO RESULTS WERE FOUND FOR USER SEARCH';
			} else {
				console.log('RESULTS FOUND! NUMBER OF ARTICLES: ' + results.length);
				console.log('SYNCING ARTICLES WITH THE DATABASE...');
				// return articleSaver.db.sync to process scraped articles and return them 
				// in a form that is synced with the mongoose database
				return articleSaver.db.sync(results);
			}
		}).then((articles) => {
			console.log('SYNCING COMPLETE! SENDING ARTICLES TO USER.');
			res.json({results: articles, responseMsg: "Number of Articles Found: " + articles.length});
		}).catch((err) => {
			console.log(err);
			// condition added to avoid res.send twice
			if (err !== 'NO RESULTS WERE FOUND FOR USER SEARCH') {
				console.log('ERROR SEARCHING WITH ARTICLE SAVER');
				res.send('Unable to complete search.');
			}
		});
	});
};