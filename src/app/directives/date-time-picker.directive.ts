// Dependencies:
//  https://github.com/fengyuanchen/pickerjs
//  moment.js

import { Directive, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { NgModel } from '@angular/forms';

declare let Picker: any;
declare let moment: any;

@Directive({
	selector: '[appDateTimePicker]',
})
export class DateTimePickerDirective {

	private _picker: any;
	private _format: string = "YYYY/MM/DD HH:mm";
	private _title: string = "Pick Date and Time";

	@Input() format?: string;
	@Input() timeOnly?: boolean = false;
	@Input() dateOnly?: boolean = false;

	//@Output('ngContentInit') initEvent: EventEmitter<any> = new EventEmitter();

	constructor(private el: ElementRef, public model: NgModel) { }

	ngOnInit() {
		if (this.timeOnly) {
			this._format = "HH:mm";
			this._title = "Pick a time";
		}
		if (this.dateOnly) {
			this._format = "YYYY/MM/DD";
			this._title = "Pick a date";
		}
	}

	ngAfterContentInit() {
		this._picker = new Picker(this.el.nativeElement, {
			format: this._format,
			text: {
				title: this._title,
			},
			pick: (pick) => {
				this.datePicked(pick)
			}
		})
	}

	datePicked(pick) {
		this.model.update.emit(moment(this._picker.getDate()).format(this._format))
	}

	ngOnDestroy() {
		this._picker.destroy()
	}

}
