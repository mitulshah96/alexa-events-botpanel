(function() {
  'use strict';

  process.env.NODE_ENV = process.env.NODE_ENV || 'local';
  process.env.PORT = process.env.PORT || 3008;

  let config = {
    web_server: {
      host: process.env.HOST || '127.0.0.1',
      port: process.env.PORT
    },
    api_base_url: 'https://graph.microsoft.com/v1.0',
    database: {
      connect_uri: 'mongodb://127.0.0.1/adminpanel'
    },
    notification: {
      service: 'gmail',
      username: '',
      password: '',
      debug_to_email: 'vaibhav.satam@accionlabs.com'
    },
    jwt_secret: 'MachineLearn'
  };

  if (process.env.NODE_ENV === 'production') {
    config = {
      web_server: {
        host: process.env.HOST || '127.0.0.1',
        port: process.env.PORT
      },
      api_base_url: 'https://graph.microsoft.com/beta/',
      database: {
        connect_uri: 'mongodb://mongo/adminpanel'
      },
      notification: {
        service: 'gmail',
        username: '',
        password: ''
      },
      jwt_secret: 'MachineLearn'
    };
  }

  config.web_server.url =
    'http://' + config.web_server.host + ':' + config.web_server.port + '/';

  console.log('Config Environment : ' + process.env.NODE_ENV);
  console.log('Config Host : ' + process.env.HOST);

  module.exports = config;
})();
