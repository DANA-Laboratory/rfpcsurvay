var mongoose = require('mongoose');

// Connecting to Mongo on Openshift
// default to a 'localhost' configuration:
var connection_string = '127.0.0.1:27017';

var db = mongoose.createConnection(connection_string);
var PollSchema = require('../models/Poll.js').PollSchema;
var Poll = db.model('polls', PollSchema); 
exports.index = function(req, res){
     res.render('index', { title: 'سامانه ارزیابی' });
};

// API for clear all votes
exports.list = function(req, res){
	Poll.find({}, 'question', function(error, polls){
		res.json(polls);
	});
};

// JSON API for list of polls 
exports.list = function(req, res){
	Poll.find({}, 'question', function(error, polls){
		for poll in polls{
      console.log(polls[i])
    }
    res.sendStatus(200)
	});
};

// JSON API for getting a single poll
exports.poll = function(req, res) {
	// Poll ID comes in the URL
	var pollId = req.params.id;
	
	// Find the poll by its ID, use lean as we won't be changing it
	Poll.findById(pollId, '', { lean: true }, function(err, poll) {
		if(poll) {
			var userVoted = false,
					userChoice,
					totalVotes = 0;

			// Loop through poll choices to determine if user has voted
			// on this poll, and if so, what they selected
			for(c in poll.choices) {
				var choice = poll.choices[c]; 

				for(v in choice.votes) {
					var vote = choice.votes[v];
					totalVotes++;

					if(vote.ip === (req.header('x-forwarded-for') || req.ip)) {
						userVoted = true;
						userChoice = { _id: choice._id, text: choice.text };
					}
				}
			}

			// Attach info about user's past voting on this poll
			poll.userVoted = userVoted;
			poll.userChoice = userChoice;

			poll.totalVotes = totalVotes;
		
			res.json(poll);
		} else {
			res.json({error:true});
		}
	});
};

// JSON API for creating a new poll 
exports.create = function(req,res){
	var reqBody = req.body,
	choices = reqBody.choices.filter(function(v){ return v.text != ''; }),
	pollObj = {question: reqBody.question, choices: choices};	
	var poll = new Poll(pollObj);
	poll.save(function(err,doc){
		if(err || !doc){
			throw 'Error';
		} else {
			res.json(doc);
		}
	})
}


// Socket API for saving a vote
exports.vote = function(socket) {
  socket.on('send:vote', function(data) {
    // var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address; 
    var ip = socket.handshake.headers['x-forwarded-for'] || socket.request.socket.remoteAddress;  
    // console.log(ip); 
    Poll.findById(data.poll_id, function(err, poll) {
      var choice = poll.choices.id(data.choice);
      choice.votes.push({ ip: ip });      
      poll.save(function(err, doc) {
        var theDoc = { 
          question: doc.question, _id: doc._id, choices: doc.choices, 
          userVoted: false, totalVotes: 0 
        };
        for(var i = 0, ln = doc.choices.length; i < ln; i++) {
          var choice = doc.choices[i]; 
          for(var j = 0, jLn = choice.votes.length; j < jLn; j++) {
            var vote = choice.votes[j];
            theDoc.totalVotes++;
            theDoc.ip = ip;
            if(vote.ip === ip) {
              theDoc.userVoted = true;
              theDoc.userChoice = { _id: choice._id, text: choice.text };
            }
          }
        }       
        socket.emit('myvote', theDoc);
        socket.broadcast.emit('vote', theDoc);
      });     
    });
  });
}; 