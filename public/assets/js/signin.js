$(document).ready(function(){
	// checks to see if there's an alert before showing start-modal
	if (!$('.alert').length) {
		// shows start-modal upon loading of document
		$('#start-modal').modal('show');
	}
});