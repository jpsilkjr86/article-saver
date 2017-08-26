// exports html-routes as function which takes in app paramater
module.exports = (app) => {

	app.get('/', (req, res) => {
		res.render('index');
	});
};