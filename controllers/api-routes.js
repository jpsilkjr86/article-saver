// dependencies: articleSaver helper functions
const articleSaver = require('../helpers/article-saver.js');

// exports as function which takes in app as parameter
module.exports = (app, passport) => {
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

	// api get route for searching
	app.get('/search/exec', (req, res) => {
		console.log(req.query);
		console.log('second');
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

	// api post route for letting users save articles
	app.post('/save', (req, res) => {
		// early return if there's no user logged in
		if (!req.user) {
			console.log('Cannot save aritcle - No user logged in.');
			return res.send('Cannot save aritcle - No user logged in.');
		}
		// instantiates temp variables for building update arguments
		let articleId = req.body._id;
		console.log('SAVING ARTICLE ' + articleId + '...');
		articleSaver.db.saveArticle(req.user.username, articleId).then(data => {
			// early returns & sends message to user if article has already been saved
			if (!data.success) {
				console.log('ARTICLE ALREADY EXISTS AMONG SAVED ARTICLES.')
				return res.send('Article already exists among saved articles.');
			}
			console.log('ARTICLE SUCCESSFULLY SAVED!');
			res.send('Article successfully saved!');
		}).catch(err => {
			console.log('SERVER ERROR. UNABLE TO SAVE ARTICLE (SEE ERROR LOG)');
			console.log(err);
			res.send('Server error. Unable to save article.');
		});
	});
	// route for letting users unsave articles
	app.post('/unsave', (req, res) => {
		// early return if there's no user logged in
		if (!req.user) {
			console.log('Cannot save aritcle - No user logged in.');
			return res.send('Cannot save aritcle - No user logged in.');
		}
		console.log('UNSAVING ARTICLE ' + req.body._id + '...');
		// calls promise chain through Promise.all()
		articleSaver.db.unsaveArticle(req.user.username, req.body._id).then(data => {
			console.log('ARTICLE SUCCESSFULLY UNSAVED.');
			res.send('Article successfully unsaved.');
		}).catch(err => {
			console.log('SERVER ERROR. UNABLE TO UNSAVE ARTICLE (SEE ERROR LOG)');
			console.log(err);
			res.send('Server error. Unable to unsave article.');
		});
	});
	// get route for retrieving saved articles in json
	app.get('/articles/saved/all', (req, res) => {
		// early returns if no user exists in session
		if (!req.user) {
			console.log('CANNOT RETRIEVE SAVED ARTICLES. NO USER LOGGED IN.');
			return res.send('Cannot retrieve saved articles. No user logged in.');
		}
		console.log('GETTING SAVED ARTICLES FROM DATABASE FOR USER ' + req.user.username + '...')
		articleSaver.db.getAllSaved(req.user._id).then(saved_articles => {
			console.log('RESULTS FOUND! NUMBER OF SAVED ARTICLES: ' + saved_articles.length);
			console.log('SENDING ARTICLES BACK TO USER...');
			res.json({
				results: saved_articles,
				responseMsg: "Number of Articles Found: " + saved_articles.length
			});
		}).catch((err) => {
			console.log('SERVER ERROR: UNABLE TO LOCATE SAVED ARTICLES.');
			console.log(err);
			res.json({
				results: [],
				responseMsg: "Server error: Unable to locate saved articles."
			});
		});			
	}); // end of app.get('/articles/saved/all')
	// get route for retrieving most saved articles in json
	app.get('/articles/saved/mostsaved', (req, res) => {
		// early returns if no user exists in session
		if (!req.user) {
			console.log('CANNOT RETRIEVE MOST SAVED ARTICLES. NO USER LOGGED IN.');
			return res.send('Cannot retrieved most saved articles. No user logged in.');
		}
		articleSaver.db.getMostSaved().then(results => {
			res.json({
				results: results,
				responseMsg: "Results found!"
			});
		}).catch((err) => {
			console.log('SERVER ERROR: UNABLE TO LOCATE MOST SAVED ARTICLES.');
			console.log(err);
			res.json({
				results: [],
				responseMsg: "Server error: Unable to locate most saved articles."
			});
		});			
	}); // end of app.get('articles/saved/mostsaved')
	// get route for retrieving most commented articles in json
	app.get('/articles/mostcommented', (req, res) => {
		// early returns if no user exists in session
		if (!req.user) {
			console.log('CANNOT RETRIEVE MOST COMMENTED ARTICLES. NO USER LOGGED IN.');
			return res.send('Cannot retrieved most commented articles. No user logged in.');
		}
		articleSaver.db.getMostCommented().then(results => {
			res.json({
				results: results,
				responseMsg: "Results found!"
			});
		}).catch((err) => {
			console.log('SERVER ERROR: UNABLE TO LOCATE MOST COMMENTED ARTICLES.');
			console.log(err);
			res.json({
				results: [],
				responseMsg: "Server error: Unable to locate most commented articles."
			});
		});	
	}); // end of app.get('articles/mostcommented')
	// get route for retrieving individual article data in json
	app.get('/articles/:id', (req, res) => {
		// early returns if no user exists in session
		if (!req.user) {
			console.log('CANNOT RETRIEVE ARTICLE DATA. NO USER LOGGED IN.');
			return res.send('Cannot retrieve article data. No user logged in.');
		}
		articleSaver.db.getArticleData(req.params.id).then(article => {
			if (!article) {
				return res.send('No article found by id: ' + req.params.id);
			}
			res.json(article);
		}).catch((err) => {
			console.log('SERVER ERROR: UNABLE TO LOCATE ARTICLE.');
			console.log(err);
			res.send('Server error: unable to locate article.');
		});			
	});
	// get route for retrieving article data in json
	app.post('/articles/:id/comment/new', (req, res) => {
		// early returns if no user exists in session
		if (!req.user) {
			console.log('UNABLE TO POST NEW comment: NO USER LOGGED IN.');
			return res.send('Unable to post new comment: no user is logged in.');
		}
		const commentContent = {
			title: req.body.title,
			body: req.body.body,
			author: req.user.username,
			article: req.params.id
		};
		console.log('ATTEMPTING TO POST NEW COMMENT...');
		articleSaver.db.saveComment(commentContent).then(data => {
			console.log("PROCESS COMPLETE! REDIRECTING TO SAVEDARTICLES...");
			res.redirect('back');
		}).catch((err) => {
			console.log('SERVER ERROR: UNABLE TO POST COMMENT AND/OR SAVE ARTICLE (SEE ERROR LOG).');
			console.log(err);
			res.send('Server error: unable to post comment and/or save article to user.');
		});
	});
};