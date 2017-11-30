; (function () {
    
    'use strict';

    // * =================================================================
    // * ================ get the packages we need =======================
    // * =================================================================
    
    const env           = process.env.NODE_ENV || 'local';
    const path          = require('path');
    const express       = require('express');
    const logger        = require('morgan');
    const compression   = require('compression');
    const bodyParser    = require('body-parser');
    const Promise       = require('bluebird');
    const swaggerJSDoc  = require('swagger-jsdoc');
    const swaggerTools  = require('swagger-tools');
    const helmet        = require('helmet');
    const mongoose      = require('mongoose');
    const config        = require('./config');
    const routes        = require( './routes' );

    // * =================================================================
    // * ========================= configuration =========================
    // * =================================================================

    if ( env == 'local' ) {
        Promise.config( {
            warnings: true,
            longStackTraces: true,
            cancellation: true,
            monitoring: true,
        });
    }

    const app = express();

    // connect to Mongo when the app initializes
    const options = {
        promiseLibrary: Promise,
        useMongoClient: true,
    };
    
    mongoose.connect(config.database.connect_uri, options);

    if ( env === 'local' ) {
        app.use(logger('dev'));
    }

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    // compress responses that include a Cache-Control header with the no-transform directive,
    app.use(compression());

    // server settings
    app.use(helmet());

    app.use(express.static(path.join(__dirname, 'api-doc')));

    app.use((req, res, next) => {
        const allowOrigin = req.headers.origin || 'http://127.0.0.1:' + config.web_server.port;

        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', allowOrigin);

        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', true);

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authentication, x-access-token');

        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return res.status(200).send();
        } else {
            next();
        }
    });


    // =================================================================
    // ================= swagger documentation =========================
    // =================================================================

    const swaggerDefinition = {
        info: { // API informations (required)
            title: 'PA-Webhook', // Title (required)
            version: '1.0.0', // Version (required)
            description: 'API documentation for personal assistant webhook service.', // Description (optional)
        }
    }

    // Options for the swagger docs
    const swaggeroptions = {
        // Import swaggerDefinitions
        swaggerDefinition: swaggerDefinition,
        // Path to the API docs
        apis: ['./routes/*.js']
    };

    var swaggerSpec = swaggerJSDoc(swaggeroptions);
    

    // Serve swagger docs the way you like (Recommendation: swagger-tools)
    app.get('/api-docs.json', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    // =================================================================
    // ========================= routes ================================
    // =================================================================

    app.use('/', routes);

    app.get('*', (req, res) => {
        res.status(404).send({
            'responseDesc': 'Not Found',
            'data': null,
            'error': 'Sorry, invalid request'
        });
    });

    if (env === 'local') {
        app.use((err, req, res, next) => {
            res.status(err.status || 500);
            return res.json({
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        return res.json({
            message: err.message,
            error: {}
        });
    });

    app.listen(config.web_server.port, err => {
        if (err) {
            console.log('Error starting server : ', err)
        } else {
            console.log('App listening on port ', config.web_server.port);
        }
    });
    
})()
