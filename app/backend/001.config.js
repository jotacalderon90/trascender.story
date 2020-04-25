"use strict";

const fs = require("fs");

let self = function(a){
	this.dir = a.dir;
}

self.prototype.get = function(req,res){
	let c = fs.readFileSync(this.dir + "/app.json","utf-8");
	res.render("config",{c: c});
}

self.prototype.put = function(req,res){
	try{
		let c = JSON.parse(req.body.content);
		fs.writeFileSync(this.dir + "/app.json", JSON.stringify(c,undefined,"\t"));
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e});
	}
}

self.prototype.delete = function(req,res){
	try{
		fs.unlinkSync(this.dir + "/app/backend/001.config.js");
		let c = fs.readFileSync(this.dir + "/app.json","utf-8");
		fs.writeFileSync(this.dir + "/app.json", c);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e});
	}
}



//@route('/config')
//@method(['get','put','delete'])
self.prototype.plain = function(req,res){
	this[req.method.toLowerCase()](req,res);
}



module.exports = self;