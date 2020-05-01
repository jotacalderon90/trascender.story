app.controller("storyCtrl", function(trascender,$scope){
	
	var self = this;
	
	if(typeof user!="undefined"){
		this.user = user;
		this.user.setAdmin(["admin"]);
	}
	trascender.prototype.romanize = function(num) {
		if (!+num)
			return false;
		var digits = String(+num).split(""),
			key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
				   "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
				   "","I","II","III","IV","V","VI","VII","VIII","IX"],
			roman = "",
			i = 3;
		while (i--)
			roman = (key[+digits.pop() + (i * 10)] || "") + roman;
		return Array(+digits.join("") + 1).join("M") + roman;
	}
	trascender.prototype.centuryFromYear = function(year){
		let r = null;
		if( isNaN(Number(year)) ){
			r = undefined;
		}else{
			r = Math.floor((year-1)/100) + 1;
			if(r<0){
				r = "Siglo " + this.romanize((r*-1)) + " (AC)";
			}else{
				r = "Siglo" + this.romanize(r);
			}
		}
		return r;
	}
	trascender.prototype.months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
	trascender.prototype.formatToClient = function(row){
		if(row.year<0){
			row.fecha = row.year.toString().replace("-","") + " (ac)";
			row.fechat = row.fecha;
		}else{
			if(isNaN(row.month) || row.month==0){
				row.fecha = moment([row.year,1,1], "YYYYMMDD").fromNow();
				row.fechat = "Alrededor del año " + row.year;
			}else{
				row.mes = row.month;
				if(isNaN(row.day) || row.day==0){
					row.fecha = moment([row.year,row.mes,1], "YYYYMMDD").fromNow();
					row.fechat = this.months[row.month-1] + " del año " + row.year;
				}else{
					row.dia = row.day;
					row.fecha = moment([row.year,row.mes,row.dia], "YYYYMMDD").fromNow();
					row.fechat = moment([row.year,row.mes-1,row.dia]).format("dddd, DD MMMM YYYY");
				}
			}
		}
		if(row.year>=1940 && row.year<1950){
			row.epoch = "década del 40'";
		}else if(row.year>=1950 && row.year<1960){
			row.epoch = "década del 50'";
		}else if(row.year>=1960 && row.year<1970){
			row.epoch = "década del 60'";
		}else if(row.year>=1970 && row.year<1980){
			row.epoch = "década del 70'";
		}else if(row.year>=1980 && row.year<1990){
			row.epoch = "década del 80'";
		}else if(row.year>=1990 && row.year<=2000){
			row.epoch = "década del 90'";
		}else{
			row.epoch = this.centuryFromYear(row.year);
		}
		
		return row;
	}
	trascender.prototype.setAdminAction = function(){
		if(user.isAdmin()){
			$(".list-tags").sortable({
				stop: (event, ui)=>{
					let p = $(event.target.children[0].parentNode);
					let id = $(p).attr("id").replace("ul_tag_","");
					this.tagChangeAfter(id);
				}
			});
		}
	}
	trascender.prototype.tagChangeAfter = function(id){
		let r = this.coll.filter((r)=>{return r._id==id})[0];
		r.tag = [];
		let li = ($("#ul_tag_" + id + " li"));
		for(let i=0;i<li.length;i++){
			r.tag.push(li[i].innerText);
		}
		self.documentUPDATETAG.select(r);
		self.documentUPDATETAG.update();
	}
	
	let i = {
		collection: function(){
			return new trascender({
				increase: true,
				baseurl: "/api/story",
				start: function(){
					var url = new URL(location.href);
					var s = url.searchParams.get("s");
					
					window.title = document.getElementsByTagName("title")[0].innerHTML.trim();
					this.query = (window.title!="Story")?{tag: window.title}:{};
					this.sorted = (s)?parseInt(s):-1;
					this.getAll = false;
					this.fulltext = "";
					this.getTotal();
					this.getTag();
					//$(window).scroll(()=>{this.scrolling()});	
				},
				beforeGetTotal: function(){
					this.getAll = false;
					this.obtained = 0;
					this.coll = [];
					
					if(this.fulltext.trim()!=""){
						this.query["$text"] = {"$search": this.fulltext};
					}
					
					return true;
				},
				afterGetTotal: function(){
					this.getCollection();
				},
				beforeGetCollection: function(){
					this.options.skip = this.obtained;
					this.options.sort = {year: this.sorted, month: this.sorted, day: this.sorted, title: this.sorted};
					return true;
				},
				afterGetCollection: function(){
					if(this.getAll){
						if(this.obtained < this.cant){
							this.getCollection();
						}else{
							$scope.$digest(function(){});
							this.setAdminAction();
						}
					}else{
						$scope.$digest(function(){});
						this.setAdminAction();
					}
					
					
					if(!this.timeliner_started){
						$.timeliner({});
						this.timeliner_started = true;
					}
				},
				getSortInfo: function(type){
					switch(type){
						case "label":
							return (this.sorted==-1)?"descendente":"ascendente";
						break;
						case "class":
							return (this.sorted==-1)?"desc":"asc";
						break;
					}
				},
				scrolling: function(){
					if(Math.round($(window).scrollTop() + $(window).height()) == Math.round($(document).height())) {
						if(!this.isLoading && this.obtained < this.cant){
							this.getCollection();
						}
					}
				}
			});
		},
		document: function(){
			return new trascender({
				baseurl: "api/story",
				default: function(){
					return {tag: [],font:[]};
				},
				start: function(){
					if(typeof _document != "undefined"){
						this.select(_document);
					}else{
						this.new();
					}
					this.getTag();
				},
				beforeCreate: function(doc){
					return confirm("Confirme creación del documento");
				},
				afterCreate: function(s,x){
					if(s){
						location.href = "/story";
					}else{
						alert(x.json.error);
						$scope.$digest(function(){});
					}
				},
				beforeUpdate: function(doc){
					return confirm("Confirme actualización del documento");
				},
				afterUpdate: function(s,x){
					if(s){
						location.reload();
					}else{
						alert(x.json.error);
						$scope.$digest(function(){});
					}
				},
				beforeDelete: function(){
					return confirm("Confirme eliminación del documento");
				},
				afterDelete: function(s,x){
					if(s){
						location.href = "/story";
					}else{
						alert(x.json.error);
						$scope.$digest(function(){});
					}
				},
				formatToServer: function(doc){
					delete doc["$$hashKey"];
					delete doc.tagbk;
					delete doc.fontgbk;
					return doc;
				},
				addTag: function(event){
					if(event.which === 13) {
						if(this.getDoc().tag.indexOf(this.getDoc().tagbk)==-1){
							this.getDoc().tag.push(this.getDoc().tagbk);
							this.getDoc().tagbk = "";
						}
					}
				},
				removeTag: function(i){
					this.getDoc().tag.splice(i,1);
				},
				addFont: function(event){
					if(event.which === 13) {
						if(this.getDoc().font.indexOf(this.getDoc().fontbk)==-1){
							this.getDoc().font.push(this.getDoc().fontbk);
							this.getDoc().fontbk = "";
						}
					}
				},
				removeFont: function(i){
					this.getDoc().font.splice(i,1);
				},
				afterGetTag: function(){
					$(".input_tag").autocomplete({source: this.tag, select: ( event, ui )=>{
						this.getDoc().tagbk = ui.item.value;
					}});
				},
				getPostImage: function(){
					return "/api/story/" + this.getDoc()._id + "/image";
				}
			});
		},
		resume: function(){
			return new trascender({
				increase: true,
				scrolling: true,
				baseurl: "/api/story",
				start: function(){
					let d = new Date();
					this.query = {day: d.getDate(),month: d.getMonth() + 1};
					this.options.sort = {year: -1, month: -1, day: -1, title: -1};
					this.getTotal();
				},
				beforeGetTotal: function(){
					this.obtained = 0;
					this.coll = [];
					return true;
				},
				afterGetTotal: function(){
					this.getCollection();
				},
				afterGetCollection: function(){
					if(this.obtained < this.cant){
						this.getCollection();
					}else{
						$scope.$digest(function(){});
						this.setAdminAction();
						$.timeliner({});
					}
				}
			});
		},
		timeline: function(){
			return new trascender({
				increase: true,
				scrolling: true,
				baseurl: "/api/story",
				start: function(){
					var url = new URL(location.href);
					this.urlTAG = url.searchParams.get("tag");
					$("#background,#loading").fadeIn();
					this.getTag();
				},
				afterGetTag: function(){
					$( "#input_tag" ).autocomplete({source: this.tag});
					if(this.urlTAG){
						$(".search").css("display","none");
						$(".page-header h1").html("línea de tiempo: " + this.urlTAG);
						
						this.query.tag = this.urlTAG;
						this.getTotal();
					}else{
						$("#background,#loading").fadeOut();
					}
				},
				beforeGetTotal: function(){
					$("#background,#loading").fadeIn();
					this.obtained = 0;
					this.coll = [];
					return true;
				},
				afterGetTotal: function(){
					this.getCollection();
				},
				beforeGetCollection: function(){
					$("#background,#loading").fadeIn();
					this.options.skip = this.obtained;
					this.options.sort = {year: 1, month: 1, day: 1, title: 1};
					return true;
				},
				afterGetCollection: function(){
					console.log(this.coll);
					$.timeliner({});
					$("#background,#loading").fadeOut();
					$scope.$digest(function(){});
				},
				getRandomColor: function() {
					var letters = '0123456789ABCDEF';
					var color = '#';
					for (var i = 0; i < 6; i++) {
						color += letters[Math.floor(Math.random() * 16)];
					}
					return color;
				}
			});
		},
		documentUPDATETAG: function(){
			return new trascender({
				baseurl: "api/story",
				formatToServer: function(doc){
					delete doc["$$hashKey"];
					delete doc.tagbk;
					delete doc.fontgbk;
					return doc;
				}
			});
		},
		map: function(){
			return new trascender({
				start: async function(){
					
					await self.user.checkUser();
					
					let lat = -33.59875863395195;
					let lng = -70.7080078125;
					this.map = L.map("map").setView([lat, lng],3);
					let mapLink = '<a href="http://www.esri.com/">Esri</a>';
					let wholink = 'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';	
					L.tileLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}g").addTo(this.map);	
					
					if(self.user.isAdmin()){
						let drawnItems = L.featureGroup().addTo(this.map);
						L.control.layers({}, { 'drawlayer': drawnItems }, { position: 'topleft', collapsed: false }).addTo(this.map);
						this.map.addControl(new L.Control.Draw({
							edit: {
								featureGroup: drawnItems,
								poly: {
									allowIntersection: false
								}
							},
							draw: {
								polygon: {
									allowIntersection: false,
									showArea: true
								}
							}
						}));
						this.map.on(L.Draw.Event.CREATED, (event)=>{this.onDragMarker(event);});
						
						$(".leaflet-control-layers-toggle,"+
						".leaflet-draw-draw-polyline,"+
						".leaflet-draw-draw-polygon,"+
						".leaflet-draw-draw-rectangle,"+
						".leaflet-draw-draw-circle,"+
						".leaflet-draw-draw-marker,"+
						".leaflet-draw-draw-circlemarker,"+
						".leaflet-draw-edit-edit,"+
						".leaflet-draw-edit-remove").css("display","none");
						
					}
					$(".leaflet-control-zoom").css("display","none");
					$(".leaflet-control-layers").css("display","none");
					
				},
				onDragMarker: function(event){
					let layer = event.layer;
					self.document.getDoc().CENTER = this.map.getCenter();
					self.document.getDoc().ZOOM = this.map.getZoom();
					self.document.getDoc().LNG = layer.toGeoJSON().geometry.coordinates[0];
					self.document.getDoc().LAT = layer.toGeoJSON().geometry.coordinates[1];
					$('#mdForm').modal('show');
					$scope.$digest(function(){});
				},
				setMarker: function(doc){
					this.removeMarker();
					if(doc && doc.LAT && doc.LNG){
						this.marker = L.marker([doc.LAT, doc.LNG]).addTo(this.map);
						this.map.setView([doc.LAT, doc.LNG],3/*((doc.zoom)?doc.zoom:2)*/, {animate: true, pan: {duration: 1 }});
					}
				},
				removeMarker: function(){
					try{
						if(this.marker!=undefined){
							this.map.removeLayer(this.marker);
						}
					}catch(e){
						
					}
				}
			});
		},
		go: function(){
			return new trascender({
				start: function(){
					this.textarea = "";
					$('#mdGo').on('shown.bs.modal', (e)=>{
						this.myDiagram.commandHandler.zoomToFit();
					});
					$("#txt_data").blur(()=>{
						this.init(this.getDATA(this.textarea));
					});
				},
				getDATA: function(STRING){
					let r = [];
					let c = STRING;
					c = c.split("\n");
					let parent;
					for(let i=0;i<c.length;i++){
						if(c[i].trim()!=""){
							let d = {};
							d.key = i;
							d.name = c[i].trim();
							d.name = (d.name.indexOf(",")==-1)?d.name:d.name.split(",").join("\n");
							
							let ct = c[i].split("\t").length-1;
							
							if(ct==0){
								parent = i;
							}else{
								d.parent = null;
								let p = 1;
								while(d.parent==null){
									let ct2 = c[i-p].split("\t").length-1;
									let anterior = r[r.length-p];
									if(ct>ct2){
										d.parent = anterior.key;
									}else{
										p++;
									}
								}
							}
							r.push(d);
						}
					}
					return r;
				},
				init: function(DATA,R) {
					try{
						var $ = go.GraphObject.make; // for conciseness in defining templates
						this.myDiagram =
						$(go.Diagram, "myDiagramDiv", // must be the ID or reference to div
								{
									"toolManager.hoverDelay": 100, // 100 milliseconds instead of the default 850
									allowCopy: false,
									layout: // create a TreeLayout for the family tree
										$(go.TreeLayout, {
											angle: 90,
											nodeSpacing: 10,
											layerSpacing: 40,
											layerStyle: go.TreeLayout.LayerUniform
										})
								});
					}catch(e){
						
					}
					// replace the default Node template in the nodeTemplateMap
					this.myDiagram.nodeTemplate =
						$(go.Node, "Auto", {
								deletable: false
							},
							new go.Binding("text", "name"),
							$(go.Shape, "Rectangle", {
									fill: "lightgray",
									stroke: null,
									strokeWidth: 0,
									stretch: go.GraphObject.Fill,
									alignment: go.Spot.Center
								},
								new go.Binding("fill", "gender", '#90CAF9')),
							$(go.TextBlock, {
									font: "700 12px Droid Serif, sans-serif",
									textAlign: "center",
									margin: 10,
									maxSize: new go.Size(80, NaN)
								},
								new go.Binding("text", "name"))
						);
					// define the Link template
					this.myDiagram.linkTemplate =
						$(go.Link, // the whole link panel
							{
								routing: go.Link.Orthogonal,
								corner: 5,
								selectable: false
							},
							$(go.Shape, {
								strokeWidth: 3,
								stroke: '#424242'
							})); // the gray link shape
					// create the model for the family tree
					this.myDiagram.model = new go.TreeModel(DATA);
				},
				push: function(DATA){
					this.init(DATA);
				}
			});
		}
	}
	
	for(instance in instances.story){
		this[instances.story[instance]] = new i[instances.story[instance]]();
	}
	
});
			
//reemplazar elemento de array
//db.story.updateMany({ tag: "Colonia" }, { $set: { "tag.$" : "Chile Colonial" } })
//agregar elemento al array
//db.story.updateMany({},{$push:{tag:"Chile"}})
//eliminar elemento de un array
//db.story.updateMany({},{$pull:{tag:"Chile"}})
//crear indice de texto
//db.story.ensureIndex({title:"text"})
//busqueda de texto con índice
//db.story.find({$text:{$search:"manuel"}})
//indice de todos
//db.story.ensureIndex({"$**": "text" })
//obtener elementos del array
//db.story.distinct("tag")