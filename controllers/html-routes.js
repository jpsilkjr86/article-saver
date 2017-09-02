// exports html-routes as function which takes in app paramater
module.exports = (app) => {
	// route for index. if not signed in, redirect to signin page
	app.get('/', (req, res) => {
		if (req.user) {
			console.log('Logged in as user ' + req.user.username + '');
			res.render('index');
		} else {
			console.log('No logged-in user found. Redirecting to signin page...');
			res.redirect('/signin');
		}
	});
	// route for signin page. if signed in, redirect to index
	app.get('/signin', (req, res) => {
		if (req.user) {
			console.log('Logged in as user ' + req.user.username + '');
			res.redirect('/');
		} else {
			res.render('signin');
		}
	});
};