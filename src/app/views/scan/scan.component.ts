//https://github.com/mebjas/html5-qrcode
//https://blog.minhazav.dev/HTML5-QR-Code-scanning-launched-v1.0.1/#how-to-use

import { Component, OnInit } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';

declare let Html5Qrcode: any;
declare let Html5QrcodeScanner: any;

@Component({
	selector: 'app-scan',
	templateUrl: './scan.component.html',
	styleUrls: ['./scan.component.scss']
})
export class ScanComponent implements OnInit {

	cam_;
	cam_id;
	state;
	message;
	started = false;

	constructor(private fns: AngularFireFunctions) { }

	ngOnInit() {
		Html5Qrcode.getCameras().then(devices => {
			if (devices && devices.length) {
				this.cam_id = devices[0].id;
				for (let x of devices) {
					if (x.label.toLowerCase().includes('back')) {
						this.cam_id = x.id;
					}
				}
			}
			this.cam_ = new Html5Qrcode("cam-container");
		}).catch(err => {
			this.state = 'error';
			this.message = err;
		});
		//this.cam_ = new Html5QrcodeScanner("cam-container", { fps: 10, qrbox: 250 }, true);
		//this.cam_.render(this.success, this.failure);
	}

	captureClick() {
		if (this.cam_) {
			if (this.started == false) {
				this.cam_.start(this.cam_id, { qrbox: 250 },
					(qr_) => { this.success(qr_) },
					(error) => { this.failure(error) })
			} else {
				this.cam_.stop()
			}
			this.started = !this.started
		}
	}

	success(qr_) {
		this.started = false;
		this.cam_.stop()
		var arr_ = qr_.split(":")
		if (arr_[0] == "token") {
			this.state = 'token_found';
			this.message = arr_[1]
		} if (arr_[0] == "http" || arr_[0] == "https") {
			window.location.href = qr_;
		} else {
			this.state = 'error';
			this.message = 'Invalid QR';
		}
		console.log(qr_)
	}

	failure(ev) {
		console.log(ev)
	}

	ngOnDestroy() {
		if (this.started) {
			this.cam_.stop()
		}
	}

	async acceptToken(tok) {
		try {
			var val_ = {};
			val_["token_id"] = tok;
			const callable = this.fns.httpsCallable('acceptTokenIfAuth');
			var res = await callable(val_).toPromise();
			if (res.state == "synced") {
				this.state = 'synced';
				this.message = 'Token accepted successfully.'
			}
		} catch (error) {
			//this.state = "error";
			console.log(error)
			this.state = 'error';
			this.message = error;
		}
	}

}
