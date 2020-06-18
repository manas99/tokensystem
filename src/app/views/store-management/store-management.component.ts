import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AngularFireFunctions } from '@angular/fire/functions';
import { Observable } from 'rxjs';
import { tap, take } from 'rxjs/operators';

import { AuthService } from './../../services/auth.service';
import { PaginationService, MyQuery } from './../../services/pagination.service';
import { LoadersService } from './../../services/loaders.service';

declare let alertify: any;
declare let $: any;
declare let moment: any;

@Component({
	selector: 'app-store-management',
	templateUrl: './store-management.component.html',
	styleUrls: ['./store-management.component.scss']
})
export class StoreManagementComponent implements OnInit {

	moment;
	user;

	minDate = moment()
	maxDate = moment().add(3, 'days')

	selected_store;
	selected_date = moment();// = moment();

	ownedStores;
	stores;

	params_load = false;
	stores_load = false;

	activeTokens: any;
	otherTokens: any;

	constructor(private afs: AngularFirestore, private auth_: AuthService, private router: Router, private route: ActivatedRoute, private loaders_: LoadersService, public page: PaginationService, private fns: AngularFireFunctions) {
		this.moment = moment
	}

	ngOnInit() {
		this.route.params.subscribe(params => {
			if (params.store_slug) {
				this.selected_store = params.store_slug;
			}
			this.params_load = true;
			this.selectStore()
		})
		this.auth_.user$.pipe(
			tap(user => {
				this.user = user
				if (user) {
					this.getStoresData()
				}
			}
			)).subscribe()
	}

	selectStore() {
		if (this.stores_load && this.params_load) {
			if (this.selected_store) {
				if (!this.stores.hasOwnProperty(this.selected_store)) {
					this.router.navigate(["/not-found"])
				}
				this.getTokens()
			} else {
				this.router.navigate(["/stores", "manage", Object.keys(this.stores)[0]])
			}
		}
	}

	storeChanged() {
		this.router.navigate(["/stores", "manage", this.selected_store])
		this.selectStore()
	}

	async getStoresData() {
		try {
			const callable = this.fns.httpsCallable('getAssignedStores');
			var res = await callable({}).toPromise();
			if (res.state == "synced") {
				var _stores = {}
				for (let x of res.data.owner) {
					_stores[x.slug] = x
				}
				for (let x of res.data.employee) {
					_stores[x.slug] = x
				}
				this.stores = _stores
				this.stores_load = true;
				this.selectStore()
			}
		} catch (error) {
			//this.state = "error";
			console.log(error)
		}
	}

	/*dateChanged(_date) {
		this.selected_date = null;
		if (_date) {
			this.selected_date = _date.clone();
			this.getTokens()
		}
	}*/

	async getTokens() {
		if (this.selected_date != null && this.stores_load && this.params_load) {
			this.activeTokens = await this.afs.collection('tokens', ref => {
				return ref.where("store", '==', this.selected_store)
					.where("status", '==', 1)
					.where('date_str', '==', this.selected_date.format("YYYY-MM-DD"))
					.orderBy('slot_obj', 'asc')
			}).valueChanges()
			this.otherTokens = await this.afs.collection('tokens', ref => {
				return ref.where("store", '==', this.selected_store)
					.where("status", '==', 2)
					.where('date_str', '==', this.selected_date.format("YYYY-MM-DD"))
					.orderBy('slot_obj', 'asc')
			}).valueChanges()
		}
	}

	isOwner() {
		if (this.stores_load && this.params_load && this.selected_store) {
			return this.stores[this.selected_store].owner == this.user.uid
		}
		return false
	}
}
