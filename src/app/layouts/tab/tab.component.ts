import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

import { AngularFireFunctions } from '@angular/fire/functions';

import { AuthService } from './../../services/auth.service';

declare let alertify: any;
declare let $: any;

@Component({
	selector: 'app-tab',
	templateUrl: './tab.component.html',
	styleUrls: ['./tab.component.scss']
})
export class TabComponent implements OnInit {

	user: any;
	has_stores = false;

	constructor(public auth_: AuthService, private router: Router, private fns: AngularFireFunctions) { }

	ngOnInit() {
		this.auth_.user$.pipe(
			tap(user => {
				if (user) {
					this.user = user;
					this.checkAssignedStores()
				} else {
					this.user = null;
					this.has_stores = false;
				}
			})
		).subscribe()
	}

	async checkAssignedStores() {
		try {
			const callable = this.fns.httpsCallable('hasStoresAssigned');
			var res = await callable({}).toPromise();
			if (res.state == "synced") {
				this.has_stores = res.data.result;
			}
		} catch (error) {
			this.has_stores = false;
		}
	}

	openSideMenu(auth) {
		if (!auth) {
			this.auth_.createLoginAlert();
		} else {
			var html = '';
			html += '<h3 class="font-logo mb-4">Menu</h3>';
			html += '<div class="d-flex flex-column">';
			html += '<a class="my-2 lead text-white" href="#" id="about">About</a>';
			html += '<a class="my-2 lead text-white" href="#" id="contact">Contact</a>';
			html += '<a class="my-2 lead text-white" href="#" id="logout">Logout</a>';
			html += '</div>';
			var alert_ = alertify.alert(html, () => {

			}).setting({ basic: true, movable: false })
			$("#about").click((ev) => {
				ev.preventDefault()
				//this.router.navigate(["/"])
				alert_.close()
			})
			$("#contact").click((ev) => {
				ev.preventDefault()
				//this.router.navigate(["/"])
				alert_.close()
			})
			$("#logout").click((ev) => {
				ev.preventDefault()
				this.auth_.signOut()
				this.router.navigate(["/"])
				alert_.close()
			})
		}
	}

}
