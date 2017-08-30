// dependencies: cheerio (for scraping)
const cheerio = require('cheerio'),
	request = require('request'),
	phantom = require('phantom');

// declares object to be exported
const articleSaver = {
	// searchNYT function
	searchCNN: query => {
		// returns promise object
		return new Promise ( (resolve, reject) => {
			// builds url string for scraping
			let cnnQueryUrl = 'http://www.cnn.com/search/?q=' + query + 'texas&size=10&type=article';
			// gets html from cnn via request npm
			request(cnnQueryUrl, (error, response, html) => {
				// returns with promise rejection if there's an error in request response 
				if (error) {
					return reject(error);
				}
				const results = [];
				// loads HTML into cheerio and saves it as a variable
				var $ = cheerio.load(html);

				// loops through each article on the site
				$('div.cnn-search__result--article').each(function(i, element) {
					// instantiates locally scoped article object
					let article = {
						headline: $(element).find('h3').text(),
						link: $(element).find('a').attr('href'),
						summary: $(element).find('div.cnn-search__result-body').text(),
						date: $(element).find('div.cnn-search__result-publish-date').text(),
						// by: $(element).find('div.element2').find('span.byline').text(),
						thumbnail: $(element).find('img').attr('src')
					};
					// pushes article object onto results array
					results.push(article);
				});

				console.log('results:');
				console.log(results);
				// resolves with false value if there are no articles matching search query
				return resolve(html);

			}); // end of request
		}); // end of Promise
	}, // end of .searchCNN
	// searchNYT function
	searchNYT: (query) => {
		// returns promise object
		return new Promise ( (resolve, reject) => {
			// uses phantom to open page and grab dynamically generated content
			
			var sitepage = null;
			var phInstance = null;

			phantom.create().then(function(instance) {
				phInstance = instance;
				return instance.createPage();
			}).then(function(page) {
				sitepage = page;
				let nytQueryUrl = 'https://query.nytimes.com/search/sitesearch/'
					+ '?action=click&contentCollection&region=TopBar&WT.nav=searchWidget'
					+ '&module=SearchSubmit&pgtype=Homepage#/' + query;
				return page.open(nytQueryUrl);
			}).then(function() {
				return sitepage.evaluate(function() {
					return document.body.innerHTML;
				});
			}).then(function(html){
				// instantiates locally-scoped results array, to be returned in resolve later
				const results = [];
				// loads HTML into cheerio and saves it as a variable
				var $ = cheerio.load(html);
				// loops through each article on the site
				$('li.story').each(function(i, element) {
					// instantiates locally scoped article object
					let article = {
						headline: $(element).find('div.element2').find('h3').text(),
						link: $(element).find('div.element2').find('a').attr('href'),
						summary: $(element).find('div.element2').find('p.summary').text(),
						date: $(element).find('div.element2').find('span.dateline').text(),
						by: $(element).find('div.element2').find('span.byline').text(),
						thumbnail: $(element).find('div.element1').find('img.story_thumb').attr('src')
					};
					// pushes article object onto results array
					results.push(article);
				});
				console.log(results);
				resolve(results);
				phInstance.exit();
			}).catch(function(error) {
				console.log(error);
				phInstance.exit();
				reject(error);
			});

			// old phantom method
			// phantom.create(function (ph) {
			// 	ph.createPage(function (page) {
			// 		let nytQueryUrl = 'https://query.nytimes.com/search/sitesearch/'
			// 		+ '?action=click&contentCollection&region=TopBar&WT.nav=searchWidget'
			// 		+ '&module=SearchSubmit&pgtype=Homepage#/' + query;
			// 		page.open(nytQueryUrl, function() {
			// 			page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function() {
			// 				page.evaluate(function() {
			// 					// instantiates locally scoped results array
			// 					const results = [];
			// 					// loops through each article on the site
			// 					$('li.story').each(function(i, element) {
			// 						// instantiates locally scoped article object
			// 						let article = {
			// 							headline: $(element).find('div.element2').find('h3').text(),
			// 							link: $(element).find('div.element2').find('a').attr('href'),
			// 							summary: $(element).find('div.element2').find('p.summary').text(),
			// 							date: $(element).find('div.element2').find('span.dateline').text(),
			// 							by: $(element).find('div.element2').find('span.byline').text(),
			// 							thumbnail: $(element).find('div.element1').find('img.story_thumb').attr('src')
			// 						};
			// 						// pushes article object onto results array
			// 						results.push(article);
			// 					});
			// 					console.log(results);
			// 					return resolve(results);
			// 				}, function(){
			// 					ph.exit();
			// 				});
			// 			});
			// 		});
			// 	});
			// });

			// let nytQueryUrl = 'https://query.nytimes.com/search/sitesearch/'
			// 	+ '?action=click&contentCollection&region=TopBar&WT.nav=searchWidget'
			// 	+ '&module=SearchSubmit&pgtype=Homepage#/' + query;
			// request(nytQueryUrl, (error, response, html) => {
			// 	// returns with promise rejection if there's an error in request response 
			// 	if (error) {
			// 		return reject(error);
			// 	}
			// 	const results = [];
			// 	// loads HTML into cheerio and saves it as a variable
			// 	var $ = cheerio.load(html);
			// 	// 

			// 	// loops through each article on the site
			// 	$('li.story').each(function(i, element) {
			// 		// instantiates locally scoped article object
			// 		let article = {
			// 			headline: $(element).find('div.element2').find('h3').text(),
			// 			link: $(element).find('div.element2').find('a').attr('href'),
			// 			summary: $(element).find('div.element2').find('p.summary').text(),
			// 			date: $(element).find('div.element2').find('span.dateline').text(),
			// 			by: $(element).find('div.element2').find('span.byline').text(),
			// 			thumbnail: $(element).find('div.element1').find('img.story_thumb').attr('src')
			// 		};
			// 		// pushes article object onto results array
			// 		results.push(article);
			// 	});

			// 	/* EXAMPLE
			// 	$("div.item").each(function(i, element) {

			// 		// var link = $(element).children().attr("href");
			// 		// var title = $(element).children().text();

			// 		var imgLink = $(element).find("a").find("img").attr("srcset");
			// 		var imgAlt = $(element).find("a").find("img").attr("alt");
			// 		// inserts data into database
			// 		db.scrapedData.insert({
			// 		  title: imgAlt,
			// 		  link: imgLink
			// 		});
			// 	});
			// 	*/
			// 	console.log('results:');
			// 	console.log(results);
			// 	// resolves with false value if there are no articles matching search query
			// 	return resolve(html);

			// }); // end of request
		}); // end of Promise
	} // end of .searchNYT
};

module.exports = articleSaver;