import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { auth } from 'firebase/app';

import { Observable, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

declare let alertify: any;
declare let $: any;

@Injectable({
	providedIn: 'root'
})
export class AuthService {

	user$: Observable<User>;

	recaptchaVerifier: any;
	confirmationResult: any;

	constructor(private afAuth: AngularFireAuth, private router: Router, private afs: AngularFirestore) {
		this.user$ = this.afAuth.authState.pipe(
			switchMap(user => {
				if (user) {
					localStorage.setItem('user', JSON.stringify(user));
					//return new Promise((resolve, reject) => { resolve(user) })
					return this.afs.doc<any>(`users/${user.uid}`).valueChanges();
				} else {
					localStorage.setItem('user', null);
					return of(null);
				}
			})
		)
	}

	async googleSignin() {
		/*try {
			const provider = new auth.GoogleAuthProvider();
			const credential = await this.afAuth.signInWithPopup(provider);
			return this.updateUserData(credential.user);
		} catch (error) {
			console.log(error)
			//alertify.error("Couldn't Sign you in.")
		}*/
		const provider = new auth.GoogleAuthProvider();
		provider.addScope('https://www.googleapis.com/auth/user.phonenumbers.read')
		provider.addScope('phone');
		provider.addScope('profile');
		const credential = await this.afAuth.signInWithPopup(provider);
		return this.updateUserData(credential.user);
	}

	phonenumberSignin(rec_, phone) {
		this.recaptchaVerifier = new auth.RecaptchaVerifier(rec_, {
			'size': 'invisible',
		});
		return new Promise((resolve, reject) => {
			this.afAuth.signInWithPhoneNumber(phone, this.recaptchaVerifier).then((confirmationResult) => {
				this.confirmationResult = confirmationResult;
				resolve();
			}).catch(function(error) {
				reject(error)
			});
		})

	}

	async verifyOTP(code) {
		/*try {
			var res = this.confirmationResult.confirm(code);
			console.log(res)
			return this.updateUserData(res.user)
		} catch (error) {
			console.log(error)
		}*/
		return new Promise((resolve, reject) => {
			this.confirmationResult.confirm(code).then(result => {
				this.updateUserData(result.user)
				resolve()
				//this.user = result.user;
			}).catch((error) => {
				reject(error)
			})
		})

	}

	private updateUserData(user) {
		// Sets user data to firestore on login
		localStorage.setItem('user', JSON.stringify(user));
		const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${user.uid}`);
		const data = {
			uid: user.uid,
			email: user.email,
			phoneNumber: user.phoneNumber,
			displayName: user.displayName === null ? "" : user.displayName,
			photoURL: user.photoURL === null ? "assets/icons/ionicons/person-circle-sharp.svg" : user.photoURL
		}
		this.router.navigate(['/home']);
		return userRef.set(data, { merge: false })
	}

	async signOut() {
		await this.afAuth.signOut();
		this.router.navigate(['/']);
	}

	createLoginAlert() {
		var html = '<h3 class="font-logo mb-4">Login</h3>';
		html += '<div class="mb-4">';
		html += '<div class="mb-2">Login With Phone:</div>';

		html += '<div class="input-group mb-3">';
		html += '<div class="input-group-prepend">';
		html += '<span class="input-group-text" id="country-code">+91</span>';
		html += '</div>';
		html += '<input id="phone-input" type="number" class="form-control" placeholder="Phone Number" aria-label="Phone Number" aria-describedby="country-code">';
		html += '<div class="input-group-append">'
		html += '<button class="btn btn-dark" type="button" id="signin-phone">Send</button>';
		html += '</div>';
		html += '</div>';
		html += '</div>';

		html += '<div id="verification-cont" class="d-flex flex-column mx-auto" style="max-width:300px;">';

		html += '</div>';
		html += '<div id="recaptcha-cont">';

		html += '</div>';

		/*html += '<div class="d-flex flex-column mx-auto" style="max-width:300px;">';
		html += '<button id="signin-google" class="btn btn-light d-flex align-items-center p-2">';
		html += '<img width="20px" class="ml-auto mr-2" alt="Google sign-in" src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png" />';
		html += '<span class="mr-auto ml-2">Login with Google</span>';
		html += '</button>';
		html += '</div>';*/
		var alert_ = alertify.alert(html, () => {

		}).setting({ basic: true, movable: false })

		$("#signin-google").click((ev) => {
			this.googleSignin().then((res) => {
				alert_.close()
			})
		})

		$("#signin-phone").click((ev) => {
			var phone_ = $("#country-code").html() + "" + $("#phone-input").val();
			$("#verification-cont").html("Sending OTP...");
			this.phonenumberSignin('recaptcha-cont', phone_).then((conf) => {
				var html = '<input id="otp-input" type="number" class="form-control mb-2" placeholder="Enter OTP">';
				html += '<button id="verify-otp" class="btn btn-dark d-flex align-items-center p-2">';
				html += '<span class="mx-auto">Verify Code</span>';
				html += '</button>';
				html += '</div>';
				$("#verification-cont").html(html);
				$("#verify-otp").click((ev) => {
					var code = $("#otp-input").val();
					this.verifyOTP(code).then(() => {
						alert_.close()
					}).catch((error) => {
						console.log(error)
						$("#verification-cont").html("Could not verify OTP.");
					})
				})
			}).catch((error) => {
				$("#verification-cont").html("OTP Not Sent.");
			})
		})
	}
}
