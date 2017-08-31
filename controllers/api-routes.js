// dependencies: articleSaver helper functions
const articleSaver = require('../helpers/article-saver.js');
// exports as function which takes in app as parameter
module.exports = (app) => {
	// post route for search
	// app.get('/search/:query', (req, res) => {
	app.get('/search', (req, res) => {
		// let query = req.params.query;
		// console.log(query);
		// res.send('You searched: ' + query);
		// graps queryStr from value of /search?q= 
		let queryStr = req.query.q;
		console.log('User searched: "' + queryStr + '"');
		// res.send('You searched: ' + queryStr);

		// sends query string to helper function searching nytimes,
		// which returns a promise with results in the callback
		articleSaver.nytimes.search(queryStr).then((results) => {
			console.log(results);
			// if no results, tells user that their search did not yield results.
			if (!results || !results.length) {
				console.log('NO RESULTS WERE FOUND FOR USER SEARCH');
				res.json({results: [], responseMsg: "Search did not yield any results"});
			} // else server responds by sending results back as json object
			else {
				console.log('RESULTS FOUND! NUMBER OF ARTICLES: ' + results.length);
				res.json({results: results, responseMsg: "Number of Articles Found: " + results.length});
				// res.send(results);
			}
		}).catch((err) => {
			console.log('ERROR SEARCHING WITH ARTICLE SAVER');
			console.log(err);
		});
	});
};