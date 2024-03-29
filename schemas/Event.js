'use strict';
var moment = require('moment');

exports = module.exports = function(app, mongoose) {
  var EventSchema = new mongoose.Schema({
    title: { type: String, trim: true, required: true },
    desc: { type: String, default: '' },
    picture: { type: String, default: '' },
    hashtag: { type: Array, required: true },
    place: { type: String },
    latLng: [ Number ],
    start: { type: Date, default: moment().toDate() },
    end: { type: Date, default: moment().add(moment.duration(3, 'days')).toDate() },
    acc: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accType: { type: String, required: true },
    toNotif: { type: Array },
    datas: { type: Object }
  }, {safe: true});
  EventSchema.plugin(require('./plugins/paginate'));
  EventSchema.set('autoIndex', (app.get('env') === 'development'));
  EventSchema.index({ _id: 1 });
  app.db.model('Event', EventSchema);
};
