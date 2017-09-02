// exports html-routes as function which takes in app paramater
module.exports = (app) => {
	// route for index. if not signed in, redirect to signin page
	app.get('/', (req, res) => {
		if (req.user) {
			console.log('Logged in as user ' + req.user.username + '');
			res.render('index', {script: 'index.js', user: req.user});
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
			res.render('signin', {script: 'signin.js'});
		}
	});
	// route for savedarticles page. if not signed in, redirect to signin page
	app.get('/articles/saved', (req, res) => {
		if (req.user) {
			res.render('savedarticles', {script: 'savedarticles.js', user: req.user});
		} else {
			console.log('No logged-in user found. Redirecting to signin page...');
			res.redirect('/signin');
		}
	});
	// route for savedarticles page. if not signed in, redirect to signin page
	app.get('/articles/:id/comment', (req, res) => {
		if (req.user) {
			res.send(req.params.id);
		} else {
			console.log('No logged-in user found. Redirecting to signin page...');
			res.redirect('/signin');
		}
	});
	// logs user out of site, deleting them from the session, and returns to signin page
	app.get('/logout', (req, res) => {
		if (req.user) {
			let name = req.user.first_name;
			console.log("LOGGING OUT " + name);
			req.session.success = "Log out successful! Please visit us again, " + name + "!";
			req.logout();
		}
		res.redirect('/signin');
	});
};