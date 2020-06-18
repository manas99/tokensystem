import * as functions from 'firebase-functions';

const admin = require('firebase-admin');
const FieldValue = require('firebase-admin').firestore.FieldValue;

var moment = require('moment-timezone');

import { v4 as uuidv4 } from 'uuid';

import { genID, genSlug, tokenizeString, createSuccess, createResponse, timeToInt, intToTime } from './helpers';
import { days, TOKEN_GEN_DAYS_COUNT, TokenStates } from './constants';

var serviceAccount = require('../tokensystem-cc153-firebase-adminsdk-bv426-5df2638cc7.json');
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://tokensystem-cc153.firebaseio.com'
});
let db = admin.firestore();


export const createStore = functions.https.onCall(async (req, context) => {
	if (context.auth.uid == null) {
		throw new functions.https.HttpsError('unauthenticated', 'Not signed in.');
	}
	if (!req.data.name || req.data.name == "") {
		throw new functions.https.HttpsError('invalid-argument', 'Name cannot be empty.');
	}
	if (!req.data.city || req.data.city == "") {
		throw new functions.https.HttpsError('invalid-argument', 'City cannot be empty.');
	}
	if (!req.data.location || req.data.location == "") {
		throw new functions.https.HttpsError('invalid-argument', 'Location cannot be empty.');
	}
	if (req.data.phone_prefix == "") {
		req.data.phone_prefix = "+91";
	}
	let docRef, res_: any;
	var store_: any = {};
	if (req.store_id) {
		docRef = db.collection('stores').doc(req.store_id);
		let old_ = await docRef.get()

		if (old_.data().owner !== context.auth.uid) {
			throw new functions.https.HttpsError('permission-denied', 'Not the store owner.');
		}
		store_["owner"] = old_.data().owner;
		store_["is_verified"] = old_.data().is_verified;
		store_["id"] = old_.data().id;
		store_["updated_at"] = FieldValue.serverTimestamp();
		res_ = createResponse("synced", "Sync Successful.");
	} else {
		//generate id
		var _id = genID(6);
		docRef = await db.collection('stores').doc(genSlug(`${req.data.name.toLowerCase()} ${req.data.city.toLowerCase()} ${_id}`));

		store_["id"] = _id;
		store_["owner"] = context.auth.uid;
		store_["is_verified"] = false;
		store_["slug"] = docRef.id;
		store_["created_at"] = FieldValue.serverTimestamp();
		res_ = createResponse("created", "Create Successful.", { id: docRef.id });
	}
	store_["timezone"] = req.data.timezone;
	store_["name"] = req.data.name;
	store_["city"] = req.data.city;
	store_["location"] = req.data.location;
	store_["search_string"] = `${req.data.name}, ${req.data.location}, ${req.data.city}`.toLowerCase();
	store_["search_index"] = tokenizeString(store_["search_string"])//[...new Set([].concat(tokenizeString(req.data.name), tokenizeString(req.data.location), tokenizeString(req.data.city), tokenizeString(store_["search_string"])))];//createSearchIndex(search_) //.toLowerCase().split()
	store_["phone_prefix"] = req.data.phone_prefix;
	store_["phone"] = req.data.phone;

	await docRef.set(store_, { merge: true })
	return res_;
})

export const hasStoresAssigned = functions.https.onCall(async (req, context) => {
	if (context.auth.uid == null) {
		throw new functions.https.HttpsError('unauthenticated', 'Not signed in.');
	}

	let userRef = await db.collection('users').where('uid', '==', context.auth.uid).get()
	if (userRef.empty) {
		throw new functions.https.HttpsError('unauthenticated', 'User ID not found.');
	}
	const user = userRef.docs[0].data();

	let storesRef = await db.collection('stores').where('owner', '==', context.auth.uid).get()
	if (!storesRef.empty) {
		return createSuccess("Has stores", { result: true })
	}
	let empRef = await db.collectionGroup('employees').where('complete_phone', '==', user.phoneNumber)
	if (!empRef.empty) {
		return createSuccess("Has stores", { result: true })
	}
	throw new functions.https.HttpsError('unavailable', 'No stores available.');
})

export const getAssignedStores = functions.https.onCall(async (req, context) => {
	if (context.auth.uid == null) {
		throw new functions.https.HttpsError('unauthenticated', 'Not signed in.');
	}

	let userRef = await db.collection('users').where('uid', '==', context.auth.uid).get()
	if (userRef.empty) {
		throw new functions.https.HttpsError('unauthenticated', 'User ID not found.');
	}
	const user = userRef.docs[0].data();

	var data_ = {}
	data_["owner"] = []
	data_["employee"] = []

	let ownRef = await db.collection('stores').where('owner', '==', context.auth.uid).get()
	if (!ownRef.empty) {
		for (const j of ownRef.docs) {
			data_["owner"].push(j.data())
		}
	}
	let empRef = await db.collectionGroup('employees').where('complete_phone', '==', user.phoneNumber).get()
	if (!empRef.empty) {
		for (const j of empRef.docs) {
			const store_ = await j.ref.parent.parent.get()
			data_["employee"].push(store_.data())
		}
	}
	return createSuccess("", data_)
})

export const addEmployees = functions.https.onCall(async (req, context) => {
	if (context.auth.uid == null) {
		throw new functions.https.HttpsError('unauthenticated', 'Not signed in.');
	}
	if (!req.store_id) {
		throw new functions.https.HttpsError('invalid-argument', 'No store specified.');
	}
	let storeRef = await db.collection('stores').doc(req.store_id);
	let store_ = await storeRef.get()
	if (store_ && store_.data().owner != context.auth.uid) {
		throw new functions.https.HttpsError('permission-denied', 'Not the store owner.');
	}
	for (let i = 0; i < req.data.length; i++) {
		const emp = req.data[i];
		let empRef;
		if (!emp.phone_prefix || emp.phone_prefix == "") {
			throw new functions.https.HttpsError('invalid-argument', 'Phone prefix is empty.');
		}
		if (!emp.phone || emp.phone == "") {
			throw new functions.https.HttpsError('invalid-argument', 'Phone no is empty.');
		}
		if (emp.id) {
			empRef = await db.doc(`stores/${storeRef.id}/employees/${emp.id}`)
		} else {
			empRef = await db.doc(`stores/${storeRef.id}/employees/${genID(5)}`)
		}
		var obj = {
			phone_prefix: emp.phone_prefix,
			phone: emp.phone,
			complete_phone: emp.phone_prefix + "" + emp.phone
		}
		await empRef.set(obj, { merge: true })
	}

	return createSuccess();
})

export const addWorkingHoursForDays = functions.https.onCall(async (req, context) => {
	if (context.auth.uid == null) {
		throw new functions.https.HttpsError('unauthenticated', 'Not signed in.');
	}
	if (!req.store_id) {
		throw new functions.https.HttpsError('invalid-argument', 'No store specified.');
	}

	let storeRef = await db.collection('stores').doc(req.store_id);
	let store_ = await storeRef.get()
	if (store_ && store_.data().owner != context.auth.uid) {
		throw new functions.https.HttpsError('permission-denied', 'Not the store owner.');
	}

	for (let x in req.data) {
		if (!days.includes(x)) {
			throw new functions.https.HttpsError('invalid-argument', 'Not a valid day.');
		}

		var sch_ = req.data[x];
		for (let i = 0; i < sch_.length; i++) {
			const start_i = timeToInt(sch_[i].start);
			const end_i = timeToInt(sch_[i].end);
			if (start_i == null || end_i == null || start_i >= end_i) {
				throw new functions.https.HttpsError('invalid-argument', 'Invalid Time.');
			}
			for (let j = 0; j < i; j++) {
				const start_j = timeToInt(sch_[j].start);
				const end_j = timeToInt(sch_[j].end);

				if (start_j < start_i && start_i < end_j) {
					throw new functions.https.HttpsError('invalid-argument', 'Schedule Overlap.');
				}
				if (start_j < end_i && end_i < end_j) {
					throw new functions.https.HttpsError('invalid-argument', 'Schedule Overlap.');
				}

			}
		}
	}

	for (let x in req.data) {
		var whRef = db.doc(`stores/${storeRef.id}/working_hours/${x}`)
		await whRef.set({ type: "day", workingHours: req.data[x] })
	}
	return createSuccess();
})

export const createToken = functions.https.onCall(async (req, context) => {
	if (context.auth.uid == null) {
		throw new functions.https.HttpsError('unauthenticated', 'Not signed in.');
	}
	if (!req.store_id) {
		throw new functions.https.HttpsError('invalid-argument', 'No store specified.');
	}

	let storeRef = db.collection('stores').doc(req.store_id);
	let store_ = await storeRef.get()

	if (!store_.exists) {
		throw new functions.https.HttpsError('invalid-argument', 'Store does not exist.');
	}

	const date_ = moment.tz(req.date, store_.data().timezone)//.utcOffset(req.date)
	const store_time = moment().utc().tz(store_.data().timezone) //Local

	if (date_.isBefore(store_time, 'minutes') || date_.isAfter(store_time.add(TOKEN_GEN_DAYS_COUNT, 'days'))) {
		throw new functions.https.HttpsError('invalid-argument', 'Wrong Date.');
	}

	const whsRef = await db.doc('stores/' + req.store_id + '/working_hours/' + date_.format('dddd').toLowerCase()).get()
	if (!whsRef.exists) {
		throw new functions.https.HttpsError('unavailable', 'Date not available.');
	}
	const times_ = whsRef.data().workingHours

	const toksRef = db.collection('tokens').where('store', '==', req.store_id).where('date_str', '==', date_.format("YYYY-MM-DD"))
	const toks = await toksRef.get()

	const slot_ = date_.format("H:mm")

	var create = false;
	for (let x of times_) {
		if (x.slot_duration) {
			for (let t_ = timeToInt(x.start); t_ < timeToInt(x.end); t_ = t_ + x.slot_duration) {
				if (t_ == timeToInt(slot_)) {
					if (!x.tokens_per_slot) {
						create = true;
						break
					} else {
						var rem = x.tokens_per_slot
						for (let j of toks.docs) {
							const dat_ = j.data()
							if (dat_.slot_int >= t_ && dat_.slot_int < t_ + x.slot_duration) {
								rem = rem - 1
							}
						}
						if (rem <= 0) {
							throw new functions.https.HttpsError('unavailable', 'Slot full.');
						}
						create = true;
						break
					}
				}
			}
		}
	}

	if (create) {
		let userRef = await db.collection('users').where('uid', '==', context.auth.uid).get()
		if (userRef.empty) {
			throw new functions.https.HttpsError('unauthenticated', 'User ID not found.');
		}
		const user = userRef.docs[0].data();

		let uuid_ = uuidv4();
		let tokRef = db.collection('tokens').doc(uuid_);
		//console.log(req.slot)
		var tok_ = {}
		tok_["uuid"] = uuid_
		tok_["store_id"] = req.store_id
		tok_["store_name"] = store_.data().name
		tok_["user"] = context.auth.uid
		tok_["phoneNumber"] = user.phoneNumber
		tok_["date_str"] = date_.format("YYYY-MM-DD")
		tok_["slot_int"] = timeToInt(slot_)
		//var slot_obj = date_utc.set({ minute: 0, hour: 0 }).add(tok_["slot_int"], 'minutes')
		//console.log(slot_obj.toDate())
		tok_["slot_obj"] = date_.toDate() //.add(tok_["slot_int"], 'minutes')
		tok_["slot_str"] = slot_
		tok_["status"] = TokenStates.ACTIVE
		tok_["created_at"] = FieldValue.serverTimestamp();
		await tokRef.set(tok_, { merge: false })
		return createResponse("created", "Token Generated Successfully.", { id: uuid_ });
		//return createSuccess("Hey", tok_)
	} else {
		throw new functions.https.HttpsError('unavailable', 'Token unavailable.');
	}
})

export const acceptTokenIfAuth = functions.https.onCall(async (req, context) => {
	if (context.auth.uid == null) {
		throw new functions.https.HttpsError('unauthenticated', 'Not signed in.');
	}
	if (!req.token_id) {
		throw new functions.https.HttpsError('invalid-argument', 'No token specified.');
	}

	const tokRef = db.doc('tokens/' + req.token_id)//.get()
	const tok = await tokRef.get()
	if (!tok.exists || tok != TokenStates.ACTIVE) {
		throw new functions.https.HttpsError('unavailable', 'Token expired or unavailable.');
	}

	let userRef = await db.collection('users').where('uid', '==', context.auth.uid).get()
	if (userRef.empty) {
		throw new functions.https.HttpsError('unauthenticated', 'User ID not found.');
	}
	const user = userRef.docs[0].data();

	let empRef = await db.collection('stores/' + tok.data().store + '/employees').where('complete_phone', '==', user.phoneNumber)
	if (empRef.empty) {
		throw new functions.https.HttpsError('permission-denied', 'Not an employee of the store.');
	}
	await tokRef.update({ status: TokenStates.ACCEPTED }, { merge: true })
	return createSuccess("hey")
})

export const joinQueue = functions.https.onCall(async (req, context) => {
	if (context.auth.uid == null) {
		throw new functions.https.HttpsError('unauthenticated', 'Not signed in.');
	}
	if (!req.store_id) {
		throw new functions.https.HttpsError('invalid-argument', 'No store specified.');
	}

	let storeRef = await db.collection('stores').doc(req.store_id);
	let store_ = await storeRef.get()

	if (!store_.exists) {
		throw new functions.https.HttpsError('invalid-argument', 'Store does not exist.');
	}

	const store_time = moment().utc().tz(store_.data().timezone)


	const whsRef = await db.doc('stores/' + req.store_id + '/working_hours/' + store_time.format('dddd').toLowerCase()).get()
	if (!whsRef.exists) {
		throw new functions.https.HttpsError('unavailable', 'Date not available.');
	}
	const times_ = whsRef.data().workingHours

	const toksRef = db.collection('tokens').where('store', '==', req.store_id).where('date_str', '==', store_time.format("YYYY-MM-DD"))
	const toks = await toksRef.get()

	var slots_ = [];
	for (let x of times_) {
		if (x.slot_duration) {
			for (let t_ = timeToInt(x.start); t_ < timeToInt(x.end); t_ = t_ + x.slot_duration) {
				let obj_ = {
					time_int: t_,
					max: x.tokens_per_slot,
					remaining: x.tokens_per_slot,
				};
				if (!x.tokens_per_slot) {
					slots_.push(obj_)
				} else {
					for (let j of toks.docs) {
						const dat_ = j.data()
						if (t_ >= dat_.slot_int && t_ < dat_.slot_int + x.slot_duration) {
							obj_.remaining = obj_.remaining - 1
						}
					}
					if (obj_.remaining > 0) {
						slots_.push(obj_)
					}
				}
			}
		}
	}
	if (slots_.length == 0) {
		throw new functions.https.HttpsError('unavailable', 'No slot available.');
	}
	var slots = slots_ = slots_.sort((a, b) => { return a.time_int - b.time_int })
	const slot = { time: intToTime(slots[0].time_int), ...slots[0] }


	let userRef = await db.collection('users').where('uid', '==', context.auth.uid).get()
	if (userRef.empty) {
		throw new functions.https.HttpsError('unauthenticated', 'User ID not found.');
	}
	const user = userRef.docs[0].data();

	let uuid_ = uuidv4();
	let tokRef = await db.collection('tokens').doc(uuid_);

	var tok_ = {}
	tok_["uuid"] = uuid_
	tok_["store_id"] = req.store_id
	tok_["store_name"] = store_.data().name
	tok_["user"] = context.auth.uid
	tok_["phoneNumber"] = user.phoneNumber
	tok_["date_str"] = store_time.format("YYYY-MM-DD")
	tok_["slot_int"] = slot.time_int
	tok_["slot_obj"] = moment.tz(store_time.format("YYYY-MM-DD") + " " + slot.time, "YYYY-MM-DD H:mm", store_.data().timezone).toDate()
	tok_["slot_str"] = slot.time
	tok_["status"] = TokenStates.ACTIVE
	tok_["created_at"] = FieldValue.serverTimestamp();
	await tokRef.set(tok_, { merge: false })
	return createResponse("created", "Token Generated Successfully.", { id: uuid_ });
})
