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
		// builds promise chain
		const promise1 = User.update({_id: userId}, { $push: { saved_articles: articleId }}).exec();
		const promise2 = Article.update({_id: articleId}, { $push: { savers: req.user.username }}).exec();
		console.log('SAVING ARTICLE ' + articleId + '...');
		// calls promise chain through Promise.all()
		Promise.all([promise1, promise2]).then(data => {
			console.log('ARTICLE SUCCESSFULLY SAVED!');
			res.send('Article successfully saved!');
		}).catch(err => {
			console.log('SERVER ERROR. UNABLE TO SAVE ARTICLE (SEE ERROR LOG)');
			console.log(err);
			res.send('Server error. Unable to save article.');
		});
		// User.update({_id: userId}, { $push: { saved_articles: articleId } }, (err1, data) => {
		// 	if (err1) {
		// 		console.log(err1);
		// 		return res.send('Server error. Unable to save article.');
		// 	}
		// 	console.log("PUSHED ONTO USER'S SAVED ARTICLES!");
		// 	Article.update({_id: articleId}, { $push: { savers: userId } }, (err2, data) => {
		// 		if (err2) {
		// 			console.log(err2);
		// 			return res.send("Server error. Unable to add user to article's savers.");
		// 		}
		// 		console.log("PUSHED ONTO ARTICLE'S SAVERS!");
		// 		res.send('Article successfully saved!');
		// 	});

		// });
	});
	// get route for retrieving saved articles in json
	app.get('/articles/saved/all', (req, res) => {
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
	// get route for retrieving article data in json
	app.get('/articles/:id', (req, res) => {
		// early returns if no user exists in session
		if (!req.user) {
			console.log('NO USER LOGGED IN. REDIRECTING TO SIGNIN PAGE...');
			return res.redirect('/siginin');
		}
		Article.findById(req.params.id).populate('comments').populate('user').exec().then(article => {
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
		// creates new Comment instance
		const content = {
			title: req.body.title,
			body: req.body.body,
			author: req.user.username,
			article: req.params.id
		};
		const newComment = new Comment(content);
		console.log('ATTEMPTING TO POST NEW COMMENT...');
		console.log(newComment);
		console.log('FINDING ARTICLE IN DATABASE...');
		Article.findById(req.params.id).exec().then(article => {
			console.log('ARTICLE FOUND! PUSHING COMMENT AND SAVER TO ARTICLE, AND SAVING COMMENT...');
			article.comments.push(newComment);
			article.savers.push(req.user._id);
			return Promise.all([article.save(), newComment.save()]);
		}).then(data => {
			console.log('COMMENT SAVED AND ARTICLE PUSHED! FINDING USER IN DATABASE...');
			return User.findById(req.user._id).exec();
		}).then(user => {
			user.saved_articles.push(req.params.id);
			user.posted_comments.push(newComment);
			console.log("USER FOUND! PUSHING SAVED ARTICLE AND COMMENT TO USER...");
			return user.save();
		}).then(data => {
			console.log("PROCESS COMPLETE! REDIRECTING TO SAVEDARTICLES...");
			res.redirect('/articles/saved');
		}).catch((err) => {
			console.log('SERVER ERROR: UNABLE TO POST COMMENT AND/OR SAVE ARTICLE (SEE ERROR LOG).');
			console.log(err);
			res.send('Server error: unable to post comment and/or save article to user.');
		});
	});
};