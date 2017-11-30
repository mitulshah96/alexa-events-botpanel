(function() {
    'use strict';

    const mongoose = require('mongoose');
    mongoose.Promise = require('bluebird');
    const Schema = mongoose.Schema;

    const emailSchema = new Schema({
        'UUID': {'type': String, 'required': [ true, 'can\'t be blank' ]},
        'count': {'type': Number, 'required': [ true, 'can\'t be blank' ]},
        'source': {'type': String, 'required': [ true, 'can\'t be blank' ]},
        'category': {'type': String, 'required': [ true, 'can\'t be blank' ]},
    }, {
        versionKey: false,
        timestamps: true,
        collection: 'email',
    });

    const EmailModel = mongoose.model('email', emailSchema);

    module.exports = EmailModel;
})();

