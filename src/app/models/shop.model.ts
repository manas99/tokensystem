import { TimeTable } from './timetable.model';
import { User } from './user.model';

export interface Shop {
	name: string;
	owner: string;
	phone?: string;
	city?: string;
	location?: string;
	is_verified?: boolean;
	employees: Array<string>;
	timetable: Array<TimeTable>;
}
