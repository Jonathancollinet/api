var shuffler = require('shuffle-array');

exports.listAll = function(req, res, next) {
	req.app.db.models.Validation.find({ uid: req.user._id }, 'erid').lean().exec(function(err, validated) {
		if (err)
			return next(err);
		var erValidated = [];
		for (var i in validated) {
			erValidated.push(validated[i].erid);
		}
		var select = {
			_id: { $nin: erValidated }
		};
		if (!req.app.Config.showOwnEventValidation)
			select.uid = { $ne: req.user._id };
		req.app.db.models.EventRegister.find(select).populate('uid').populate('eid').lean().exec(function(err, eventRes) {
			if (err)
				return next(err);
			var erToValidate = [];
			for (var i in eventRes) {
				if (eventRes[i].eid)
					erToValidate.push(eventRes[i].eid._id)
			}
			req.app.db.models.Account.populate(eventRes, 'uid.roles.account', function(err, eventRes) {
				if (err)
					return next(err);
				req.app.db.models.User.populate(eventRes, 'eid.acc', function(err, eventRes) {
					if (err)
						return next(err);
					req.app.db.models.Account.populate(eventRes, 'eid.acc.roles.account', function(err, eventRes) {
						if (err)
							return next(err);
						select = {
							'metadata.type': 'event',
							'metadata.event': { $in: erToValidate },
							root: 'events'
						};
						if (!req.app.Config.showOwnEventValidation)
							select['metadata.user'] = { $ne: req.user._id };
						req.app.ms.Grid.find(select, function(err, rows) {
							var toSend = [];
							for (var i in eventRes) {
								if (eventRes[i].eid && eventRes[i].uid) {
									var toPush = {
										id: eventRes[i]._id,
										event: {
											id: eventRes[i].eid._id.toString(),
											title: eventRes[i].eid.title,
											desc: eventRes[i].eid.desc,
											user: {
												id: eventRes[i].eid.acc.roles.account._id,
												name: eventRes[i].eid.acc.roles.account.name.full,
												picture: req.app.Config.mediaserverUrl + eventRes[i].eid.acc.roles.account.picture
											}
										},
										by: {
											id: eventRes[i].uid._id,
											name: eventRes[i].uid.roles.account.name.full,
											picture: req.app.Config.mediaserverUrl + eventRes[i].uid.roles.account.picture
										},
										picture: req.app.Config.mediaserverUrl + 'events/'
									};
									for (var j in rows) {
										if (rows[j].metadata.event.toString() === toPush.event.id) {
											toPush.picture += rows[j].filename;
											break ;
										}
									}
									toSend.push(toPush);
								}
							}
							res.json(shuffler(toSend).slice(0, 10));
						});
					});
				});
			});
		});
	});
}

exports.upVote = function(req, res, next) {
	req.app.db.models.EventRegister.findById(req.params.id).exec(function(err, erRow) {
		if (err)
			return next(err);
		if (!erRow) {
			err = new Error('Impossible de trouver cet élément');
			err.status = 404;
			return next(err);
		}
		req.app.db.models.Validation.findOne({ eid: erRow.eid, uid: req.user._id }).exec(function(err, valRow) {
			if (err)
				return next(err);
			if (valRow)
				return res.json({ err: 'Vous avez déjà effectué la validation de cet élément.' });
			var fields = {
				eid: erRow.eid,
				uid: req.user._id,
				erid: req.params.id,
				isValidate: true
			};
			req.app.db.models.Validation.create(fields, function(err, row) {
				row.__v = undefined;
				res.json(row);
			});
		});
	});
}

exports.downVote = function(req, res, next) {
	req.app.db.models.EventRegister.findById(req.params.id).exec(function(err, erRow) {
		if (err)
			return next(err);
		if (!erRow) {
			err = new Error('Impossible de trouver cet élément');
			err.status = 404;
			return next(err);
		}
		req.app.db.models.Validation.findOne({ eid: erRow.eid, uid: req.user._id }).exec(function(err, valRow) {
			if (err)
				return next(err);
			if (valRow)
				return res.json({ err: 'Vous avez déjà effectué la validation de cet élément.' });
			var fields = {
				eid: erRow.eid,
				uid: req.user._id,
				erid: req.params.id,
				isValidate: false
			};
			req.app.db.models.Validation.create(fields, function(err, row) {
				row.__v = undefined;
				res.json(row);
			});
		});
	});
}

exports.findOne = function(req, res, next) {
	req.app.db.models.Validation.findOne().exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.count = function(req, res, next) {
	req.app.db.models.Validation.find().count().exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.findId = function(req, res, next) {
	req.app.db.models.Validation.findById(req.params.id).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.exists = function(req, res, next) {
	req.app.db.models.Validation.findById(req.params.id).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.create = function(req, res, next) {
	req.app.db.models.Validation.create(req.body, function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.updateId = function(req, res, next) {
	req.app.db.models.Validation.update({_id: req.params.id}).exec(function(err, row) {
		if (!err)
			res.json({data: row});
		else
			res.json({data: err});
	});
}

exports.delete = function(req, res, next) {
	req.app.db.models.Validation.findById(req.params.id).exec(function(err, row) {
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
