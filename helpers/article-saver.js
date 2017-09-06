// dependencies: cheerio (for scraping)
const cheerio = require('cheerio'),
	request = require('request'),
	phantom = require('phantom');

// importing database models (mongoose)
const Article = require('../models/Article.js'),
	Comment = require('../models/Comment.js'),
	User = require('../models/User.js');

// declares object to be exported (article saver helper = ash)
const ash = {
	// phantom helper object
	phantom: {
		// phantom getHTML helper function
		getHTML: (url) => {
			// returns promise that resolves with html of desired page or rejects with an error
			return new Promise ((resolve, reject) => {
				// instantiates locally scoped variables that will persist through promise chain
				let sitepage = null;
				let phInstance = null;
				// creates phantom instance
				phantom.create().then(function(instance) {
					// saves instance as persistent variable
					phInstance = instance;
					// creates a page in phantom engine
					return instance.createPage();
				}).then(function(page) {
					// saves the page as persistent variable
					sitepage = page;
					// opens url
					return page.open(url);
				}).then(function() {
					// checks to make sure the document is ready before evaluating its html
					return ash.phantom.onReadyState(sitepage);
				}).then(function(){
					// evaluates the site page and returns its html
					return sitepage.evaluate(function() {
						return document.documentElement.outerHTML;
					});
				}).then(function(html){
					// exits phantom instance
					phInstance.exit();
					// resolves with html
					resolve(html);
				}).catch(function(error) {
					console.log(error);
					// exits phantom instance
					phInstance.exit();
					// rejects with error
					reject(error);
				});
			}); // end of Promise
		},
		// helper function that works with phantom to ensure the document is fully loaded before proceeding
		onReadyState: (page) => {
			return new Promise ((resolve, reject) => {
				// checkReady is a function that calls itself recursively while page is loading
				const checkReady = (page) => {
					// setTimeout for allowing slight delay for loading
					setTimeout(function() {
						page.evaluate(function() {
							return document.documentElement.outerHTML;
						}).then(function(html) {
							// loads HTML into cheerio and saves it as a variable
							let $ = cheerio.load(html);
							let stillLoading = $('li.loadingResults').length,
								storyFound = $('li.story').length;
							console.log('Phantom page loading...');
							if (stillLoading) {
								// check again if readyState is complete
								checkReady(page);
							} else if (!storyFound) {
								checkReady(page);
							} else {
								console.log('Loading finished!');
								return resolve();
							}
						// // OLD (doesn't work all the time):
						// // evaluates just the page's readyState property
						// page.evaluate(function() {
						// 	return document.readyState;
						// }).then(function(readyState) {
						// 	console.log('PAGE READY STATUS: ' + readyState);
						// 	if (readyState === 'complete') {
						// 		// resolves when readyState === 'complete'
						// 		return resolve();
						// 	}
						// 	else {
						// 		// check again if readyState is complete
						// 		checkReady(page);
						// 	}
						}).catch(function(err) {
							console.log(err);
							return reject(err);
						});
					}, 4);
				}; // end of checkReady() declaration
				// calls checkReady
				checkReady(page);
			}); // end of Promise
		} // end of ash.phantom.onReadyState()
	}, // end of ash.phantom sub-object
	// nytimes sub-object
	nytimes: {
		// function for searching nytimes
		search: (query) => {
			// returns promise object which resolves with array of results
			return new Promise ( (resolve, reject) => {
				// builds url string
				let nytQueryUrl = 'https://query.nytimes.com/search/sitesearch/'
					+ '?action=click&contentCollection&region=TopBar&WT.nav=searchWidget'
					+ '&module=SearchSubmit&pgtype=Homepage#/' + query
					+ '/30days/document_type%3A%22article%22/';
				// calls helper function to grab html from phantom instance.
				// similar to request but more powerful in that it can wait for dynamic content to load.
				ash.phantom.getHTML(nytQueryUrl).then(function(html){
					// instantiates locally-scoped results array, to be returned in resolve later
					const results = [];
					// loads HTML into cheerio and saves it as a variable
					let $ = cheerio.load(html);
					// loops through each article on the site
					$('li.story').not('.spotlight').not('.noResultsFound').each(function(i, element) {
						// instantiates locally scoped article object
						let article = {
							headline: $(element).find('div.element2').find('h3').text(),
							link: $(element).find('div.element2').find('a').attr('href'),
							summary: $(element).find('div.element2').find('p.summary').text(),
							date: $(element).find('div.element2').find('span.dateline').text(),
							by: $(element).find('div.element2').find('span.byline').text(),
							thumbnail: $(element).find('div.element1').find('img.story_thumb').attr('src')
						};
						// pushes each article object onto results array
						results.push(article);
					});
					// resolves with results array
					resolve(results);
				}).catch(function(error) {
					console.log(error);
					reject(error);
				});
			}); // end of Promise
		} // end of ash.nytimes.search
	}, // end of ash.nytimes
	// sub-object for housing database helper functions
	db: {
		// function for syncing articles with database
		sync: (results) => {
			// declared upsertArticlePromises as temp array
			const upsertArticlePromises = [];
			// loop through results and builds array of promises for saving articles to database
			for (let i = 0; i < results.length; i++) {
				// generate new promise for each article and pushes them onto upsertArticlePromises
				upsertArticlePromises.push( new Promise ( (resolve, reject) => {
					let query = {link: results[i].link};
					let newData = {
						headline: results[i].headline,
						thumbnail: results[i].thumbnail,
						summary: results[i].summary,
						by: results[i].by,
						date: results[i].date
					};
					// ensures that article is upserted, the doc in callback reflects 
					// updated data, and defaults are set upon upsert (usually doesnt happen)
					// https://stackoverflow.com/questions/25755521/mongoose-upsert-does-not-create-default-schema-property
					let options = {upsert: true, new: true, setDefaultsOnInsert: true};
					// upsert document
					Article.findOneAndUpdate(query, newData, options, (err, doc) => {
						if (err) {
							reject(err);
						}
						else {
							resolve(doc);
						}
					});
				})); // end of pushed promise
			} // end of for-loop
			// returns Promise.all of upsertArticlePromises array
			return Promise.all(upsertArticlePromises);
		}, // end of ash.db.sync
		saveArticle: (username, articleId) => {
			return new Promise ( (resolve, reject) => {
				// instantiates temp variables for building update arguments
				const userUpdateConditions = { username: username, saved_articles: { $ne: articleId } };
				const userUpdateData = { $push: { saved_articles: articleId } };
				const articleUpdateConditions = { _id: articleId, savers: { $ne: username } };
				const articleUpdateData = { $push: { savers: username } };		
				// builds update promise chain
				const promise1 = User.update(userUpdateConditions, userUpdateData).exec();
				const promise2 = Article.update(articleUpdateConditions, articleUpdateData).exec();
				// calls promise chain through Promise.all()
				Promise.all([promise1, promise2]).then(data => {
					// early returns & sends message to user if article has already been saved
					if (data[0].nModified == 0 && data[1].nModified == 0) {
						resolve({success: false, message: 'Article already exists among saved articles.'});
					} else {
						resolve({success: true, message: 'Article successfully saved!'});
					}
				}).catch(err => {
					reject(err);
				});
			});
		}, // end of ash.db.saveArticle
		unsaveArticle: (username, articleId) => {
			// builds promise chain
			const promise1 = User.update({username}, { $pull: { saved_articles: articleId }}).exec();
			const promise2 = Article.update({_id: articleId}, { $pull: { savers: username }}).exec();
			// returns promise chain through Promise.all()
			return Promise.all([promise1, promise2]);
		},
		saveComment: (commentContent) => {
			return new Promise ( (resolve, reject) => {
				// creates new Comment instance
				const newComment = new Comment(commentContent);
				// saves findArticle and findUser as promises for first part of promise chain
				const findArticle = Article.findById(newComment.article).exec(),
					findUser = User.findOne({username: newComment.author}).exec();
				// verifies existence of user and article in database
				Promise.all([findArticle, findUser]).then(data => {
					console.log('found article and user');
					// saves article and user database instances as temp constables
					const article = data[0],
						user = data[1];
					// updates comment data for article and user
					article.comments.push(newComment);
					user.posted_comments.push(newComment);
					// returns promise of all updates, including automatically saving article to user
					return Promise.all([
						newComment.save(),
						article.save(),
						user.save(),
						ash.db.saveArticle(newComment.author, newComment.article)
					]);
				}).then(data => {
					console.log("process complete");
					resolve({success: true, message: 'Comment saved!'});
				}).catch((err) => {
					reject(err);
				}); // end of promise chain
			}); // end of returned promise
		},
		// helper function for grabbing article data
		getArticleData: (articleId) => {
			// returns promise
			return Article.findById(articleId).populate('comments').exec();
		},		
		// helper method for getting the all saved articles for a given user
		getAllSaved: (userId) => {
			// returns promise that resolves with populated saved_articles array
			return new Promise ( (resolve, reject) => {
				User.findById(userId)
				.populate('saved_articles')
				.exec()
				.then(thisUser => {
					resolve(thisUser.saved_articles);
				}).catch(err => {
					reject(err);
				});
			});
		},
		// helper method for getting the five most-saved articles, in descending order
		getMostSaved: () => {
			// returns promise. uses aggregate() because find() won't be able to obtain
			// the length of the array "savers". numOfSaves is an alias given to the 
			// projected value of the $size (length) of "savers" array. 1 values
			// tells the query to also return these fields as well.
			return Article.aggregate()
				.project({
					headline: 1, link: 1, by: 1, date: 1, thumbnail: 1, summary: 1,
					numOfSaves: {$size: "$savers"}})
				.sort({numOfSaves: -1})
				.limit(5)
				.exec();
		},
		// helper method for getting the five most-commented articles, in descending order
		getMostCommented: () => {
			// returns promise. uses aggregate() because find() won't be able to obtain
			// the length of the array "comments". numOfSaves is an alias given to the 
			// projected value of the $size (length) of "comments" array. 1 values
			// tells the query to also return these fields as well.
			return Article.aggregate()
				.project({
					headline: 1, link: 1, by: 1, date: 1, thumbnail: 1, summary: 1,
					numOfComments: {$size: "$comments"}})
				.sort({numOfComments: -1})
				.limit(5)
				.exec();
		}
	} // end of ash.db sub-object
}; // end of ash

module.exports = ash;