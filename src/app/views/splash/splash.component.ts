import { Component, OnInit } from '@angular/core';

import { AuthService } from './../../services/auth.service';

declare let alertify: any;
declare let $: any;
declare let moment: any;
//import * as moment from 'moment-timezone';

@Component({
	selector: 'app-splash',
	templateUrl: './splash.component.html',
	styleUrls: ['./splash.component.scss']
})
export class SplashComponent implements OnInit {

	constructor(public auth_: AuthService) { }

	ngOnInit() {
		console.log(moment())
	}

	login() {
		this.auth_.createLoginAlert()
	}

}
