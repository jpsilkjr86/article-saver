
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
		res.send('You searched: ' + queryStr);

		// sends query string to helper function searching nytimes,
		// which returns a promise with results in the callback

			// if !results.length, tell user that their search did not yield any results.

			// else server responds by sending results back as json object (with array)

	});
};