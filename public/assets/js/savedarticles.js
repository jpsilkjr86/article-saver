$(document).ready(function(){
	// function that performs ajax request to get saved articles from server
	function getSavedArticles () {
		$.get('/articles/saved/all').done(function(data) {
			console.log(data);
			displayArticles(data.results);
		});
	}
	// function for displaying articles on the DOM.
	// this function must be done with jquery. seems there's an error with
	// rendering list-group-item's with handlebars.
	function displayArticles (articles) {
		for (let i = 0; i < articles.length; i++) {
			// declare parent article element
			let articleDiv = $('<a>').addClass('list-group-item');
			// divide parent article element into three columns
			let row = $('<div>').addClass('row').appendTo(articleDiv),
				colLeft = $('<div>').addClass('col-xs-3 col-md-2').appendTo(row),
				colMain = $('<div>').addClass('col-xs-7 col-md-9').appendTo(row),
				colRight = $('<div>').addClass('col-xs-2 col-sm-1').appendTo(row);
			// put thumb in left column, wrapped in <a> tag
			let thumb = $('<img>').attr('src', articles[i].thumbnail)
							.addClass('img-responsive article-thumb');
			$('<a>').attr('href', articles[i].link)
					.append(thumb)
					.appendTo(colLeft);
			// put headline at top of right column, bolded, wrapped in <a> tag
			let headline = $('<h4>').text(articles[i].headline)
								.css('font-weight', 'bold');
			$('<a>').attr('href', articles[i].link)
					.append(headline)
					.appendTo(colMain);
			// declare summary, append under headline
			let summary = $('<p>').text(articles[i].summary).appendTo(colMain);
			// declare byline and date next to each other
			// let additionalInfo = $('<i>').text(articles[i].by + '|' + articles[i].date)
			// 						.appendTo(colMain);
			let byline = $('<p>').addClass('pull-left')
							.text(articles[i].by)
							.appendTo(colMain);
			let date = $('<p>').addClass('pull-right')
							.text(articles[i].date)
							.appendTo(colMain);
			// add clearfix to clear floats
			$('<div>').addClass('clearfix').appendTo(colMain);
			// add unsave button to the right-hand column. wrap i
			let unsaveBtn = $('<button>')
							.addClass('btn btn-default btn-sm article-btn unsave-btn')
							.attr('data-id', articles[i]._id);
			$('<span>').addClass('glyphicon glyphicon-remove')
					.attr('aria-hidden', 'true')
					.appendTo(unsaveBtn);
			unsaveBtn.appendTo(colRight);
			// add comment button to the right-hand column
			let commentBtn = $('<a>')
							.addClass('btn btn-default btn-sm article-btn comment-btn')
							.attr('href', '/articles/' + articles[i]._id + '/comment')
							.attr('data-id', articles[i]._id);
			$('<span>').addClass('glyphicon glyphicon-comment')
					.attr('aria-hidden', 'true')
					.appendTo(commentBtn);
			commentBtn.appendTo(colRight);
			// finally, append articleDiv to the DOM
			$('#articles-div').prepend(articleDiv);
		}
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
			window.location.replace('/search/?q=' + query);
		}
	});
	// listener for clicking on save-btn, posting ajax request to article by id
	$(document).on('click', '.unsave-btn', function() {
		let _id = $(this).attr('data-id');
		$.post('/unsave/', {_id}).done(function(data){
			console.log(data);
			$('#unsave-modal').modal('show');
		}).fail(function(err){
			console.log(err);
		});
	});
	getSavedArticles();
});