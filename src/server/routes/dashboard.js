module.exports = function (app) {

	var dashboard = app.controllers.dashboard;

	app.get('/service/points/count/', dashboard.donuts);
	app.get('/service/points/horizontal1/', dashboard.horizontalBar1);
	app.get('/service/points/horizontal2/', dashboard.horizontalBar2)

	app.get('/service/dashboard/user-inspections', dashboard.userInspections);
	app.get('/service/dashboard/points-inspection', dashboard.pointsInspection);
	app.get('/service/dashboard/meanTime-inspection', dashboard.meanTimeInsp);
	app.get('/service/dashboard/cachedPoints-inspection', dashboard.cachedPoints);
}