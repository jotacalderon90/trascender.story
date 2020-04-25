app.controller("directoryCtrl", function(trascender,$scope){
	
	self = this;
	
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
	
	var tr 	= new trascender({
		start: function(){
			this.service = {};
			this.service.read = ["GET", ":path:id"];
			this.service.folder_collection = ["GET", ":path:id/collection"];
			this.service.file_collection = ["GET", ":path:id/collection"];
			this.service.delete = ["DELETE", ":path:id"];
			this.service.update = ["PUT", ":path:id"];
			this.createServices();
		}
	});
	
	self.archive = null;
	self.textFiles = ["txt","html","css","js","json","csv"];
	self.mediaFiles = ["jpg","gif","png","ico","mp3","mp4","pdf"];
	
	self.close = function(){
		$("#directory .selected").removeClass("selected");
		self.archive = null;
	}
	
	self.clean = function(){
		$("#directory .selected").removeClass("selected");
		self.archive = null;
		$scope.$digest(function(){});
	}
	
	self.delete = async function(){
		try{
			let label = $(this.archive).find("label");
			if(confirm("Confirme eliminación del archivo")){
				let p;
				let i;
				if(self.isFile){
					p = label.attr("data-api-file");
					i = btoa(self.fullname);
				}else if(self.isFolder){
					p = label.attr("data-api-folder");
					i = (btoa(self.fullname.substr(1)));
				}
				
				await tr.service_delete({id: i, path: p});
				alert("Archivo eliminado correctamente");
				$(this.archive.parentNode).find("checkbox").click();
				location.reload();
			}
		}catch(e){
			console.log(e);
			alert(e);
		}
	}
	
	self.update = async function(){
		try{
			let label = $(this.archive).find("label");
			if(confirm("Confirme actualización del archivo")){
				let p;
				let i;
				if(self.isFile){
					p = label.attr("data-api-file");
					i = btoa(self.fullname);
				}
				
				await tr.service_update({id: i, path: p},JSON.stringify({content: self.fileContent}));
				alert("Archivo actualizado correctamente");
				$(this.archive.parentNode).find("checkbox").click();
				location.reload();
			}
		}catch(e){
			console.log(e);
			alert(e);
		}
	}
	
	let select = async function(li){
		try{
			let label = $(li).find("label");
			
			label.addClass("selected");
			self.archive = li;
					
			self.isFile = (label.attr("data-type")=="file")?true:false;
			self.isFolder = (label.attr("data-type")=="folder")?true:false;
		
			if(self.isFile){
				self.name = label.text();
				self.fullname = label.attr("data-api-path");
				self.fullname = decodeURIComponent(self.fullname);
				self.type = self.name.split(".");
				self.type = self.type[self.type.length-1];
				self.isTextFile = ["txt","html","css","js","json","csv"].indexOf(self.type)>-1;
				self.isMediaFile = ["jpg","gif","png","ico","mp3","mp4","pdf"].indexOf(self.type)>-1;
				self.fullnameDOWNLOAD = (label.attr("data-api-file") + btoa(self.fullname) + "/download");
				self.fullnameGET = (label.attr("data-api-file") + btoa(self.fullname) + "/getfile");
				if(self.isTextFile){
					self.fileContent = await tr.service_read({id: btoa(self.fullname), path: label.attr("data-api-file")});
				}else if(self.isMediaFile){
					let child = null;
					switch(self.type){
						case "jpg":
							child = document.createElement("img");
							child.setAttribute("src", self.fullnameGET);
							break;
						case "png":
							child = document.createElement("img");
							child.setAttribute("src", self.fullnameGET);
							break;
						case "gif":
							child = document.createElement("img");
							child.setAttribute("src", self.fullnameGET);
							break;
						case "ico":
							child = document.createElement("img");
							child.setAttribute("src", self.fullnameGET);
							break;
						case "mp3":
							child = document.createElement("audio");
							child.setAttribute("controls","");
							child.setAttribute("src", self.fullnameGET);
							break;
						case "mp4":
							child = document.createElement("video");
							child.setAttribute("controls","");
							child.setAttribute("src", self.fullnameGET);
							break;
						case "pdf":
							child = document.createElement("object");
							child.setAttribute("data",self.fullnameGET);
							child.setAttribute("type", "application/pdf");
							break;
					}
					$(".dv-visualcontent").html(child);
				}
			}else{
				self.name = label.text();
				self.fullname = label.attr("data-api-path");
				self.fullname = decodeURIComponent(self.fullname);
				
				let n = label.attr("data-api-path");
				n = label.attr("data-api-file") + btoa(n) + "/uploader";
				/*
				uploader.service = {};
				uploader.service.upload = ["POST", n];
				uploader.createServices();*/
				
				$("#fileupload").attr("action",n);
			}
		}catch(e){
			console.log(e);
		}
		$scope.$digest(function(){});
	}
	
	let createFolder = function(ulParent,id,directory){
		let li = document.createElement("li");
		
		let input = document.createElement("input");
		input.type = "checkbox";
		input.id = id;
		input.onchange = async function(){
			self.clean();
			if(this.checked){
				select(this.parentNode);
				let labelParent = $(this.parentNode).find("label");
				let coll;
				let newid = btoa(encodeURIComponent(labelParent.attr("data-api-path")));
				
				coll = await tr.service_folder_collection({id: newid, path: labelParent.attr("data-api-folder")});
				for(let i=0;i<coll.length;i++){
					createFolder(this.parentNode.lastChild,this.getAttribute("id") + "d" + i,{
						file: directory.file,
						folder:directory.folder,
						path: labelParent.attr("data-api-path") + coll[i] + "/",
						name: coll[i]
					});
				}
				
				
				coll = await tr.service_file_collection({id: newid, path: labelParent.attr("data-api-file")});
				for(let i=0;i<coll.length;i++){
					let label = document.createElement("label");
		
					label.setAttribute("data-api-file",labelParent.attr("data-api-file"));
					label.setAttribute("data-api-folder",labelParent.attr("data-api-folder"));
					label.setAttribute("data-api-path",labelParent.attr("data-api-path") + coll[i]);
					label.setAttribute("data-type","file");
		
					label.innerHTML = coll[i];
					
					let li = document.createElement("li");
					li.appendChild(label);
					li.onclick = function(){
						self.clean();
						select(this);
					}
					this.parentNode.lastChild.appendChild(li);
				}
			}else{
				this.parentNode.lastChild.innerHTML="";
			}
		};
		li.appendChild(input);

		let label = document.createElement("label");
		label.setAttribute("for", id);
		label.setAttribute("class", "folder");
		
		label.setAttribute("data-api-file",directory.file);
		label.setAttribute("data-api-folder",directory.folder);
		label.setAttribute("data-api-path", directory.path);
		label.setAttribute("data-type","folder");
		
		label.innerHTML = directory.name;
		li.appendChild(label);

		let ul = document.createElement("ul");
		ul.setAttribute("class","inside");
		li.appendChild(ul);
		
		ulParent.appendChild(li);
	}
	
	let d = document.getElementById("directory");
	
	createFolder(d,"d0",directory);
	
	var uploader = new trascender({
		start: function(){
			this.headerContentType = "multipart/form-data;boundary=---------------------------666",
			this.dropzone = document.getElementById("dropzone");
			this.dropzone.addEventListener("dragenter",this.dragenter);
			this.dropzone.addEventListener("dragleave",this.dragleave);
			this.dropzone.addEventListener("dragover",this.dragover);
			this.dropzone.addEventListener("drop",this.drop);
		},
		dragenter: function(ev){
			$(this).addClass("hover");
		},
		dragleave: function(ev){
			$(this).removeClass("hover");
		},
		dragover: function(ev){
			ev.preventDefault();
		},
		drop: function(ev){
			ev.preventDefault();
			$(this).removeClass("hover");
			uploader.inprocess = true;
			$scope.$digest(function(){});
			if (ev.dataTransfer.items) {
				for (var i = 0; i < ev.dataTransfer.items.length; i++) {
					if (ev.dataTransfer.items[i].kind === 'file') {
						var file = ev.dataTransfer.items[i].getAsFile();
						uploader.upload(file);
					}
				}
			} else {
				for (var i = 0; i < ev.dataTransfer.files.length; i++) {
					uploader.upload(ev.dataTransfer.files[i]);
				}
			} 
			
			if (ev.dataTransfer.items) {
				ev.dataTransfer.items.clear();
			} else {
				ev.dataTransfer.clearData();
			}
			uploader.inprocess = false;
			$scope.$digest(function(){});
		},
		upload: async function(file){
			try{
				await this.service_upload({},this.formatBody({file: file}));
				console.log(true);
			}catch(e){
				console.log(e);
			}
		}
	});

	
});