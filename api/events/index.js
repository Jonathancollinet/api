exports.listAll = function(req, res) {
	var options = {
			limit: req.query.limit || 20
		, sort: {}
		, filters: {}
		, keys: '_id acc start end numOfPtc desc title'
		, populate: [{
				path: 'acc',
				keys: 'roles.account',
			}]
		, subPopulate: {
				path: 'acc.roles.account',
				keys: 'picture getname',
				model: req.app.db.models.Account
			}
	};
	if (req.query.sort_by) {
		options.sort[req.query.sort_by] = req.query.sort_order ? parseInt(req.query.sort_order) : -1;
	} else {
		options.sort = { _id: -1 };
	}
	if (req.query.last_item) {
		if (options.sort._id == -1) {
			options.filters = { _id: { $lt: req.query.last_item } };
		} else {
			options.filters = { _id: { $gt: req.query.last_item } };
		}
	}
	req.app.db.models.Event.paginate(options, function(err, rows) {
		if (err)
			return next(err);
		res.json(rows);
	});
}

exports.findOne = function(req, res) {
	req.app.db.models.Event.findOne().exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.count = function(req, res) {
	req.app.db.models.Event.find().count().exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.findId = function(req, res) {
	req.app.db.models.Event.findById(req.params.id).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.exists = function(req, res) {
	req.app.db.models.Event.findById(req.params.id).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.create = function(req, res) {
	var object = req.body;
	object.acc = req.user._id;
	object.accType = "account";

	req.app.db.models.Event.create(req.body, function(err, row) {
		if (err) {
			return next(err);
		}
		row.__v = undefined;
		res.json(row);
	});
}

exports.updateId = function(req, res) {
	req.app.db.models.Event.update({_id: req.params.id}).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.delete = function(req, res) {
	req.app.db.models.Event.findById(req.params.id).exec(function(err, row) {
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
