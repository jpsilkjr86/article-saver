$(document).ready(function(){
	// function that performs ajax request to get article from server
	function getArticleData () {
		let id = $('#articles-div').attr('data-id');
		$.get('/articles/' + id).done(function(data) {
			console.log(data);
			displayArticle(data);
		});
	}
	// function for displaying article on the DOM.
	// this function must be done with jquery. seems there's an error with
	// rendering list-group-item's with handlebars.
	function displayArticle (article) {
		// declare parent article element
		let articleDiv = $('<a>').addClass('list-group-item');
		// divide parent article element into three columns
		let row = $('<div>').addClass('row').appendTo(articleDiv),
			colLeft = $('<div>').addClass('col-xs-3 col-md-2').appendTo(row),
			colMain = $('<div>').addClass('col-xs-9 col-md-10').appendTo(row);
		// put thumb in left column, wrapped in <a> tag
		let thumb = $('<img>').attr('src', article.thumbnail)
						.addClass('img-responsive article-thumb');
		$('<a>').attr('href', article.link)
				.append(thumb)
				.appendTo(colLeft);
		// put headline at top of right column, bolded, wrapped in <a> tag
		let headline = $('<h4>').text(article.headline)
							.css('font-weight', 'bold');
		$('<a>').attr('href', article.link)
				.append(headline)
				.appendTo(colMain);
		// declare summary, append under headline
		let summary = $('<p>').text(article.summary).appendTo(colMain);
		// declare byline and date next to each other
		let byline = $('<p>').text(article.by)
						.appendTo(colMain);
		let date = $('<p>').text(article.date)
						.appendTo(colMain);
		// add clearfix to clear floats
		$('<div>').addClass('clearfix').appendTo(colMain);
		// finally, append articleDiv to the DOM
		$('#articles-div').prepend(articleDiv);
	}
	// listener for submitting search
	$('.search-btn').on('click', function(e) {
		// prevents page from reloading
		e.preventDefault();
		// find the <input> element of the closest form parent of the butten and grabs its value
		let query = $(this).closest('form').find('input').val().trim();
		// replaces multiple spaces with just one space
		query = query.replace(/\s\s+/g, ' ');
		// replaces single spaces with plus sign
		query = query.replace(/\s/g, '+');
		// empties input field
		$(this).closest('form').find('input').val('');
		console.log(query);
		if (query != '') {
			// redirects to search page with query string in uri
			window.location.replace('/?q=' + query);
		}
	});

	getArticleData();
});