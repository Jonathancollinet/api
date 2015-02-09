exports.me = function(req, res, next) {
	if (!req.user)
		return next({ error: 'Missing', message: 'User undefined' });
	res.json({
		provider: req.facebook ? 'facebook' : 'google',
		email: req.user.email,
		picture: '',
		name: req.user.roles.account.name.full,
		first_name: req.user.roles.account.name.first,
		last_name: req.user.roles.account.name.last,
		verified: req.user.roles.account.isVerified == 'yes' ? true : false
	});
}

exports.listAll = function(req, res) {
	req.app.db.models.User.find().populate("roles.account").exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.findOne = function(req, res) {
	req.app.db.models.User.findOne().populate("roles.account").exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.count = function(req, res) {
	req.app.db.models.User.find().count().exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.findId = function(req, res) {
	req.app.db.models.User.findById(req.params.id).populate("roles.account").exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.exists = function(req, res) {
	req.app.db.models.User.findById(req.params.id).exec(function(err, row) {
		if (!err)
			res.json({data: true});
		else
			res.json({data: err});
	});
}

exports.create = function(req, res) {
	req.app.db.models.User.create(req.body, function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.updateId = function(req, res) {
	req.app.db.models.User.update({_id: req.params.id}).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.delete = function(req, res) {
	req.app.db.models.User.findById(req.params.id).exec(function(err, row) {
		if (!err && row) {
			row.remove(function(err){
				if (err)
					res.json({data: err});
				else
					res.json({data: "Deleted"});
			});
		}
		else
			res.json({data: err || "Cannot find id : " + req.params.id});
	});
}
