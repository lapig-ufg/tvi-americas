var util  = require('util')
	, request = require('request')
	, async = require('async');
var fs = require('fs');
var exec = require('child_process').exec;

var count = 0
module.exports = function(app) {

	var config = app.config;
	var Cache = {};

	Cache.get = function(cacheKey, callback) {
		var path = config.imgDir+cacheKey+'/';
		var img = cacheKey.slice(24, 29);
		fs.readFile(path+img, function (err,data) {
		  if (!err && data) {
		  	callback(data);	  	
		  }else{
		    callback(undefined);
		  }
		});
	};

	Cache.set = function(cacheKey, data, callback){
		cacheKey = cacheKey.substr(1);
		exec('mkdir -p '+config.imgDir+cacheKey, function(err, stdout, stderr){
			var path = config.imgDir+cacheKey+'/';
			var img = cacheKey.slice(24, 29);	
			fs.writeFile(path+img, data, function(err) {
			  if(err) {
			    return console.log(err);
			  }
			  callback()
			});
			 			
		})
	}
	
	Cache.populateCache = function(requestPointCache, pointCacheCompĺete, finished) {

		var zoom = 13;
		var periods = ['DRY','WET']

		var long2tile = function(lon,zoom) { 
			return (Math.floor((lon+180)/360*Math.pow(2,zoom))); 
		}
 		
 		var lat2tile = function (lat,zoom) { 
 			return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); 
 		}

 		var getRequestTasks = function(point, campaign) {

 			var satellite
 			var requestTasks = [];
 			var urls = [];
			
			var initialYear = campaign.initialYear;
			var finalYear = campaign.finalYear;

			periods.forEach(function(period){
				for (var year = initialYear; year <= finalYear; year++) {
			 				
	 				satellite = 'L7';
					if(year > 2012) { 
						satellite = 'L8'
					} else if(year > 2011) {
						satellite = 'L7'
					} else if(year > 2003  || year < 2000) {
						satellite = 'L5'
					}

					layerId = satellite+"_"+year+"_"+period
					pointId = point._id

					var url = "http://localhost:" + config.port + "/image/"+layerId+"/"+pointId;
					urls.push(url);
				}
			});

			urls.forEach(function(url) {
				requestTasks.push(function(next) {
					var params = { timeout: 3600 * 1000 };
					var callback = function(error, response, html) {
						requestPointCache(point, url)
						if(error) {
							request(url, params, callback);
						} else {
				    	next();
						}
				  }
					request(url, params, callback);
				});
			});

			return requestTasks;
 		}

 		var cacheJobCanStopFlag = false;
 		var startCacheJob = function(next) {
	 		app.repository.collections.points.findOne({ "cached" : false }, { lon:1, lat: 1, campaign: 1}, { sort: [['index', 1]] }, function(err, point) {
	 			if(point) {
	 				app.repository.collections.campaign.findOne({ "_id" : point.campaign }, function(err, campaign) {
						var requestTasks = getRequestTasks(point, campaign);
						
						var hour = new Date().getHours()
						var day = new Date().getDay();
						var busyTimeCondition = ( (day == 6) || (day == 0) || (hour >= 8 && hour <= 19 ) )

						var parallelRequestsLimit = busyTimeCondition ? config.cache.parallelRequestsBusyTime : config.cache.parallelRequestsDawnTime;

						async.parallelLimit(requestTasks, parallelRequestsLimit, function() {
							app.repository.collections.points.update({ _id: point._id}, { '$set': { "cached": true }  }, {}, function() {
								pointCacheCompĺete(point._id);
								next();
							});
						});
	 				});
	 			} else {
	 				cacheJobCanStopFlag = true;
	 				next()
	 			}
	 		});
 		}

 		var cacheJobCanStop = function() {
 			return cacheJobCanStopFlag;
 		}

 		var onComplete = function() {
 			finished();
 		}

 		async.doUntil(startCacheJob, cacheJobCanStop, onComplete);

	}

	return Cache;
	
}; 