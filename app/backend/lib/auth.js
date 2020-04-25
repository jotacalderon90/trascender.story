"use strict";

const jwt = require("jwt-simple");

let self = function(application){
	this.secret = application.config.properties.secret;
}

self.prototype.encode = function(user){
	let iat = new Date();
	let exp = new Date(iat.getFullYear(),iat.getMonth(),iat.getDate(),iat.getHours(), iat.getMinutes() + 60);
	return jwt.encode({
		sub: user._id,
		roles: user.roles,
		iat: iat,
		exp: exp
	},this.secret);
}

self.prototype.decode = function(token){
	try{
		let payload = jwt.decode(token,this.secret);
		if(new Date(payload.exp) <= new Date()){
			throw("expired");
		}
		return payload;
	}catch(e){
		this.error = e;
		return null;
	}
}

module.exports = self;