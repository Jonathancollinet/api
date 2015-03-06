var fs = require('fs');

exports.listAll = function(req, res, next) {
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
	if (req.app.Config.filterFlux)
		options.filters.end = { $gt: Date.now() };
	if (req.query.sort_by) {
		options.sort[req.query.sort_by] = req.query.sort_order ? parseInt(req.query.sort_order) : -1;
	} else {
		options.sort = { _id: req.query.sort_order ? parseInt(req.query.sort_order) : -1 };
	}
	if (req.query.last_item) {
		if (options.sort._id == -1) {
			options.filters._id = { $lt: req.query.last_item };
		} else {
			options.filters._id = { $gt: req.query.last_item };
		}
	}
	req.app.db.models.Event.paginate(options, function(err, rows) {
		if (err)
			return next(err);

		if (req.query.sort_order && parseInt(req.query.sort_order) === 1)
			rows.items.reverse();

		req.app.db.models.EventRegister.find({ uid: req.user._id }).lean().exec(function(err, reg) {
			if (err)
				return next(err);

			for (var i in rows.items) {
				for (var j in reg) {
					if (reg[j].eid.toString() === rows.items[i]._id.toString())
						rows.items[i].completed = true;
				}
				if (rows.items[i].completed === undefined)
					rows.items[i].completed = false;
			}
			return res.json(rows);
		});
		// function done(datas) {
		// 	return res.json(datas);
		// }
		//
		// function execQuery(eid, uid, cb) {
		// 	req.app.db.models.EventRegister
		// 	cb(true);
		// }
		//
		// function prepareQuery(_rows, i, cb) {
		// 	if (!_rows[i])
		// 		return cb(_rows);
		// 	execQuery(_rows[i]._id, req.user._id, function(status) {
		// 		_rows[i].completed = status;
		// 		prepareQuery(_rows, ++i);
		// 	});
		// }
		//
		// if (rows[0])
		// 	return prepareQuery(rows, 0, send);
		// done(rows);
	});
}

exports.findOne = function(req, res, next) {
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
							, picture: (/^https?/.test(user.roles.account.picture) ? '' : req.app.Config.mediaserverUrl) + user.roles.account.picture
						}
					, original: req.app.Config.mediaserverUrl + 'events/' + explod[0]
					, minified: req.app.Config.mediaserverUrl + 'events/' + explod[1] + '.min.' + explod[2]
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

exports.count = function(req, res, next) {
	req.app.db.models.Event.find().count().exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			return next(err);
	});
}

exports.findId = function(req, res, next) {
	req.app.db.models.Event.findById(req.params.id).select('-__v -accType -toNotif').populate({ path: 'acc', select: '_id roles' }).lean().exec(function(err, row) {
		if (err)
			return next(err);
		req.app.db.models.Account.populate(row, { path: 'acc.roles.account', select: 'picture name.full' }, function(err, row) {
			row.picture = (/^(https?)/.test(row.picture) || !row.picture ? '' : req.app.Config.mediaserverUrl) + row.picture;
			row.acc.name = row.acc.roles.account.name.full;
			row.acc.picture = (/^(https?)/.test(row.acc.roles.account.picture) ? '' : req.app.Config.mediaserverUrl) + row.acc.roles.account.picture;
			row.acc.roles = undefined;
			res.json(row);
		});
	});
}

exports.exists = function(req, res, next) {
	req.app.db.models.Event.findById(req.params.id).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			return next(err);
	});
}

exports.create = function(req, res, next) {
	var object = req.body;
	object.acc = req.user._id;
	object.accType = "account";

	req.app.db.models.Event.create(req.body, function(err, row) {
		if (err) {
			return next(err);
		}
		req.params.id = row._id;
		exports.findId(req, res, next);
	});
}

exports.updateId = function(req, res, next) {
	var options = req.body;
	req.app.db.models.Event.findById(req.params.id).lean().exec(function(err, event) {
		if (err || !event)
			return next(err || (new Error('Ce challenge n\'existe pas')));
		processUpdate(event);
	});

	var processUpdate = function(event) {
		if (req.files.file) {
			req.body.root = "events";
			req.body.event = req.params.id;
			req.body.metaType = "event_background";

			var done = function() {
				req.app.utils.Upload.OriginalAndMinified(req, res, next, { root: 'events', filepath: './'+req.files.file.path.replace('\\', '/') }, function(event_image) {
					options.picture = event_image.minified;
					req.app.db.models.Event.findByIdAndUpdate(req.params.id, { $set: options }).exec(function(err, the_event) {
						if (err)
							return next(err);
						the_event.picture = req.app.Config.mediaserverUrl + the_event.picture;
						return res.json(the_event);
					});
				});
			};
			if (event.picture) {
				req.app.ms.events.remove({ 'metadata.type': "event_background", 'metadata.event': req.app.ms.Grid.tryParseObjectId(req.params.id) }, function(e, r) {
					if (e)
						return next(e);
					req.app.ms.events_min.remove({ 'metadata.type': "event_background", 'metadata.event': req.app.ms.Grid.tryParseObjectId(req.params.id) }, function(e, r) {
						if (e)
							return next(e);
						done();
					});
				});
			} else {
				done();
			}
		} else {
			req.app.db.models.Event.update({ _id: req.params.id }, { $set: options }).exec(function(err, the_event) {
				if (err)
					return next(err);
				return res.json(the_event);
			});
		}
	};
}

exports.join = function(req, res, next) {
	var eid = req.params.id,
			uid = req.user._id;
	var fields = {
		eid: eid,
		uid: uid
	};

	if (!req.files.file) {
		return next("Fichier non renseigné");
	}

	req.app.db.models.Event.findById(eid, function(err, row) {
		if (err || !row) {
			return done(err || "Evènement introuvable");
		}
		register();
	});

	function register() {
		req.app.db.models.EventRegister.findOne(fields, function(err, row) {
			if (err) {
				return done(err);
			}
			if (row) {
				return done("Vous avez déjà participé à cet évènement");
			} else {
				req.app.db.models.EventRegister.create(fields, function(err, row) {
					if (err) {
						return done(err);
					}
					done();
				});
			}
		});
	}

	function done(err) {
		if (err) {
			fs.unlink(req.files.file.path);
			return next(typeof err === "string" ? new Error(err) : err);
		}
		req.body.root = "events";
		req.body.event = req.params.id;
		req.body.metaType = "event";

		req.app.utils.Upload.OriginalAndMinified(req, res, next, { root: 'events', filepath: './'+req.files.file.path.replace('\\', '/') }, function(event_image) {

			return res.json();
		});
	}
}

exports.delete = function(req, res, next) {
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
