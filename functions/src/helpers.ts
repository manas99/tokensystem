interface Response {
	state: string;
	message?: string;
	data?: string;
}

export function genID(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

export function genSlug(text) {
	return text
		.replace(/[^\w ]+/g, '')
		.replace(/ +/g, '-');
}

export function tokenize(word) {
	const arr = word.toLowerCase().split('');
	//const searchableIndex = {};
	var tokens = [];
	let prev_ = '';
	for (const ch_ of arr) {
		const key = prev_ + ch_;
		tokens.push(key)
		//searchableIndex[key] = true
		prev_ = key;
	}
	return tokens
}

export function tokenizeString(str_) {
	const arr = str_.toLowerCase().split(' ');
	var tokens = [];
	for (let x of arr) {
		const toks_ = tokenize(x);
		tokens = tokens.concat(toks_)
	}
	return tokens
}

export function timeToInt(str_) {
	var _arr = str_.split(":")
	if (_arr.length > 1) {
		return parseInt(_arr[0]) * 60 + parseInt(_arr[1])
	}
	return null
}
export function intToTime(int_) {
	var ret_ = ""
	let hours_ = Math.floor(int_ / 60)
	if (hours_ < 10) {
		ret_ = ret_ + "0" + hours_.toString() + ":"
	} else {
		ret_ = ret_ + hours_.toString() + ":"
	}
	let min_ = int_ % 60;
	if (min_ < 10) {
		ret_ = ret_ + "0" + min_.toString()
	} else {
		ret_ = ret_ + min_.toString()
	}
	return ret_
}

export function createResponse(state = "", msg = "", data = {}) {
	var res_ = {
		state: state,
		message: msg,
		data: data
	} as Response;
	return res_
}

export function createError(msg = "", data = {}) {
	return createResponse("error", msg, data)
}

export function createSuccess(msg = "", data = {}) {
	return createResponse("synced", msg, data)
}
