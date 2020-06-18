import { Injectable } from '@angular/core';

declare let $: any;

@Injectable({
	providedIn: 'root'
})
export class LoadersService {

	constructor() { }
	start() {
		$("#custom-loader").css('display', 'flex');
	}

	stop() {
		$("#custom-loader").css('display', 'none');
	}
}
