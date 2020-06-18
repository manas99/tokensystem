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
declare let moment: any;
//import * as moment from 'moment-timezone';

@Component({
	selector: 'app-my-tokens',
	templateUrl: './my-tokens.component.html',
	styleUrls: ['./my-tokens.component.scss']
})
export class MyTokensComponent implements OnInit {

	tokens_: Observable<any[]>;
	moment;

	constructor(private afs: AngularFirestore, private auth_: AuthService, private router: Router, private loaders_: LoadersService, public page: PaginationService) {
		this.moment = moment;
	}

	ngOnInit() {
		this.auth_.user$.subscribe(user => {
			if (user) {
				var queries: MyQuery[] = [
					{ type: 'where', params: ['user', '==', user.uid] },
					{ type: 'orderBy', params: ['slot_obj', 'desc'] }
				];
				this.page.init('tokens', 'created_at', { prepend: true, queries: queries })
			}
		})

		const queries: MyQuery[] = [{
			type: 'where', params: ['is_verified', '==', true],
		}]
	}

}
