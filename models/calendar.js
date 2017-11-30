(function() {
    'use strict';

    const mongoose = require('mongoose');
    mongoose.Promise = require('bluebird');
    const Schema = mongoose.Schema;

    const calendarSchema = new Schema({
        'UUID': {'type': String, 'required': [true, 'can\'t be blank']},
        'event': {'type': String, 'required': [true, 'can\'t be blank']}
    }, {
        versionKey: false,
        timestamps: true,
        collection: 'calendar',
    });

    const CalendarModel = mongoose.model('calendar', calendarSchema);

    module.exports = CalendarModel;
})();

