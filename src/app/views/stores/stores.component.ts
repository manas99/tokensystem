import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { tap, take } from 'rxjs/operators';

import { AuthService } from './../../services/auth.service';
import { PaginationService, MyQuery } from './../../services/pagination.service';
import { LoadersService } from './../../services/loaders.service';

declare let alertify: any;
declare let $: any;

@Component({
	selector: 'app-stores',
	templateUrl: './stores.component.html',
	styleUrls: ['./stores.component.scss']
})
export class StoresComponent implements OnInit {

	userDoc: AngularFirestoreDocument<any>;
	user: any;

	search = "";
	search_inp_timer;
	search_timer_dur = 600; //1sec

	//stores = [];
	stores_: Observable<any[]>;
	state = '';

	constructor(private afs: AngularFirestore, private auth_: AuthService, private router: Router, private loaders_: LoadersService, public page: PaginationService) { }

	ngOnInit() {
		//this.auth_.user$.pipe().subscribe()
		const queries: MyQuery[] = [{
			type: 'where', params: ['is_verified', '==', true],
		}]
		this.page.init('stores', 'name', { prepend: true, queries: queries })
	}

	ngOnDestroy() {

	}

	async performSearch() {
		var queries: MyQuery[] = [{ type: 'where', params: ['is_verified', '==', true] }];
		if (!!this.search) {
			queries.push({ type: 'where', params: ['search_index', 'array-contains-any', this.search.split(' ')] })
		}
		this.page.init('stores', 'name', { prepend: true, queries: queries })
	}

	onKeyUp() {
		clearTimeout(this.search_inp_timer);
		this.search_inp_timer = setTimeout(() => {
			this.performSearch()
		}, this.search_timer_dur);
	}

	onKeyDown() {
		clearTimeout(this.search_inp_timer);
	}

}
