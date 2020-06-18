//bootstrap and momentjs are dependencies

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

declare let moment: any;

@Component({
	selector: 'app-date-slider',
	templateUrl: './date-slider.component.html',
	styleUrls: ['./date-slider.component.scss']
})
export class DateSliderComponent implements OnInit {

	_days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

	@Input() minDate: any = null;
	@Input() maxDate: any = null;
	@Input() defaultDate: any = null;
	@Input() weekStart: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' = 'sun';
	@Input() disabled: boolean = false;

	@Output() dateChanged = new EventEmitter();

	selectedDate: any = null;

	week = []

	constructor() { }

	ngOnInit() {
		var selected_date = null;
		if (!this.defaultDate) {
			if (this.checkDate(moment())) {
				selected_date = moment();
			}
			if (this.minDate && this.checkDate(this.minDate)) {
				selected_date = this.minDate;
			}
		} else {
			selected_date = this.defaultDate.clone();
		}

		if (selected_date) {
			this.selectedDate = selected_date;
			this.dateChanged.emit(this.selectedDate)
			this.week = this.getDaysOfTheWeek(selected_date);
		} else {
			this.week = this.getDaysOfTheWeek(moment());
		}
	}

	getDaysOfTheWeek(date) {
		var sub_ = parseInt(date.format('d')) - this._days.indexOf(this.weekStart)
		var startOfWeek = date.clone().subtract(sub_, 'days');

		var days = [];

		let day = startOfWeek
		for (let j = 0; j < 7; j++) {
			days.push(day);
			day = day.clone().add(1, 'd');
		}
		return days;
	}

	checkDate(date) {
		if (this.minDate && this.maxDate) {
			if (date.isSameOrAfter(this.minDate, 'days') && date.isSameOrBefore(this.maxDate, 'days')) {
				return date
			}
			return null
		}
		if (!this.minDate && this.maxDate) {
			if (date.isSameOrBefore(this.maxDate, 'days')) {
				return date
			}
			return null
		}
		if (this.minDate && !this.maxDate) {
			if (date.isSameOrAfter(this.minDate, 'days')) {
				return date
			}
			return null
		}
		if (!this.minDate && !this.maxDate) {
			return date
		}
		return null
	}

	selectDate(date) {
		if (this.checkDate(date)) {
			this.selectedDate = date;
			this.dateChanged.emit(date)
			return;
		}
		this.selectedDate = null;
		this.dateChanged.emit(null)
	}

	selectToday() {
		this.selectDate(moment())
		this.week = this.getDaysOfTheWeek(moment())
	}

	prevWeek() {
		this.week = this.getDaysOfTheWeek(this.week[0].clone().subtract(7, 'days'));
	}
	nextWeek() {
		this.week = this.getDaysOfTheWeek(this.week[0].clone().add(7, 'days'));
	}


}
