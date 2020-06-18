//https://www.npmjs.com/package/qr-code-styling

import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service'

declare let moment: any;
declare let $: any;
declare let QRCodeStyling: any;
declare let QRCode: any;

@Component({
	selector: 'app-token',
	templateUrl: './token.component.html',
	styleUrls: ['./token.component.scss']
})
export class TokenComponent implements OnInit {

	moment;
	token_id;

	@ViewChild('qrContainer', { static: true }) qrCont;

	_qr;
	token;
	tokRef;
	user;
	userRef;

	constructor(private router: Router, private route: ActivatedRoute, private afs: AngularFirestore, private fns: AngularFireFunctions, private auth_: AuthService) {
		this.moment = moment
	}

	ngOnInit() {
		this.route.params.subscribe(async (params) => {
			if (!params.token_id) {
				this.router.navigate(["/not-found"])
				return;
			}
			await this.auth_.user$.subscribe(res => {
				if (!res) {
					this.router.navigate(["/not-found"])
				} else {
					this.user = res;
					this.token_id = params.token_id;
					this.getTokenData()
				}
			})
		});
	}

	async getTokenData() {
		this.tokRef = this.afs.doc('tokens/' + this.token_id)//.get()
		this.token = await this.tokRef.get().toPromise()
		if (!this.token.exists) {
			this.router.navigate(["/not-found"])
			return;
		}
		if (this.token.data().user != this.user.uid) {
			this.router.navigate(["/not-found"])
			return;
		}

		/*this._qr = new QRCodeStyling({
			data: this.token_id,
			dotsOptions: {
				color: "#000000",
				//type: "rounded"
			},
			backgroundOptions: {
				color: "#ffffff",
			},
		});
		this._qr.append(this.qrCont.nativeElement)
		var canvas = $("#qr-container canvas");
		canvas.css('width', '100%')
		canvas.height(canvas.width())*/
		this._qr = new QRCode.toDataURL(this.qrCont.nativeElement, "token:" + this.token_id, function(error) {
			if (error) console.error(error)
			console.log('success!');
		})
		var canvas = $(this.qrCont.nativeElement);
		canvas.css('width', '100%')
		canvas.height(canvas.width())
	}

}
