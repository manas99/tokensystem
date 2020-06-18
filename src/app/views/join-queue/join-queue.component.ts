import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';

import { AuthService } from '../../services/auth.service'
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

//import * as moment from 'moment-timezone';
declare let moment: any;

declare let $: any;
@Component({
	selector: 'app-join-queue',
	templateUrl: './join-queue.component.html',
	styleUrls: ['./join-queue.component.scss']
})
export class JoinQueueComponent implements OnInit {

	store_id;
	selected_date = moment()

	toksLoad = false;
	whsLoad = false;

	storeDoc: AngularFirestoreDocument<any> = null;
	store: Observable<any> = null;

	whsDoc: AngularFirestoreDocument<any> = null;
	whs = [];

	toksColl: AngularFirestoreCollection<any> = null;
	toks = [];

	slots = [];

	slot = null;

	constructor(private router: Router, private route: ActivatedRoute, private afs: AngularFirestore, private fns: AngularFireFunctions) { }

	ngOnInit() {
		this.route.params.subscribe(params => {
			if (params.store_id) {
				this.store_id = params.store_id;
				this.getData()
			} else {
				this.router.navigate(["/not-found"])
			}
		})
	}

	getData() {
		this.storeDoc = this.afs.doc('stores/' + this.store_id) //.doc(params.store_id);
		this.store = this.storeDoc.valueChanges()

		this.whsDoc = this.afs.doc('stores/' + this.store_id + '/working_hours/' + this.selected_date.format('dddd').toLowerCase())
		this.whsDoc.valueChanges().pipe(tap(res => {
			this.whsLoad = true;
			this.whs = res.workingHours;
			this.checkSlots()
		})).subscribe()

		this.toksColl = this.afs.collection('tokens', ref => {
			return ref.where('store', '==', this.store_id).where('date_str', '==', this.selected_date.format("YYYY-MM-DD"))
		})
		this.toksColl.valueChanges().pipe(tap(res => {
			this.toksLoad = true;
			this.toks = res.map(val => val.slot_int)
			this.checkSlots()
		})).subscribe()
	}

	checkSlots() {
		this.slot = null
		if (this.toksLoad && this.whsLoad) {
			var slots_ = []
			for (let x of this.whs) {
				if (x.slot_duration) {
					for (let t_ = this.timeToInt(x.start); t_ < this.timeToInt(x.end); t_ = t_ + x.slot_duration) {
						let obj_ = {
							time_int: t_,
							max: x.tokens_per_slot,
							remaining: x.tokens_per_slot,
						};
						if (x.tokens_per_slot) {
							console.log(t_)
							for (let j of this.toks) {
								console.log(j)
								if (t_ >= j && t_ < j + x.slot_duration) {
									obj_.remaining = obj_.remaining - 1
								}
							}
							if (obj_.remaining > 0) {
								slots_.push(obj_)
							}
						} else {
							//create token
							slots_.push(obj_)
						}
					}
				}
			}
			console.log(slots_)
			if (slots_.length == 0) {
				return;
			}
			const slots = slots_ = slots_.sort((a, b) => { return a.time_int - b.time_int })

			this.slot = { time: this.intToTime(slots[0].time_int), ...slots[0] }
		}
	}

	async joinQueue() {
		try {
			var val_ = {};
			val_["store_id"] = this.store_id;
			const callable = this.fns.httpsCallable('joinQueue');
			var res = await callable(val_).toPromise();
			if (res.state == "created") {
				this.router.navigate(["/token", res.data.id])
			}
		} catch (error) {
			//this.state = "error";
			console.log(error)
		}
	}

	timeToInt(str_) {
		let arr_ = str_.split(":");
		return parseInt(arr_[0]) * 60 + parseInt(arr_[1])
	}

	intToTime(int_) {
		var ret_ = ""
		let hours_ = Math.floor(int_ / 60)
		ret_ = ret_ + hours_.toString() + ":"
		let min_ = int_ % 60;
		if (min_ < 10) {
			ret_ = ret_ + "0" + min_.toString()
		} else {
			ret_ = ret_ + min_.toString()
		}
		return ret_
	}

}
