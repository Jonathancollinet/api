exports.listAll = function(req, res) {
	req.app.db.models.Notification.find().exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.findOne = function(req, res) {
	req.app.db.models.Notification.findOne().exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.count = function(req, res) {
	req.app.db.models.Notification.find().count().exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.findId = function(req, res) {
	req.app.db.models.Notification.findById(req.params.id).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.exists = function(req, res) {
	req.app.db.models.Notification.findById(req.params.id).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.create = function(req, res) {
	req.app.db.models.Notification.create(req.body, function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.updateId = function(req, res) {
	req.app.db.models.Notification.update({_id: req.params.id}).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.delete = function(req, res) {
	req.app.db.models.Notification.findById(req.params.id).exec(function(err, row) {
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
