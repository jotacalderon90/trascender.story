app.controller("databaseCtrl", function(trascender,$scope){
	
	if(typeof user!="undefined"){
		this.user = user;
		this.user.isAdmin = function(){
			if(this.doc && this.doc.roles && (this.doc.roles.indexOf("admin")>-1 || this.doc.roles.indexOf("ADM_FileDirectory")>-1)){
				return true;
			}else{
				return false;
			}
		}
	}
	
	var self = this;
	
	this.object = new trascender({
		increase: true,
		baseurl: "api/document/object",
		default: function(){
			return {content: {name: "", schema: {}}};
		},
		start: function(){
			this.options = {skip: this.obtained, limit: this.rowsByPage, projection: {name: 1, label: 1}};
			this.getTotal();
		},
		beforeGetTotal: function(){
			this.obtained = 0;
			this.coll = [];
			this.totalLog = this.addLog(this.message.total.on);
			return true;
		},
		afterGetTotal: function(){
			this.getCollection();
		},
		beforeGetCollection: function(){
			this.options = {skip: this.obtained, limit: this.rowsByPage, projection: {name: 1, label: 1}};
			this.collectionLog = this.addLog(this.message.collection.on);
			return true;
		},
		afterGetCollection: function(){
			if(this.obtained<this.cant){
				this.getCollection();
			}else{
				this.coll = this.SOABF(this.coll,"label");
				$scope.$digest(function(){});
			}
		},
		formatToClient: function(doc){
			doc.content = JSON.stringify(doc,undefined,"\t");
			doc.label = (doc.label)?doc.label:doc.name;
			doc.cols = 0;
			for(attr in doc.schema){
				doc.cols++;
			}
			return doc;
		},
		formatToServer: function(doc){
			doc = JSON.parse(doc.content);
			return doc;
		},
		afterChangeMode: function(action,doc){
			switch(action){
				case "new":
					doc.content = JSON.stringify(doc.content,undefined,"\t");
				break;
				case "read":
					doc = JSON.parse(doc);
					this.read(doc._id);
				break;
			}
		},
		beforeCreate: function(doc){
			if(confirm("Confirme creación del documento")){
				let c = this.coll.filter(function(r){
					return r.name.toLowerCase() == doc.name.toLowerCase();
				});
				if(c.length>0){
					alert("El objeto " + doc.name + " ya existe");
					$("#modalObject").modal("hide");
					return false;
				}
				this.createLog = this.addLog(this.message.create.on);
				return true;
			}
		},
		afterCreate: function(){
			$("#modalObject").modal("hide");
			this.getTotal();
		},
		afterRead: function(){
			$scope.$digest(function(){});
			self.document.load();
		},
		
		paramsToUpdate: function(){
			return {id: this.doc._id};
		},
		beforeUpdate: function(doc){
			if(confirm("Confirme actualización del documento")){
				let c = this.coll.filter(function(r){
					return r.name.toLowerCase() == doc.name.toLowerCase() && r._id!=doc._id;
				});
				if(c.length>0){
					alert("El objeto " + doc.name + " ya existe");
					$("#modalObject").modal("hide");
					return false;
				}
				this.updateLog = this.addLog(this.message.update.on);
				return true;
			}
		},
		afterUpdate: function(){
			$("#modalObject").modal("hide");
			this.getTotal();
		},
		paramsToDelete: function(){
			return {id: this.doc._id};
		},
		beforeDelete: function(){
			if(confirm("confirme eliminación del documento")){
				this.deleteLog = this.addLog(this.message.delete.on);
				return true;
			}
		},
		afterDelete: function(){
			$("#modalObject").modal("hide");
			this.getTotal();
		},
		getOutput: function(){
			return (!this.doc)?"":(this.doc.output)?this.doc.output:this.doc.schema;
		}
	});
	
	this.document = new trascender({
		baseurl: "api/document/:name",
		load: function(){
			
			//parche mas adelante mejorar
			if(self.object.doc.service){
				for(s in self.object.doc.service){
					console.log(s);
					console.log(self.object.doc.service[s].method);
					console.log(self.object.doc.service[s].uri);
					console.log(this["service_" + s]);
					console.log(this.serviceCreate);
					this["service_" + s] = this.serviceCreate(self.object.doc.service[s].method.toUpperCase(),self.object.doc.service[s].uri);
					console.log(this["service_" + s]);
				}
			}else{
				this.createServices();
			}
			
			this.wantFilter = false; 
			this.filter = {};
			for(attr in self.object.getOutput()){
				this.filter[attr] = "";
			}
			this.updateQuery();
			this.getTotal();
		},
		default: function(){
			return {_content: JSON.stringify(self.object.doc.schema, undefined, "\t")};
		},
		beforeGetTotal: function(){
			this.obtained = 0;
			this.coll = [];
			this.totalLog = this.addLog(this.message.total.on);
			return true;
		},
		updateQuery: function(){
			this.query = {};
			for(attr in this.filter){
				if(this.filter[attr].trim()!=""){
					this.query[attr] = {$regex: ".*" + this.filter[attr] + "*."};
				}
			}
		},
		paramsToGetTotal: function(){
			this.updateQuery();
			return {name: self.object.doc.name, query: JSON.stringify(this.query)};
		},
		afterGetTotal: function(){
			this.getCollection();
		},
		paramsToGetCollection: function(){
			this.updateQuery();
			return {name: self.object.doc.name, query: JSON.stringify(this.query), options: JSON.stringify({limit: this.rowsByPage, skip: this.obtained, sort: (self.object.doc.sort)?self.object.doc.sort:{}})};
		},
		afterGetCollection: function(){
			$scope.$digest(function(){});
		},
		afterChangeMode: function(action,doc){
			switch(action){
				case "read":
					this.read();
				break;
			}
		},
		paramsToCreate: function(){
			return {name: self.object.doc.name};
		},
		beforeCreate: function(doc){
			if(confirm("confirme " + ((this.isCreateMode())?"creación":"actualización") + " del documento")){
				this.createLog = this.addLog(this.message.create.on);
				return true;
			}
		},
		formatToServer: function(doc){
			return JSON.parse(doc._content);
		},
		formatToClient: function(doc){
			doc._content = JSON.stringify(this.doc,undefined,"\t");
			return doc;
		},
		afterCreate: function(){
			$("#modalDocument").modal("hide");
			this.getTotal();
		},
		afterRead: function(){
			$scope.$digest(function(){});
			$("#modalDocument").modal("show");
		},
		
		beforeDelete: function(){
			if(confirm("confirme eliminación del documento")){
				this.deleteLog = this.addLog(this.message.delete.on);
				return true;
			}
		},
		paramsToDelete: function(){
			return {name: self.object.doc.name, id: this.doc._id};
		},
		afterDelete: function(){
			$("#modalDocument").modal("hide");
			this.getTotal();
		},
		beforeUpdate: function(){
			if(confirm("confirme actualización del documento")){
				this.updateLog = this.addLog(this.message.update.on);
				return true;
			}
		},
		paramsToUpdate: function(){
			return {name: self.object.doc.name, id: this.doc._id};
		},
		afterUpdate: function(){
			$("#modalDocument").modal("hide");
			this.getTotal();
		},
		getALL: async function(){
			try{
				let coll = await this.service_collection({name: self.object.doc.name,query: "{}",options: "{}"});
				$("#modalAll").modal("show");
				this.all = JSON.stringify(coll);
			}catch(e){
				alert(e);
			}
		},
		upALL: async function(){
			try{
				let coll = JSON.parse(this.all);
				for(let i=0;i<coll.length;i++){
					delete coll[i]._id;
					await this.service_create({name: self.object.doc.name},JSON.stringify(coll[i]));
				}
				alert("documentos subidos");
				$("#modalAll").modal("hide");
				this.getTotal();
			}catch(e){
				alert(e);
			}
		}
	});

	this.import = new trascender({
		uri: "",
		service: {
			import: ["POST","/api/document/:name/import"]
		},
		import: async function(){
			try{
				await this.service_import({name: self.object.doc.name}, JSON.stringify({uri: this.uri}));
				alert("IMPORTACIÓN REALIDADA CORRECTAMENTE");
			}catch(e){
				console.log(e);
				alert("ERROR AL IMPORTAR: " + e.toString());
			}
		}
	});
});