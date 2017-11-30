(function() {
    'use strict';

    const mongoose = require('mongoose');
    mongoose.Promise = require('bluebird');
    const Schema = mongoose.Schema;

    const tokenSchema = new Schema({
        'UUID': {'type': String, 'required': [true, 'can\'t be blank']},
        'username': { 'type': String, 'required': [true, 'Can\'t be blank']},
        'password': { 'type': String, 'required': [true, 'Can\'t be blank']},
        'access': {'type': Array, 'default': []},
    }, {
        versionKey: false,
        timestamps: true,
        collection: 'token',
    });

    const TokenModel = mongoose.model('token', tokenSchema);

    module.exports = TokenModel;
})();

