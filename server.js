#!/bin/env node
var express = require('express');
var bodyParser = require('body-parser'), favicon = require('serve-favicon'), logger = require("morgan"),
    methodOverride = require('method-override'), servestatic = require('serve-static');
var routes = require('./routes');
var path = require('path');
var app = express();
var port = 8080;
ipaddress = "0.0.0.0";
app.set('ipaddress', ipaddress);
app.set('port', port);
var server = app.listen(app.get('port'), app.get('ipaddress'), function(){
    console.log('Express server listening on port ' + app.get('port'));
//var server = app.listen(app.get('port'));
    var io = require('socket.io')(server);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');
    app.use(favicon(__dirname + '/public/favicon.ico'));
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(methodOverride());
// app.use(app.router); no longer needed in 4!
    app.use(servestatic(path.join(__dirname, 'public')));
// Handle Errors gracefully
    app.use(function(err, req, res, next) {
        if(!err) return next();
        console.log(err.stack);
        res.json({error: true});
    });
// Main App Page
    app.get('/', routes.index);
// MongoDB API Routes
    app.get('/polls/polls', routes.list);
    app.get('/polls/:id', routes.poll);
    app.post('/polls', routes.create);
    app.post('/vote', routes.vote);
    io.on('connection', routes.vote);
});