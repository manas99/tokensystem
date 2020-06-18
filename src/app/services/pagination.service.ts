import { Injectable } from '@angular/core';

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Query } from '@angular/fire/firestore'

import { BehaviorSubject, Observable } from 'rxjs';
import { map, take, tap, scan } from 'rxjs/operators';

export interface MyQuery {
	type: string,
	params: Array<string | string[] | any>
}

interface QueryConfig {
	path: string,
	field: string,
	limit?: number,
	reverse?: number,
	prepend?: boolean,
	queries?: MyQuery[]
}

@Injectable({
	providedIn: 'root'
})
export class PaginationService {

	private _done = new BehaviorSubject(false);
	private _loading = new BehaviorSubject(false);
	private _data = new BehaviorSubject([]);

	private query: QueryConfig;

	data: Observable<any>;
	done: Observable<boolean> = this._done.asObservable();
	loading: Observable<boolean> = this._loading.asObservable();

	changed = false;


	constructor(private afs: AngularFirestore) { }

	init(path, field, opts?) {
		this._data = new BehaviorSubject([]);
		//this._done = new BehaviorSubject(false);
		//this._loading = new BehaviorSubject(false);
		this._loading.next(false)
		this._done.next(false)

		this.query = {
			path,
			field,
			limit: 10,
			reverse: false,
			prepend: false,
			queries: [],
			...opts
		}
		const first = this.afs.collection(this.query.path, ref => {
			return this._genQuery(ref).limit(this.query.limit)
			//.orderBy(this.query.field, this.query.reverse ? 'desc' : 'asc')
		})

		this.mapAndUpdate(first, false);
		//this.data = this._data.asObservable()
		this.data = this._data.asObservable()
			.pipe(scan(
				(acc, val) => {
					if (this.changed) {
						return this.query.prepend ? val.concat(acc) : acc.concat(val)
					} else {
						return val
					}

				}
			))
	}

	mapAndUpdate(col: AngularFirestoreCollection<any>, changed: boolean) {
		this.changed = changed;
		if (this._done.value || this._loading.value) {
			return;
		}

		this._loading.next(true)

		return col.snapshotChanges().pipe(
			tap(arr => {
				let values = arr.map(snap => {
					const data = snap.payload.doc.data()
					const doc = snap.payload.doc;
					return { ...data, doc }
				})

				values = this.query.prepend ? values.reverse() : values;

				this._data.next(values)
				this._loading.next(false)

				if (!values.length) {
					this._done.next(true)
				}
			})
		).subscribe()
	}

	private getCursor() {
		const current = this._data.value;
		if (current.length) {
			return this.query.prepend ? current[0].doc : current[current.length - 1].doc;
		}
		return null;
	}

	more() {
		const cursor = this.getCursor();
		const more = this.afs.collection(this.query.path, ref => {
			return this._genQuery(ref).limit(this.query.limit).startAfter(cursor)
		})
		this.mapAndUpdate(more, true)
	}

	_genQuery(ref) {
		let query_: Query = ref;
		for (let j = 0; j < this.query.queries.length; j++) {
			const q_ = this.query.queries[j];
			if (q_.type == 'where') {
				//console.log(ref)
				query_ = query_.where(q_.params[0], q_.params[1], q_.params[2])
				//console.log(query_)
			}
			if (q_.type == 'orderBy') {
				//console.log(ref)
				query_ = query_.orderBy(q_.params[0], q_.params[1])
				//console.log(query_)
			}
		}
		console.log(this.query)
		return query_
	}

}
