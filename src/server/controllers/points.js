var ejs = require('ejs');
var fs = require('fs')
var schedule = require('node-schedule');

module.exports = function(app) {

	var Points = {};
	var pointSession = [];

	var points = app.repository.collections.points;
	var mosaics = app.repository.collections.mosaics;

	var getImageDates = function(path, row, callback) {

		var filterMosaic = {'dates.path': path, 'dates.row': row };
		var projMosaic = { dates: {$elemMatch: {path: path, row: row }}};

		mosaics.find(filterMosaic,projMosaic).toArray(function(err, docs) {
			var result = {}


			docs.forEach(function(doc) {
				if (doc.dates && doc.dates[0]) {
					result[doc._id] = doc.dates[0]['date']
				}
			})

			callback(result)
		})
	}

	var findPoint = function(name, campaign, callback){
		var findOneFilter = { 
			"$and": [
				{ "userName": { "$nin": [ name ] } },
				{ "$where":'this.userName.length<10' },
				{ "campaign": { "$eq": campaign } },
				{ "underInspection": { $lt: 10 } }
			]
		};
		var currentFilter = { 
			"$and": [
				{ "userName": { "$nin": [ name ] } },
				{ "$where":'this.userName.length<10' },
				{ "campaign": { "$eq": campaign } }
			]
		};

		var countFilter = {
			"$and": [
				{ "userName": { $in: [name] } },
    		{"campaign":campaign}
    	]
   	};

		var totalFilter = { 
			"$and": [
				{"campaign": { "$eq": campaign }}
			]
		};
		
		points.findOne(findOneFilter, { sort: [['index', 1]] }, function(err, point) {
			point.underInspection += 1;
			points.save(point, function() {
				points.count(totalFilter, function(err, total) {
					points.count(countFilter, function (err, count) {
						getImageDates(point.path, point.row, function(dates) {
							point.dates = dates

							var result = {};
							result['point'] = point;
							result['total'] = total;
							result['current'] = point.index
							result['user'] = name;
							result['count'] = count;
							callback(result);
						})
					})
				});				
			});
		});

	};

	Points.getCurrentPoint = function(request, response) {
		var user = request.session.user;

		findPoint(user.name, user.campaign, function(result) {
				request.session.currentPointId = result.point._id;
				response.send(result);
				response.end();
			})					
	};

	Points.updatePoint = function(request, response) {
		
		var point = request.body.point;
		var user = request.session.user;

		point.inspection.fillDate = new Date();

		points.update(
			{ 
				 _id: point._id
			},
			{
				$push: {
					"inspection": point.inspection,
			  	"userName": request.session.user.name,
			  }
			}, 
			 function(err, item){
				findPoint(user.name, user.campaign, function(result){
					request.session.currentPointId = result.point._id
					response.send(result);
					response.end();
				})			
		});
	};

	return Points;

}