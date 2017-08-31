$(document).ready(function(){
	// function for ajax get request for searching articles
	function search (query) {
		// get request for searching article saver
		$.get('/search?q=' + query).done(function(data){
			console.log(data);
			displayArticles(data.results);
		});
	}
	// function for displaying articles on the DOM
	function displayArticles (articles) {
		for (let i = 0; i < articles.length; i++) {
			// declare parent article element
			let articleDiv = $('<a>').addClass('list-group-item')
								.attr('href', articles[i].link);
			// divide parent article element into three columns
			let row = $('<div>').addClass('row').appendTo(articleDiv),
				colLeft = $('<div>').addClass('col-xs-2').appendTo(row),
				colMain = $('<div>').addClass('col-xs-8').appendTo(row),
				colRight = $('<div>').addClass('col-xs-2').appendTo(row);
			// put thumb in left column
			let thumb = $('<img>').attr('src', articles[i].thumbnail)
							.addClass('img-responsive')
							.appendTo(colLeft);
			// put headline at top of right column, bolded
			let headline = $('<h4>').text(articles[i].headline)
								.css('font-weight', 'bold')
								.appendTo(colMain);
			// declare summary, append under headline
			let summary = $('<p>').text(articles[i].summary).appendTo(colMain);
			// declare byline and date next to each other
			// let additionalInfo = $('<i>').text(articles[i].by + '|' + articles[i].date)
			// 						.appendTo(colMain);
			let byline = $('<div>').addClass('pull-left')
							.text(articles[i].by)
							.appendTo(colMain);
			let date = $('<div>').addClass('pull-right')
							.text(articles[i].date)
							.appendTo(colMain);
			// add star button to the right
			$('<span>').addClass('glyphicon glyphicon-star')
					.attr('aria-hidden', 'true')
					.appendTo(colRight);
			// finally, append articleDiv to the DOM
			$('#test').prepend(articleDiv);
		}
	}
	// listener for submitting forms
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
		// calls search function
		search(query);
	});
	// listener for entering return, triggering search-btn click
});