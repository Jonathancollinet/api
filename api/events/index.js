exports.listAll = function(req, res) {
	req.app.db.models.Event.find().sort('-date').skip(req.params.from).limit(req.params.to).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
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
	req.app.db.models.Event.create(req.body, function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
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
