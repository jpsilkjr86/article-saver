// dependencies: cheerio (for scraping)
const cheerio = require('cheerio'),
	request = require('request');

// declares object to be exported
const articleSaver = {
	// search function
	searchNYT: (query) => {
		// returns promise object
		return new Promise ( (resolve, reject) => {
			let nytQueryStr = 'https://query.nytimes.com/search/sitesearch/'
				+ '?action=click&contentCollection&region=TopBar&WT.nav=searchWidget'
				+ '&module=SearchSubmit&pgtype=Homepage#/' + query;
			request(nytQueryStr, (error, response, html) => {
				// returns with promise rejection if there's an error in request response 
				if (error) {
					return reject(error);
				}
				// loads HTML into cheerio and saves it as a variable
				var $ = cheerio.load(html);

				// loops through each article on the site

				/* EXAMPLE
				$("div.item").each(function(i, element) {

					// var link = $(element).children().attr("href");
					// var title = $(element).children().text();

					var imgLink = $(element).find("a").find("img").attr("srcset");
					var imgAlt = $(element).find("a").find("img").attr("alt");
					// inserts data into database
					db.scrapedData.insert({
					  title: imgAlt,
					  link: imgLink
					});
				});
				*/
				// resolves with false value if there are no articles matching search query
				resolve(html);
			}); // end of request
		}); // end of Promise
	} // end of .searchNYT
};

module.exports = articleSaver;