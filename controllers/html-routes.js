// exports html-routes as function which takes in app paramater
module.exports = (app) => {

	app.get('/', (req, res) => {
		if (req.user) {
			console.log('Logged in as user ' + req.user.username + '');
			res.render('index');
		} else {
			console.log('No logged-in user found. Redirecting to signin page...');
			res.redirect('/signin');
		}
	});
};