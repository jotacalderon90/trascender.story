"use strict";

const fs = require("fs");

let self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mongodb = a.mongodb;
}



self.prototype.valid = async function(doc){
	try{
		let d = new Date();
		
		if(doc.tag.length==0){
			throw("there must be at least one tag");
		}
		if(doc.font.length==0){
			throw("there must be at least one font");
		}
		if(doc.tag.indexOf(doc.tag_main)==-1){
			throw("main tag must be on tags");
		}
		if(doc.year>d.getFullYear()){
			throw("invalid date");
		}else if(doc.year == d.getFullYear() && doc.month > d.getMonth()+1){
			throw("invalid date");
		}else if(doc.year == d.getFullYear() && doc.month == d.getMonth()+1 && doc.day > d.getDate()){
			throw("invalid date");
		}
		console.log(doc);
		let v = await this.mongodb.count("story",{title: doc.title, _id: {$ne: String.valueOf(doc._id)}});
		if(v>0){
			throw("title already exist");
		}
		return true;
	}catch(e){
		throw(e);
	}
}



//@route('/story/new')
//@method(['get'])
self.prototype.render_other = async function(req,res,next){
	res.render("story/form");
}



//@route('/api/story')
//@method(['post'])
//@roles(['user'])
self.prototype.create = async function(req,res){
	try{
		await this.valid(req.body);
		req.body.author = req.user._id;
		req.body.created = new Date();
		await this.mongodb.insertOne("story",req.body);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/story/edit/:id')
//@method(['get'])
//@roles(['user'])
self.prototype.edit = async function(req,res){
	try{
		let row = await this.mongodb.findOne("story",req.params.id);
		if(String.valueOf(req.user._id) == String.valueOf(row.author)){
			res.render("story/form",{row: row});
		}else{
			throw("Error de propietario");
		}
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
	
}



//@route('/api/story/:id')
//@method(['put'])
//@roles(['user'])
self.prototype.update = async function(req,res){
	try{
		let row = await this.mongodb.findOne("story",req.params.id);
		if(String.valueOf(req.user._id) == String.valueOf(row.author)){
			req.body.updated = new Date();
			await this.valid(req.body);
			await this.mongodb.updateOne("story",req.params.id,req.body);
			res.send({data: true});
		}else{
			throw("Error de propietario");
		}
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/story/:id')
//@method(['delete'])
//@roles(['user'])
self.prototype.delete = async function(req,res){
	try{
		let row = await this.mongodb.findOne("story",req.params.id);
		if(String.valueOf(req.user._id) == String.valueOf(row.author)){
			await this.mongodb.deleteOne("story",req.params.id);
			res.send({data: true});
		}else{
			throw("Error de propietario");
		}
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/story/:id/image')
//@method(['post'])
//@roles(['user'])
self.prototype.upload = async function(req,res){
	try{
		let row = await this.mongodb.findOne("story",req.params.id);
		if(String.valueOf(req.user._id) == String.valueOf(row.author)){
			if (!req.files || Object.keys(req.files).length != 1) {
				throw("no file");
			}
			let d = "/media/img/story/" + req.params.id + ".jpg";
			await this.helper.upload_process(req.files.file, this.dir + "/app/frontend" + d);
			await this.mongodb.updateOne("story",req.params.id,{$set: {img: d, thumb: d}});
			
			res.redirect("/story/edit/" + req.params.id);
		}else{
			throw("Error de propietario");
		}
	}catch(e){
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



module.exports = self;