var ejs = require('ejs');
var fs = require('fs')
var schedule = require('node-schedule');

module.exports = function(app) {

	var Points = {};
	var pointSession = [];

	var pointsCollection = app.repository.collections.points;

	var findPoint = function(name, campaign, callback){
		var findOneFilter = { 
			"$and": [
				{ "userName": { "$nin": [ name ] } },
				{ "$where":'this.landUse.length<3' },
				{ "campaign": { "$eq": campaign } },
				{ "underInspection": { $lt: 3 } }
			]
		};

		var currentFilter = { 
			"$and": [
				{ "userName": { "$in": [ name ] } },
				{ "campaign": { "$eq": campaign } }
			]
		};

		var totalFilter = { 
			"$and": [
				{"campaign": { "$eq": campaign }}
			]
		};
		
		pointsCollection.findOne(findOneFilter, function(err, point) {
			point.underInspection += 1;

			pointsCollection.save(point, function() {

				pointsCollection.count(currentFilter, function(err, current) {
					pointsCollection.count(totalFilter, function(err, total) {

						var result = {};
						result['point'] = point;
						result['total'] = total;
						result['current'] = (current != total) ? current + 1 : current; // current tras o numero de objetos que satisfazem, no caso, a condição findOneFilter;
						callback(result);
					});
				});
			});
		});

	};

	Points.getCurrentPoint = function(request, response) {		
		var user = request.session.user;

		findPoint(user.name, user.campaign, function(result) {
			request.session.Id = result.point._id
			console.log("sessao1", request.session.Id)
			response.send(result);
			response.end();
		});			
	};

	Points.updatePoint = function(request, response) {	
		
		var point = request.body.point;
		var user = request.session.user;

		pointsCollection.update(
			{ 
				 
			},
			{
				$push: {
					"landUse": point.landUse,
			 		"certaintyIndex": point.certaintyIndex,
			  	"userName": request.session.user.name,
			  	"counter": point.counter,
			  }
			}, 
			 function(err, item){
				findPoint(user.name, user.campaign, function(result){
					request.session.Id = result.point._id
					console.log("sessao1", request.session.Id)
					response.send(result);
					response.end();
				})			
		});
	};

	return Points;

}