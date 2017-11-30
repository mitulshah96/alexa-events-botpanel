(function () {
    'use strict';

    const express = require('express');
    const superagent = require('superagent')
    const TokenModel = require('../models/token');
    const router = express.Router();
    const accessconfig = require('../config/access');
    const emails = require('../config/emails');
    const AWS = require('aws-sdk')
    const Stream = require('stream')
    const Alexa = require('../controllers/alexa')
    const moment = require('moment');
    const Speech = require('ssml-builder');
    const Base = require('../controllers/base');

    // Create an Polly client
    const Polly = new AWS.Polly({
        "accessKeyId": "AKIAJQ5TGHQ3Z5XCGPTA",
        "secretAccessKey": "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",
        "region": "us-east-2"
    })

    // =================================================================
    // ========================= Bot API ===============================
    // =================================================================

    function handleAccess(req, res, next) {
        if (req.headers['x-requested-from'] !== 'apiai') {
            return next()
        }

        const sessionID = req.body.sessionId;
        // 864fd3e8-9544-c273-4417-7d90f2a1c6be
        req.intentName = req.body.result.metadata.intentName;
        TokenModel.findOne({
            'UUID': sessionID
        }).then((result) => {
            if (!!result) {
                const access = result.access;
                req.hasAccess = false;
                access.map((grant) => {
                    if (accessconfig[grant].intents.indexOf(req.intentName) > -1) {
                        req.hasAccess = true;
                        req.currentConfig = accessconfig[grant];
                    }
                });

                if (req.hasAccess) {
                    return next();
                } else {
                    return res.send(JSON.stringify({
                        'speech': 'I am not trained for that',
                        'displayText': 'I am not trained for that'
                    }));
                }
            } else {
                throw new TypeError('No registered session for this intent');
            }
        }).catch((error) => {
            return res.send(JSON.stringify({
                'speech': 'I am not trained for that',
                'displayText': 'I am not trained for that',
            }));
        });
    }

    router.get('/speak', (req, res) => {
        const query = req.query;
        query.text = query.text !== 'undefined' ? query.text : 'Hi, please enter some text.'
        let params = {
            'Text': query.text,
            'OutputFormat': 'mp3',
            'VoiceId': query.voiceId || 'Joanna'
        }

        Polly.synthesizeSpeech(params, (err, data) => {
            if (err) {
                console.log(err.code)
            } else if (data) {
                if (data.AudioStream instanceof Buffer) {
                    const bufferStream = new Stream.PassThrough();
                    // Write your buffer
                    bufferStream.end(new Buffer(data.AudioStream));
                    res.set({
                        'Content-Type': 'audio/mpeg',
                    });
                    bufferStream.on('error', bufferError => {
                        debug(bufferError);
                        res.status(400).end();
                    });
                    // Pipe it to something else  (i.e. stdout)
                    bufferStream.pipe(res);
                }
            }
        });
    });

    /**
     *  @swagger
     *  /token:
     *   get: 
     *      description: Retrieve user details
     *      tags: ['Authentication']
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: query
     *              in: query
     *              description: provide unique identification identifier
     *              required: true
     *              schema:
     *                  required:
     *                      -   uuid
     *                  properties:
     *                      uuid: 
     *                          type: string,
     *                          default: abc@gmail.com
     *      responses:
     *          200:
     *              description: Success response
     *              schema:
     *                  properties:
     *                      responseDesc:
     *                          type: string,
     *                          default: "Token Found"
     *                      data:
     *                          type: object
     *                          properties:
     *                              access:
     *                                  type: array
     *                                  items: 
     *                                      type: string
     *                                      default: "59d9a2e8695293a55460c4d6"
     *                              uuid:
     *                                  type: string,
     *                                  default: "abfd8551-d5d6-4048-d771-05b419b7ed90"
     *                  error:
     *                      type: string
     *          default:
     *              description: Error response
     *              schema:
     *                  "properties": 
     *                      "responseDesc": 
     *                          type: string
     *                          default: "Token Finding Failed"
     *                      "data": 
     *                          type: array
     *                          items: 
     *                               type: string
     *                      "error":
     *                          type: string
     *                      
     *                      
     */
    router.get('/token', (req, res) => {
        const UUID = req.query.uuid;

        TokenModel.findOne({
            'UUID': UUID
        }).then((result) => {
            return res.status(200).json({
                'responseDesc': 'Token Found',
                'data': result,
                'error': null,
            });
        }).catch((error) => {
            return res.status(500).json({
                'responseDesc': 'Token Finding Failed',
                'data': null,
                'error': error,
            });
        });
    });

    /**
     *  @swagger
     *  /login:
     *   post: 
     *      description: login to Personal Assistant Admin Panel
     *      tags: ['Authentication']
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: body
     *              in: body
     *              description: provide username and password
     *              required: true
     *              schema:
     *                  required:
     *                      -   username
     *                      -   password
     *                  properties:
     *                      username: 
     *                          type: string,
     *                          default: abc@gmail.com
     *                      password:
     *                          type: string
     *                          default: Machines
     *      responses:
     *          200:
     *              description: Success response
     *              schema:
     *                  properties:
     *                      responseDesc:
     *                          type: string,
     *                          default: "Logged in Successfully"
     *                      data:
     *                          type: object
     *                          properties:
     *                              access:
     *                                  type: array
     *                                  items: 
     *                                      type: string
     *                                      default: "59d9a2e8695293a55460c4d6"
     *                              uuid:
     *                                  type: string,
     *                                  default: "abfd8551-d5d6-4048-d771-05b419b7ed90"
     *                  error:
     *                      type: string
     *          default:
     *              description: Error response
     *              schema:
     *                  "properties": 
     *                      "responseDesc": 
     *                          type: string
     *                          default: "Login Failure"
     *                      "data": 
     *                          type: array
     *                          items: 
     *                               type: string
     *                      "error":
     *                          type: string
     *                      
     *                      
     */
    router.post('/login', (req, res) => {
        const user = req.body;
        TokenModel.findOne({
            username: user.username,
            password: user.password
        }).then(result => {
            if (result) {
                return res.status(200).json({
                    'responseDesc': 'Logged in Successfully',
                    'data': {
                        access: result.access,
                        uuid: result.UUID
                    },
                    'error': null,
                });
            } else {
                throw new TypeError('No user found')
            }
        }).catch(e => {
            return res.status(500).json({
                'responseDesc': 'Login Failure',
                'data': null,
                'error': e,
            });
        })
    })

    /**
     *  @swagger
     *  /signup:
     *   post: 
     *      description: create new account for Personal Assistant Admin Panel
     *      tags: ['Authentication']
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: body
     *              in: body
     *              description: provide username and password
     *              required: true
     *              schema:
     *                  required:
     *                      -   username
     *                      -   password
     *                      -   uuid
     *                  properties:
     *                      uuid: 
     *                          type: string
     *                          default: "abfd8551-d5d6-4048-d771-05b419b7ed91"
     *                      username: 
     *                          type: string
     *                          default: test@testmail.com
     *                      password:
     *                          type: string
     *                          default: testpass
     *      responses:
     *          200:
     *              description: Success response
     *              schema:
     *                  properties:
     *                      responseDesc:
     *                          type: string
     *                          default: "Registered Successfully"
     *                      data:
     *                          type: object
     *                          properties:
     *                              access:
     *                                  type: array
     *                                  items: 
     *                                      type: string
     *                                      default: "59d9a2e8695293a55460c4d6"
     *                              uuid:
     *                                  type: string,
     *                                  default: "abfd8551-d5d6-4048-d771-05b419b7ed90"
     *                  error:
     *                      type: string
     *          default:
     *              description: Error response
     *              schema:
     *                  "properties": 
     *                      "responseDesc": 
     *                          type: string
     *                          default: "Registration Failure"
     *                      "data": 
     *                          type: array
     *                          items: 
     *                               type: string
     *                      "error":
     *                          type: string
     *                      
     *                      
     */
    router.post('/signup', (req, res) => {
        const user = req.body;

        const tokenModel = new TokenModel({
            'UUID': user.uuid,
            'username': user.username,
            'password': user.password,
            'access': []
        });

        TokenModel.findOne({
            username: user.username,
            password: user.password
        }).then(result => {
            if (result) {
                return res.status(500).json({
                    'responseDesc': 'User with same username exists.',
                    'data': null,
                    'error': null
                });
            } else {
                tokenModel.save()
                    .then((result) => {
                        return res.status(200).json({
                            'responseDesc': 'Registered Successfully',
                            'data': {
                                access: result.access,
                                uuid: result.UUID
                            },
                            'error': null
                        });
                    }).catch((error) => {
                        return res.status(500).json({
                            'responseDesc': 'Registration Failure',
                            'data': null,
                            'error': error
                        });
                    });
            }
        });
    });

    /**
     *  @swagger
     *  /userstatus:
     *   post: 
     *      description: enable or disable access to particular intent
     *      tags: ['Intent']
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: x-access-token
     *              in: header
     *              description: Token for authorization.
     *              required: true
     *              type: string
     *          -   name: body
     *              in: body
     *              description: provide username and password
     *              required: true
     *              schema:
     *                  required:
     *                      -   accessid
     *                      -   checked
     *                  properties:
     *                      accessid: 
     *                          type: string
     *                          default: "59d9a2e8695293a55460c4d6"
     *                      checked: 
     *                          type: boolean
     *                          default: true
     *      responses:
     *          200:
     *              description: Success response
     *              schema:
     *                  properties:
     *                      responseDesc:
     *                          type: string
     *                          default: "Access Updated"
     *                      data:
     *                          type: array
     *                          items:
     *                              type: object
     *                  error:
     *                      type: string
     *          default:
     *              description: Error response
     *              schema: 
     *                  "properties": 
     *                      "responseDesc": 
     *                          type: string
     *                          default: "Access Updating Failed"
     *                      "data": 
     *                          type: array
     *                          items: 
     *                               type: string
     *                      "error":
     *                          type: string
     *                      
     *                      
     */
    router.post('/userstatus', (req, res) => {
        const UUID = req.headers['x-access-token'];
        const accessID = req.body.accessid;
        const checked = req.body.checked;
        let query = {};

        if (checked) {
            query = {
                $push: {
                    'access': accessID
                }
            };
        } else {
            query = {
                $pull: {
                    'access': {
                        $in: [accessID]
                    }
                }
            };
        }

        TokenModel.update({
            UUID: UUID
        }, query).then((result) => {
            return res.status(200).json({
                'responseDesc': 'Access Updated',
                'data': result,
                'error': null,
            });
        }).catch((error) => {
            return res.status(500).json({
                'responseDesc': 'Access Updating Failed',
                'data': null,
                'error': error,
            });
        });
    });

    /**
     *  @swagger
     *  /webhook:
     *   post: 
     *      description: Webhook for dialogflow and alexa
     *      tags: ['Webhook']
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: x-forwarded-proto
     *              in: header
     *              description: header to distinguish between dialogflow and alexa.
     *              type: string
     *              default: "apiai"
     *          -   name: body
     *              in: body
     *              description: dialogflow content
     *              required: true
     *              schema:
     *                  required:
     *                      -   sessionid
     *                      -   result
     *                  properties:
     *                      sessionid: 
     *                          type: string
     *                          default: "abfd8551-d5d6-4048-d771-05b419b7ed90"
     *                      result: 
     *                          type: object
     *                          properties:
     *                              source:
     *                                  type: string
     *                                  default: 'agent'
     *                              resolvedQuery:
     *                                  type: string,
     *                                  default: 'get all events'
     *                              speech:
     *                                  type: string
     *                                  default: ''
     *                              action:
     *                                  type: string
     *                                  default: 'calendar_events'
     *                              actionIncomplete:
     *                                  type: boolean
     *                                  default: false
     *                              metadata:
     *                                  type: object
     *                                  properties:
     *                                      intentId:
     *                                          type: string
     *                                          default: "3291345f-4f86-4398-b2b0-f825f4ccf87e"
     *                                      webhookUsed:
     *                                          type: string
     *                                          default: true
     *                                      webhookForSlotFillingUsed:
     *                                          type: string
     *                                          default: false
     *                                      intentName:
     *                                          type: string
     *                                          default: 'calendar-widget'
     *      responses:
     *          200:
     *              description: Success response
     *              schema:
     *                  properties:
     *                      "speech": 
     *                          type: string
     *                          default: "Sample response"
     *                      "messages": 
     *                          type: array
     *                          items: 
     *                               type: string
     *                      "displayText":
     *                          type: string
     *          default:
     *              description: Error response
     *              schema:
     *                  "properties": 
     *                      "speech": 
     *                          type: string
     *                          default: "Sample response"
     *                      "messages": 
     *                          type: array
     *                          items: 
     *                               type: string
     *                      "displayText":
     *                          type: string
     *                      
     *                      
     */
    router.post('/webhook', handleAccess, (req, res) => {
        var startdate = '';
        var enddate = '';
        var alexa;

        if (req.headers['x-requested-from'] != 'apiai') {
            // console.log(req.body.request.intent.slots)

           // console.log(req.body);

            const action = req.body.request.intent.name;
            const token = req.body.session.user.accessToken;

            
            

            if (!!token) {             

                if (!req.body.request.intent.slots) {
                    
                    alexa = new Alexa(token)
                    alexa.handleAction(action)
                    .then(result => res.status(200).json(result))
                    .catch(error => res.status(200).json(error))
                
                }
                else{

                    var today = req.body.request.intent.slots.today.value
                    var tomorrow = req.body.request.intent.slots.tomorrow.value
                    var date = req.body.request.intent.slots.date.value

                    if (!!today) {
                        console.log(today)
                        startdate = req.body.request.intent.slots.today.value
                        enddate = req.body.request.intent.slots.today.value
                        startdate = moment.utc(startdate).format();
                        enddate = moment.utc(enddate).format('YYYY-MM-DDT23:59:59');

                        alexa = new Alexa(token, startdate, enddate)
                        alexa.handleAction(action)
                        .then(result => res.status(200).json(result))
                        .catch(error => res.status(200).json(error))

                    }
                    else if (!!tomorrow) {
                        startdate = tomorrow;
                        enddate = tomorrow;
                        startdate = moment.utc(startdate).format();
                        enddate = moment.utc(enddate).format('YYYY-MM-DDT23:59:59');
                        alexa = new Alexa(token, startdate, enddate)
                        alexa.handleAction(action)
                        .then(result => res.status(200).json(result))
                        .catch(error => res.status(200).json(error))

                    }
                    else if (!!date) {
                        startdate = date;
                        enddate = date;
                        startdate = moment.utc(startdate).format();
                        enddate = moment.utc(enddate).format('YYYY-MM-DDT23:59:59');
                        alexa = new Alexa(token, startdate, enddate)
                        alexa.handleAction(action)
                        .then(result => res.status(200).json(result))
                        .catch(error => res.status(200).json(error))
                    }
                    else {
                        console.log('No event date')
                        res.json({
                            version: "1.0",
                            response: {
                                outputSpeech: {
                                    ssml: "Sorry,I didn\'t got the date. Please can you repeat it again",
                                    type: "SSML"
                                },
                                speechletResponse: {
                                    outputSpeech: {
                                        ssml: "Sorry,I didn\'t got the date. Please can you repeat it again"
                                    },
                                    shouldEndSession: true
                                }
                            },
                            sessionAttributes: {}
                        })
                        //res.status(200).json(alexa.handleError('Sorry,I did\'t got the date.Please can you repeat it again'))
                    }
                }

                
            
            } else {
                console.log('No token')
                res.send({
                    "version": "1.0",
                    "response": {
                      "outputSpeech": {
                        "ssml": "Sorry, your my source account is not linked. Please go to alexa app to link it.",
                        "type": "SSML"
                      },
                      "speechletResponse": {
                        "outputSpeech": {
                          "ssml": "Sorry, your my source account is not linked. Please go to alexa app to link it."
                        },
                        "shouldEndSession": true
                      }
                    },
                    "sessionAttributes": {}
                  })
                //  res.status(200).json(alexa.handleError('Sorry, your my source account is not linked. Please go to alexa app to link it.'))
            }




        } else {
            superagent.post(`${req.currentConfig.service}/${req.intentName}`, req.body,
                (err, resp, body) => {
                    if (err) {
                        return res.send(JSON.stringify({
                            'speech': err.message,
                            'messages': [],
                            'displayText': err.message,
                            'data': {}
                        }));
                    } else {
                        return res.send(JSON.stringify({
                            'speech': JSON.parse(resp.text).Data.speech,
                            'messages': JSON.parse(resp.text).Data.messages,
                            'displayText': JSON.parse(resp.text).Data.displayText,
                            'data': JSON.parse(resp.text).Data.data
                        }));
                    }
                })
        }
    });

    module.exports = router;

})();