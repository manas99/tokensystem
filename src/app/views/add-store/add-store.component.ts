//to add fonts: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html

import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import { PdfService } from '../../services/pdf.service';

import * as moment from 'moment-timezone'

declare let alertify: any;
//declare let jsPDF: any;
declare let QRCode: any;
declare let $: any;

@Component({
	selector: 'app-add-store',
	templateUrl: './add-store.component.html',
	styleUrls: ['./add-store.component.scss']
})
export class AddStoreComponent implements OnInit {

	@ViewChild('pdfContainer', { static: false }) pdfCont;
	@ViewChild('qrContainer', { static: false }) qrCont;

	state = '';
	store_id: any = null;

	storeForm = {
		is_verified: false,
		name: '',
		city: '',
		location: '',
		phone: '',
		phone_prefix: '+91',
		id: null,
		timezone: moment.tz.guess()
	};

	employeesForm = [];
	//days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
	whsForm = {
		"monday": [],
		"tuesday": [],
		"wednesday": [],
		"thursday": [],
		"friday": [],
		"saturday": [],
		"sunday": []
	};

	private storeDoc: AngularFirestoreDocument<any> = null;
	private empColl: AngularFirestoreCollection<any> = null;
	private whsColl: AngularFirestoreCollection<any> = null;


	constructor(private router: Router, private route: ActivatedRoute, private afs: AngularFirestore, private fns: AngularFireFunctions, private pdf_: PdfService) { }

	ngOnInit() {
		console.log(this.storeForm)
		this.route.params.subscribe(params => {
			if (params.store_id) {
				this.store_id = params.store_id;

				this.storeDoc = this.afs.doc('stores/' + params.store_id) //.doc(params.store_id);
				this.storeDoc.valueChanges().pipe(
					tap(doc => {
						if (doc) {
							this.storeForm = doc;
							this.state = 'synced';
						}
					})
				).subscribe();

				this.empColl = this.afs.collection<any>('stores/' + params.store_id + "/employees");
				this.empColl.snapshotChanges().pipe(
					tap((changes) => {
						this.employeesForm = [];
						changes.map(a => {
							const data = a.payload.doc.data();
							const id = a.payload.doc.id;
							this.employeesForm.push({ id, ...data })
						})
					})
				).subscribe();

				this.whsColl = this.afs.collection<any>('stores/' + params.store_id + "/working_hours", ref => {
					return ref.where("type", "==", "day")
				});
				this.whsColl.snapshotChanges().pipe(
					tap((changes) => {
						//this.employeesForm = [];
						changes.map(a => {
							const id = a.payload.doc.id;
							const data = a.payload.doc.data();
							this.whsForm[id] = data.workingHours
							//this.employeesForm.push({ id, ...data })
						})
					})
				).subscribe();
			}
		})
	}

	addEmployee() {
		this.employeesForm.push({
			id: null,
			phone_prefix: "+91",
			phone: "",
		})
	}
	removeEmployee(rec, i) {
		if (rec.id) {
			this.afs.doc(`stores/${this.store_id}/employees/${rec.id}`).delete()
		} else {
			this.employeesForm.splice(i, 1)
		}
		//
	}

	addWorkingHour(day) {
		this.whsForm[day].push({
			start: "",
			end: "",
			slot_duration: null,
			tokens_per_slot: null
		})
	}
	removeWorkingHour(day, i) {
		this.whsForm[day].splice(i, 1)
	}

	async onSubmitStore() {
		this.state = "saving";
		try {
			var val_ = {};
			val_["store_id"] = this.store_id;
			val_["data"] = this.storeForm;
			const callable = this.fns.httpsCallable('createStore');
			var res = await callable(val_).toPromise();
			if (res.state == "created") {
				this.router.navigate(["/stores", "edit", res.data.id])
			}
		} catch (error) {
			this.state = "error";
			console.log(error)
		}
	}

	async onSubmitEmployee() {
		this.state = "saving";
		try {
			var val_ = {};
			val_["store_id"] = this.store_id;
			val_["data"] = this.employeesForm;
			const callable = this.fns.httpsCallable('addEmployees');
			var res = await callable(val_).toPromise();
			this.state = res.state;
		} catch (error) {
			this.state = "error";
			console.log(error)
		}
	}

	async onSubmitWorkingHours() {
		this.state = "saving";
		try {
			var val_ = {};
			val_["store_id"] = this.store_id;
			val_["data"] = this.whsForm;
			console.log(val_["data"])
			const callable = this.fns.httpsCallable('addWorkingHoursForDays');
			var res = await callable(val_).toPromise();
			this.state = res.state;
			console.log(res)
		} catch (error) {
			this.state = "error";
			alertify.error(error.message)
			console.log(error)
		}
	}

	async generatePDF() {
		var _qr = await QRCode.toDataURL(environment.BASE_URL + "/q/" + this.store_id)
		var doc = this.pdf_.createDoc({ orientation: 'p', unit: 'in', format: 'a4' })
		//doc.setFont("WorkSans");
		//doc.text(1, 1, "Hey")
		var margin = 0.5; //inches;
		const doc_size = doc.internal.pageSize;
		// var font_text = ['WorkSans', 'normal', 16];
		// var text = "Join the Queue by visiting " + environment.BASE_URL + "/scan and scanning the QR Code."
		// var lines = doc.setFont(font_text[0], font_text[1])
		// 	.setFontSize(font_text[2])
		// 	.splitTextToSize(text, (doc.internal.pageSize.width / 2) - (2 * margin))
		//
		// doc.text(0.5, margin + 16 / 72, lines)
		doc.setDrawColor(0, 0, 0)
			.setLineWidth(1 / 72)
			.line(margin, margin, margin, doc_size.height - margin)
			.line(margin, doc_size.height - margin, doc_size.width - margin, doc_size.height - margin)
			.line(doc_size.width - margin, doc_size.height - margin, doc_size.width - margin, margin)
			.line(doc_size.width - margin, margin, margin, margin)

		doc = this.header(doc)

		doc.setFont("WorkSans").setFontSize(18)
		var text = "Scan this code:"
		doc.text(text, this.centerTextOffset(doc, text), 2)
		var qr_xOffset = doc.internal.pageSize.width / 2 - 2
		doc.addImage(_qr, qr_xOffset, 5, 4, 4)
		doc.save(this.store_id)
	}

	centerTextOffset(doc, text) {
		var pageWidth = doc.internal.pageSize.width;
		return (pageWidth - this.getTxtWidth(doc, text)) / 2
	}

	getTxtWidth(doc, text) {
		var fontSize = doc.internal.getFontSize();
		var txtWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
		return txtWidth;
	}

	header(doc) {
		//doc.setFont('LeagueSpartan').setFontSize(16).setTextColor(0, 0, 0)
		//doc.text('Pretty', 1.5, 1.5)
		//doc.text('Damn ', 1.5, 1.75)
		return doc
	}

}
