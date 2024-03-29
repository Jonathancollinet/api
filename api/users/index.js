exports.me = function(req, res, next) {
	function sendRes(validations) {
		req.app.ms.Grid.find({ 'metadata.user': req.user._id, 'metadata.type': 'event', root: 'events'}, function(err, files) {
			if (err)
				return next(err);
	    res.json({
				id: req.user._id,
				provider: req.facebook ? 'facebook' : 'google',
				email: req.user.email,
				picture: (/^(http).*$/.test(req.user.roles.account.picture) ? '' : req.app.Config.mediaserverUrl) + req.user.roles.account.picture,
				name: req.user.roles.account.name.full,
				first_name: req.user.roles.account.name.first,
				last_name: req.user.roles.account.name.last,
				verified: req.user.roles.account.isVerified == 'yes' ? true : false,
				images: files.length,
				friends: 0,
				badges: req.user.roles.account.badges, //req.user.roles.account.badges ? req.user.roles.account.badges.length : 0
				validations: validations
			});
		});
	}
	req.app.db.models.Validation.find({ uid: req.user._id }).exec(function(err, validations) {
		if (err)
			return next(err);
		sendRes(validations.length);
	});
}

exports.history = function(req, res, next) {
	req.app.db.models.Event.find({ acc: req.user._id }).exec(function(err, row) {
		if (err)
			return next(err);
		res.json({data: row});
	});
}

exports.gallery = function(req, res, next) {
	var workflow = new (require('events').EventEmitter)();

	req.app.ms.Grid.find({ 'metadata.user': req.app.ms.Grid.tryParseObjectId(req.params.id || req.user._id.toString()), 'metadata.type': 'event', root: 'events' }, function(err, found) {
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
							, picture: req.app.Config.mediaserverUrl + user.roles.account.picture
						}
					,
					original: req.app.Config.mediaserverUrl + 'events/' + explod[0]
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

exports.listAll = function(req, res, next) {
	req.app.db.models.User.find().populate("roles.account").exec(function(err, row) {
		if (err)
			return next(err);
		res.json({data: row});
	});
}

exports.findOne = function(req, res, next) {
	req.app.db.models.User.findById(req.params.id).populate("roles.account").exec(function(err, row) {
		if (err)
			return next(err);
		req.app.db.models.Badge.populate(row, 'roles.account.badges', function(err, row) {
			if (err)
				return next(err);
			for (var i in row.roles.account.badges) {
				row.roles.account.badges[i].__v = undefined;
				row.roles.account.badges[i]._id = undefined;
				row.roles.account.badges[i].picture = req.app.Config.mediaserverUrl + row.roles.account.badges[i].picture;
			}
			var ret = {
					id: row._id
				, name: row.roles.account.name.full
				, picture: req.app.Config.mediaserverUrl + row.roles.account.picture
				, badges: row.roles.account.badges
			};
			res.json(ret);
		});
	});
}

exports.count = function(req, res, next) {
	req.app.db.models.User.find().count().exec(function(err, row) {
		if (err)
			return next(err);
		res.json({data: row});
	});
}


exports.exists = function(req, res, next) {
	req.app.db.models.User.findById(req.params.id).exec(function(err, row) {
		if (err)
			return next(err);
		res.json({data: row});
	});
}

exports.create = function(req, res, next) {
	req.app.db.models.User.create(req.body, function(err, row) {
		if (err)
			return next(err);
		res.json({data: row});
	});
}

exports.updateId = function(req, res, next) {
	req.app.db.models.User.update({_id: req.params.id}).exec(function(err, row) {
		if (err)
			return next(err);
		res.json({data: row});
	});
}

exports.delete = function(req, res, next) {
	if (!req.user) {
		return next(new Error("User undefined"));
	}
	req.app.db.models.User.findOne({ _id: req.user._id }).exec(function(err, row) {
		if (err || !row) {
			return next( err || (new Error("Utilisateur inconnu")) );
		}
		row.remove(function(err) {
			if (err) {
				return next(err);
			}
			return res.json({message: "Votre compte et les données liées à celui-ci ont été supprimées."});
		})
	});
}
