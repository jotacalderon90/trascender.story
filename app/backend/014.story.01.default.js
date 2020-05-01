"use strict";

const fs = require("fs");

let self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mongodb = a.mongodb;
	this.sort = {year: -1, month: -1, day: -1, title: -1};
}



//@route('/story')
//@method(['get'])
self.prototype.renderCollection = async function(req,res){
	try{
		let title = "story";
		let options = {limit: 10, sort: this.sort};
		let data = await this.mongodb.find("story",{},options);
		res.render("story/collection",{
			title: title.charAt(0).toUpperCase() + title.slice(1),
			rows: data
		});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/story/categoria/:id')
//@method(['get'])
self.prototype.renderCollectionTag = async function(req,res){
	try{
		let title = req.params.id;
		let query = {tag: req.params.id};
		let options = {limit: 10, sort: this.sort};
		let data = await this.mongodb.find("story",query,options);
		res.render("story/collection",{
			title: title.charAt(0).toUpperCase() + title.slice(1),
			rows: data
		});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/story/:id')
//@method(['get'])
self.prototype.render_other = async function(req,res,next){
	let view = "story" + "/" + req.params.id;
	if(this.helper.exist(view)){
		res.render(view,{config: this.config});
	}else{
		return next();
	}
}



//@route('/api/story/total')
//@method(['get'])
self.prototype.total = async function(req,res){
	try{
		let query = JSON.parse(req.query.query);
		let total = await this.mongodb.count("story",query);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/story/collection')
//@method(['get'])
self.prototype.collection = async function(req,res){
	try{
		let query = JSON.parse(req.query.query);
		let options = JSON.parse(req.query.options);
		let data = await this.mongodb.find("story",query,options);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/story/tag/collection')
//@method(['get'])
self.prototype.tags = async function(req,res){
	try{
		let data = await this.mongodb.distinct("story","tag");
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/story/:id')
//@method(['get'])
self.prototype.read = async function(req,res){
	try{
		let row = await this.mongodb.findOne("story",req.params.id);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



module.exports = self;