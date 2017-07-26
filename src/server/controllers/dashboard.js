module.exports = function(app){
	var Dashboard = {}

	var points = app.repository.collections.points;

	var getNames = function(userNames){
		var names = {}

		for(var i = 0; i < userNames.length; i++){
			names[userNames[i]] = 0;
		}

		return names;

	}
	
	Dashboard.donuts = function(request, response){

		var campaign = request.param('campaign')
		
		points.count({"landUse": { "$eq": [] }, "campaign": campaign}, function(err1, notinspect){
				points.count({ "landUse": { "$gt": [] }, "campaign": campaign}, function(err2, inspect){
				var dashboardData = {};
				dashboardData['inspect'] = inspect;
				dashboardData['not_inspect'] = notinspect;
				response.send(dashboardData);
			})	
		})
		
	}

	Dashboard.horizontalBar1 = function(request, response){

		var campaign = request.param('campaign')

		var mapFunction = function(){
			for(var un = 0; un < this.userName.length; un++){
				var value = 1;
				var key = this.userName[un];
				emit(key, value);
			}
		}

		var reduceFunction = function(key, value){
			return Array.sum(value);
		}

		points.mapReduce(mapFunction, reduceFunction, { out: { inline : 1}, query: { 'campaign': campaign }},
			function(err, collection) {

				var coordx = [];
				var coordy = [];
				var color = []

				for(var key in collection){

					coordx.push(collection[key].value);
					coordy.push(collection[key]._id);
					color.push('rgba(222,45,38,0.8)')
				}
				
				collection = {};
				collection['coordx'] = coordx;
				collection['coordy'] = coordy;
				collection['color'] = color;

				response.send(collection);
		});

	}

	Dashboard.horizontalBar2 = function(request, response){

		var campaign = request.param('campaign')

		var mapFunction = function(){
			 var majority = {};
           
       for (var i=0; i < this.landUse.length; i++) {
           var l = this.landUse[i];
           var c = this.userName[i];
           if(majority[l] == undefined) {
               majority[l] = 0;
           }
           majority[l] += 1;
       };

       for(key in majority) {
           if (majority[key] > 1) {
               emit(key,1);
               break;
           }
       }
		}

		var reduceFunction = function(key,values){
			return Array.sum(values);
		}

		points.mapReduce(mapFunction,reduceFunction,{ out: { inline : 1},	query: { 'campaign': campaign }},
			function(err, collection) {

				var result = {
					labels: [],
					values: []
				}
				
				collection.forEach(function(c) {
					result.labels.push(c._id);
					result.values.push(c.value);
				});

				response.send(result);
		});

	}
	
	Dashboard.userInspections = function(request, response) {
		
		var counter = {};
		var campaign = request.session.user.campaign;
		var cursor = points.find({ "campaign": campaign });

		cursor.toArray(function(error, docs) {
			
			docs.forEach(function(doc) {
			    doc.userName.forEach(function(name) {        
			         
			        if(counter[name] == null) {
			            counter[name] = 0; 
			        }
			        
			        counter[name]++;
			    })
			});
		  
			var result = {
				usernames: [],
				ninspection: []
			};

			for(var user in counter) {
				result.usernames.push(user)
				result.ninspection.push(counter[user])
			}; 

			  response.send(result);
				response.end();
		})
	}

	Dashboard.pointsInspection = function(request, response) {

		var assert = require('assert');
		var campaign = request.session.user.campaign;
		

		var result = {
			totalPoints: 0,
			pointsInspection: 0,
			noTotalPoints: 0
		};


		points.count({ 'campaign': campaign, 'userName': { '$size': 5} }, function(err, totalPoints) {
			points.count({ 'campaign': campaign, 'userName': { '$size': 0} }, function(err, noTotalPoints) {
				points.count({ 'campaign': campaign }, function(err, pointsInspection) {

					result.totalPoints = totalPoints;
					result.noTotalPoints = noTotalPoints;
					result.pointsInspection = pointsInspection - (totalPoints + noTotalPoints)

					response.send(result);
					response.end();
				});
			});
		}); 
	}

	Dashboard.meanTimeInsp = function(request, response) {

		var listInsp = {};
		var campaign = request.session.user.campaign;
		var cursor = points.find({"campaign" : campaign});

		cursor.toArray(function(error, docs) {
			docs.forEach(function(doc) {
				for(var i=0; i<doc.userName.length; i++) {

	        if(!listInsp[doc.userName[i]]) {
	          listInsp[doc.userName[i]] = { sum: 0, count: 0  };
	        }
	        
	        listInsp[doc.userName[i]].sum = listInsp[doc.userName[i]].sum + doc.inspection[i].counter;
	        listInsp[doc.userName[i]].count = listInsp[doc.userName[i]].count + 1
	    	}

		    for(var key in listInsp) {
				  listInsp[key].avg = (listInsp[key].sum / listInsp[key].count).toFixed(0)
				}
			});
	  
	  	response.send(listInsp);
			response.end();
		});
	}

	Dashboard.cachedPoints = function(request, response) {

		var result = {
			pointsCached: 0,
			pointsNoCached: 0
		}

		var campaign = request.session.user.campaign;
		var cursor = points.find({"campaign": campaign});

		cursor.toArray(function(error, docs) {
			docs.forEach(function(doc) {
				if(doc.cached == false) {
					result.pointsNoCached++;
				} else {
					result.pointsCached++
				}		
			})

		  response.send(result);
			response.end();
		});
	}

	Dashboard.agreementPoints = function(request, response) {
		
		var campaign = request.session.user.campaign;
		var cursor = points.find({"campaign": campaign});

		cursor.toArray(function(err, points) {
			var csvResult = [];
			//Passar o tamanho do array dos anos inspecionados;
			var years = [2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016];

			points.forEach(function(point) {
				//Trocar o número 5 pelo número maximo de inspeções por ponto
				if(point.userName.length == 5) {
					var csvLines = {
						'index': point.index,
						'lon': point.lon,
						'lat': point.lat,
					};
					
					var landUses = {};
					
					for(var i=0; i < point.userName.length; i++) {
						
						var userName = point.userName[i];
						var form = point.inspection[i].form;

						form.forEach(function(f) {
							
							for( var year = f.initialYear; year <= f.finalYear; year++) {
								
								if(!landUses[year])
									landUses[year] = [];

								landUses[year].push(f.landUse);
							}
						});
					}

					for(var landUse in landUses) {
						
						var votes = {};

						for (var i in landUses[landUse]) {
							if(!votes[landUses[landUse][i]])
								votes[landUses[landUse][i]]=0

							votes[landUses[landUse][i]] += 1;
						}

						for(var i in votes) {
							
							if (votes[i] >= Math.ceil(5 / 2)) {
								csvLines[landUse] = i;
								csvLines[landUse+"_votes"] = votes[i];

								break;
							}
						}
					}

					csvResult.push(csvLines)
				}
			});

			var result = {};
		
			for(var i=years[0]; i<=years[years.length - 1]; i++) {
				
				if(!result[i+'_pontosConc'])
					result[i+'_pontosConc'] = 0;

				if(!result[i+'_pontosNaoConc'])
					result[i+'_pontosNaoConc'] = 0;
				
				
				csvResult.forEach(function(data) {
					//Trocar o numero 3 pela media dos inspetores
					if(data[i+"_votes"] >= 3) {
						result[i+'_pontosConc']++;
					} else {
						result[i+'_pontosNaoConc']++;
					}
				});
			}

			response.send(result);
			response.end();

		});
	}

	Dashboard.landCoverPoints = function(request, response){
		
		var campaign = request.session.user.campaign;
		var cursor = points.find({"campaign": campaign});
		var csvResult = [];
		var years = [2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016];

		cursor.toArray(function(err, docs) {
	
			docs.forEach(function(doc) {
				if(doc.userName.length == 5) {
					var csvLines = {
						'index': doc.index,
						'lon': doc.lon,
						'lat': doc.lat,
					};
					
					var landUses = {};
					
					for(var i=0; i < doc.userName.length; i++) {
						
						var userName = doc.userName[i];
						var form = doc.inspection[i].form;

						form.forEach(function(f) {
							
							for( var year = f.initialYear; year <= f.finalYear; year++) {
								
								if(!landUses[year])
									landUses[year] = [];

								landUses[year].push(f.landUse);
							}
						});
					}

					for(var landUse in landUses) {
						
						var votes = {};

						for (var i in landUses[landUse]) {
							if(!votes[landUses[landUse][i]])
								votes[landUses[landUse][i]]=0

							votes[landUses[landUse][i]] += 1;
						}

						for(var i in votes) {
							
							if (votes[i] >= Math.ceil(5 / 2)) {
								csvLines[landUse] = i;
								csvLines[landUse+"_votes"] = votes[i];

								break;
							}
						}
					}

					csvResult.push(csvLines)
				}
			});
			
			var landCover = {};
			var meanCover = {};

			csvResult.forEach(function(data) {
				for(var i=years[0]; i<=years[years.length - 1]; i++) {
					if(data[i] != undefined) 
						if(!landCover[data[i]])
							landCover[data[i]] = 0
							landCover['count_'+data[i]] = 0
				}
			});

			csvResult.forEach(function(data) {
				for(var i=years[0]; i<=years[years.length - 1]; i++) {
					if(data[i] != undefined) {
						landCover[data[i]] = landCover[data[i]] + data[i+'_votes'];
						landCover['count_'+data[i]]++;
						meanCover[data[i]] = (landCover[data[i]]/landCover['count_'+data[i]]).toFixed(2);
					}
				}
			});
			
			response.send(meanCover);
			response.end();
		});
	}

	return Dashboard;
}