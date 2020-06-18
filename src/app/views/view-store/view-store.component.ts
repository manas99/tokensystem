import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

declare let moment: any;
declare let $: any;

@Component({
	selector: 'app-view-store',
	templateUrl: './view-store.component.html',
	styleUrls: ['./view-store.component.scss']
})
export class ViewStoreComponent implements OnInit {

	moment;
	minDate = moment()
	maxDate = moment().add(environment.TOKEN_GEN_DAYS_COUNT, 'days')

	store_slug: string = null;
	selected_date = moment();

	storeDoc: AngularFirestoreDocument<any> = null;
	store: Observable<any> = null;

	whsDoc: AngularFirestoreDocument<any> = null;
	whs = [];

	toksColl: AngularFirestoreCollection<any> = null;
	toks = [];

	slots = [];
	selected_slot: any;


	constructor(private router: Router, private route: ActivatedRoute, private afs: AngularFirestore, private fns: AngularFireFunctions) {
		this.moment = moment
	}

	ngOnInit() {
		this.route.params.subscribe((params) => {
			if (!params.store_slug) {
				this.router.navigate(["/not-found"])
				return;
			}
			this.store_slug = params.store_slug;
			this.getStoreData()
		});
	}

	getStoreData() {
		this.storeDoc = this.afs.doc('stores/' + this.store_slug) //.doc(params.store_id);
		this.store = this.storeDoc.valueChanges()
	}

	dateChanged(_date) {
		this.selected_date = null;
		if (_date) {
			this.selected_date = _date.clone();
			this.whsDoc = this.afs.doc('stores/' + this.store_slug + '/working_hours/' + _date.format('dddd').toLowerCase())
			this.whsDoc.valueChanges().pipe(tap(res => {
				this.whs = res.workingHours;
				this.setSlots()
			})).subscribe()

			this.toksColl = this.afs.collection('tokens', ref => {
				return ref.where('store', '==', this.store_slug).where('date_str', '==', _date.format("YYYY-MM-DD"))
			})
			this.toksColl.valueChanges().pipe(tap(res => {
				this.toks = res.map(val => val.slot_int)
				this.setSlots()
			})).subscribe()
		}

	}

	setSlots() {
		var slots_ = []
		for (let x of this.whs) {
			if (x.slot_duration) {
				for (let t_ = this.timeToInt(x.start); t_ < this.timeToInt(x.end); t_ = t_ + x.slot_duration) {
					let obj_ = {
						time_int: t_,
						max: x.tokens_per_slot,
						remaining: x.tokens_per_slot,
					};
					for (let j of this.toks) {
						if (t_ >= j && t_ < j + x.slot_duration) {
							obj_.remaining = obj_.remaining - 1
						}
					}
					if (obj_.remaining < 0) {
						obj_.remaining = 0
					}
					slots_.push(obj_)
				}
			}
		}
		this.slots = slots_.sort((a, b) => { return a.time_int - b.time_int }).map(val => {
			return { time: this.intToTime(val.time_int), ...val }
		});
	}

	timeToInt(str_) {
		var _arr = str_.split(":")
		if (_arr.length > 1) {
			return parseInt(_arr[0]) * 60 + parseInt(_arr[1])
		}
		return null
	}

	intToTime(int_) {
		var ret_ = ""
		let hours_ = Math.floor(int_ / 60)
		if (hours_ < 10) {
			ret_ = ret_ + "0" + hours_.toString() + ":"
		} else {
			ret_ = ret_ + hours_.toString() + ":"
		}
		let min_ = int_ % 60;
		if (min_ < 10) {
			ret_ = ret_ + "0" + min_.toString()
		} else {
			ret_ = ret_ + min_.toString()
		}
		return ret_
	}

	selectSlot(x) {
		this.selected_slot = x
	}

	async bookSlot() {
		//this.state = "saving";
		try {
			var val_ = {};
			val_["store_id"] = this.store_slug;
			val_["date"] = moment(this.selected_date.format("YYYY-MM-DD") + " " + this.selected_slot.time).format("YYYY-MM-DD H:mm");
			val_["slot"] = this.selected_slot.time;
			const callable = this.fns.httpsCallable('createToken');
			var res = await callable(val_).toPromise();
			if (res.state == "created") {
				this.router.navigate(["/token", res.data.id])
			}
		} catch (error) {
			//this.state = "error";
			console.log(error)
		}
	}

}
