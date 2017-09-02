$(document).ready(function(){
	// handler for guest btn
	$('#guest-btn').on('click', function() {
		// posts guest data to log in as guest. redirects to index
		$.post('/user/guest', {username:'guest', password:'guest'}).done(function(data){
			window.location.replace('/');
		});
	});
});