exports.listAll = function(req, res) {
	var options = {
			limit: req.query.limit || 20
		, sort: {}
		, filters: {}
		, keys: '_id acc start end numOfPtc desc title picture hashtag latLng'
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

exports.gallery = function(req, res, next) {
	var workflow = new (require('events').EventEmitter)();

	req.app.ms.Grid.find({ 'metadata.event': req.app.ms.Grid.tryParseObjectId(req.params.id), root: "events" }, function(err, found) {
		if (err) { return next(err); }
		var filesArray = [];
		workflow.on('end', function() {
			return res.json(filesArray);
		});
		workflow.on('parse object',function(files, i) {
			req.app.db.models.User.findOne({ _id: files[i].metadata.user.toString() }).populate('roles.account').exec(function(err, user) {
				if (err) { return next(err); }
				var explod = files[i].filename.match(/^([^.]*)\.(.*)/);
				var toPush = {
						acc: {
								id: user._id
							, name: user.roles.account.name.full
							, picture: user.roles.account.picture
						}
					, original: req.app.Config.mediaserverUrl + 'avatars/' + explod[0]
					, minified: req.app.Config.mediaserverUrl + 'avatars/' + explod[1] + '.min.' + explod[2]
				};
				filesArray.push(toPush);
				if (i === (files.length - 1))
					return workflow.emit('end');
				workflow.emit('parse object', files, ++i);
			});
		});
		if (found && found.length)
			workflow.emit('parse object', found, 0);
		else
			workflow.emit('end');
	});
}

exports.count = function(req, res) {
	req.app.db.models.Event.find().count().exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			return next(err);
	});
}

exports.findId = function(req, res) {
	req.app.db.models.Event.findById(req.params.id).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			return next(err);
	});
}

exports.exists = function(req, res) {
	req.app.db.models.Event.findById(req.params.id).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			return next(err);
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
			return next(err);
	});
}

exports.delete = function(req, res) {
	req.app.db.models.Event.findById(req.params.id).exec(function(err, row) {
		if (!err && row) {
			row.remove(function(err){
				if (err)
					return next(err);
				res.json({data: "Deleted"});
			});
		}
		else
			res.json({data: err || "Cannot find id : " + req.params.id});
	});
}
