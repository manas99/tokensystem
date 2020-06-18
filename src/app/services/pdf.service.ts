//To convert fonts: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html

import { Injectable } from '@angular/core';
//import * as jsPDF from 'jspdf'

declare let jsPDF: any;

@Injectable({
	providedIn: 'root'
})
export class PdfService {

	doc_;

	constructor() { }

	createDoc(options = {}) {
		this.doc_ = new jsPDF(options);
		return this.doc_
	}

	save(name) {
		this.doc_.save(name + ".pdf")
	}
}
