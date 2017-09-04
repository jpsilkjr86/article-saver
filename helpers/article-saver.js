// dependencies: cheerio (for scraping)
const cheerio = require('cheerio'),
	request = require('request'),
	phantom = require('phantom');

// importing database models (mongoose)
const Article = require('../models/Article.js'),
	Comment = require('../models/Comment.js'),
	User = require('../models/User.js');

// declares object to be exported
const articleSaver = {
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
					return articleSaver.phantom.onReadyState(sitepage);
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
				// checkReady is a function that calls itself recursively to make sure the document is ready
				const checkReady = (page) => {
					// setTimeout for allowing slight delay
					setTimeout(function() {
						// evaluates just the page's readyState property
						page.evaluate(function() {
							return document.readyState;
						}).then(function(readyState) {
							console.log('PAGE READY STATUS: ' + readyState);
							if (readyState === 'complete') {
								// resolves when readyState === 'complete'
								return resolve();
							}
							else {
								// check again if readyState is complete
								checkReady(page);
							}
						}).catch(function(err) {
							console.log(err);
							return reject(err);
						});
					}, 4);
				}; // end of checkReady() declaration
				// calls checkReady
				checkReady(page);
			}); // end of Promise
		} // end of articleSaver.phantom.onReadyState()
	}, // end of articleSaver.phantom sub-object
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
				articleSaver.phantom.getHTML(nytQueryUrl).then(function(html){
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
		} // end of articleSaver.nytimes.search
	}, // end of articleSaver.nytimes
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

			/*
			// returns promise that resolves with articles synced with database
			return new Promise ( (resolve, reject) => {
				const syncedArticles = [];
				const articlePromises = [];
				// loop through results and builds promise chain for saving articles to database
				for (let i = 0; i < results.length; i++) {
					// generate new promise for each areticle and pushes them onto articlePromises
					articlePromises.push( new Promise ( (resolveArticle, rejectArticle) => {
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
								console.log(err);
								rejectArticle(err);
							}
							else {
								// pushes successfully saved doc onto syncedArticles and resolves
								syncedArticles.push(doc);
								resolveArticle();
							}
						});
					}));
				}
				// Promise.all for all articlePromises
				Promise.all(articlePromises).then(() => {
					// resolves with synced articles array
					resolve(syncedArticles);
				}).catch((err) => {
					reject(err);
				});
			}); // end of returned promise
			*/
		} // end of articleSaver.db.sync
	} // end of articleSaver.db sub-object
}; // end of articleSaver

module.exports = articleSaver;