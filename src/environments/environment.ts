// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
	production: false,
	firebase: {
		apiKey: "AIzaSyAVv9AnkrOZcZ6wZJl3MQJotqBmdvRNG88",
		authDomain: "tokensystem-cc153.firebaseapp.com",
		databaseURL: "https://tokensystem-cc153.firebaseio.com",
		projectId: "tokensystem-cc153",
		storageBucket: "tokensystem-cc153.appspot.com",
		messagingSenderId: "912031674446",
		appId: "1:912031674446:web:8bc8b2e97367dd2e2d931f",
		measurementId: "G-JC7T547H0K"
	},
	BASE_URL: "http://localhost:4200",
	TOKEN_GEN_DAYS_COUNT: 3,
	PRIMARY_COLOR: '#3F8D28',
	PRIMARY_COLOR_RGB: [63, 142, 40]
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
