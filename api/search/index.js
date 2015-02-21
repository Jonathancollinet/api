exports.users = function(req, res, next) {
	req.app.db.models.User.findOne({username: new RegExp(req.body.query+'*', "i")}).exec(function(err, row) {
		if (err)
			return next(err);
		res.json({data: row});
	});
}