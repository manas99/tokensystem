import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

import { AuthService } from './../services/auth.service'
import { Observable } from 'rxjs';
import { tap, map, take } from 'rxjs/operators';

declare let alertify: any;

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private auth: AuthService, private router: Router) { }

	canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
		return this.auth.user$.pipe(
			take(1),
			map(user => !!user), // <-- map to boolean
			tap(loggedIn => {
				if (!loggedIn) {
					alertify.error("Please Login to continue.")
					//this.router.navigate(['/']);
				}
			})
		)
	}
}
