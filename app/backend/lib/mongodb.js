"use strict";

var mongodb	= require("mongodb");
var MongoClient	= mongodb.MongoClient;

var self = function(a){
	this.call = 0;
	this.started = new Date();
	if(a && a.config){
		this.config = a.config;
	}
}

self.prototype.start = async function(){
	await this.connect(this.config.database);
}

self.prototype.toId = function(id){
	return new mongodb.ObjectID(id);
}

self.prototype.connect = function(config){
	return new Promise((resolve,reject)=>{
		MongoClient.connect(config.url, {useUnifiedTopology: true}, (error, client)=>{
			if(error){
				return reject(error);
			}else{
				this.client = client;
				this.db = client.db(config.db);
				resolve();
			}
		});
	});
}

self.prototype.count = function(collection,query,options){
	this.call++;
	return new Promise((resolve,reject)=>{
		if(this.client && this.client.isConnected()){
			this.db.collection(collection).countDocuments(query, options, function(error, data){
				if(error){
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o: LLAMADAS: " + this.call + "\tstarted: " + this.started + "\tfinish: " + (new Date()));
		}
	});
}

self.prototype.find = function(collection,query,options){
	this.call++;
	return new Promise((resolve,reject)=>{
		if(this.client && this.client.isConnected()){
			this.db.collection(collection).find(query, options).toArray(function(error, data){
				if(error){
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o: LLAMADAS: " + this.call + "\tstarted: " + this.started + "\tfinish: " + (new Date()));
		}
	});
}

self.prototype.insertOne = function(collection,document){
	this.call++;
	return new Promise((resolve,reject)=>{
		if(this.client && this.client.isConnected()){
			this.db.collection(collection).insertOne(document, function(error, data) {
				if (error){
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o: LLAMADAS: " + this.call + "\tstarted: " + this.started + "\tfinish: " + (new Date()));
		}
	});
}

self.prototype.findOne = function(collection,id){
	this.call++;
	return new Promise((resolve,reject)=>{
		if(this.client && this.client.isConnected()){
			this.db.collection(collection).findOne({_id: new mongodb.ObjectID(id)}, function(error, data) {
				if (error){
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o: LLAMADAS: " + this.call + "\tstarted: " + this.started + "\tfinish: " + (new Date()));
		}
	});
}

self.prototype.updateOne = function(collection,id,document){
	this.call++;
	delete document._id;
	return new Promise((resolve,reject)=>{
		if(this.client && this.client.isConnected()){
			this.db.collection(collection).replaceOne({_id: new mongodb.ObjectID(id)}, document, function(error, data) {
				if (error){
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o: LLAMADAS: " + this.call + "\tstarted: " + this.started + "\tfinish: " + (new Date()));
		}
	});
}

self.prototype.deleteOne = function(collection,id){
	this.call++;
	return new Promise((resolve,reject)=>{
		if(this.client && this.client.isConnected()){
			this.db.collection(collection).deleteOne({_id: new mongodb.ObjectID(id)}, function(error, data) {
				if (error){
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o: LLAMADAS: " + this.call + "\tstarted: " + this.started + "\tfinish: " + (new Date()));
		}
	});
}

self.prototype.distinct = function(collection,field){
	this.call++;
	return new Promise((resolve,reject)=>{
		if(this.client && this.client.isConnected()){
			this.db.collection(collection).distinct(field, function(error, data) {
				if (error){
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o: LLAMADAS: " + this.call + "\tstarted: " + this.started + "\tfinish: " + (new Date()));
		}
	});
}

module.exports = self;