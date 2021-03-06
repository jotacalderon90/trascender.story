app.controller("explainCtrl", function(trascender,$scope){
	
	var self = this;
	
	if(typeof user!="undefined"){
		this.user = user;
		this.user.setAdmin(["admin"]);
	}
	
	let i = {
		map: function(){
			return new trascender({
				start: async function(){
					
					await self.user.checkUser();
					
					let lat = -33.59875863395195;
					let lng = -70.7080078125;
					this.map = L.map("dvMap").setView([lat, lng],3);
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
					this.markers = [];
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
						this.map.setView([doc.LAT, doc.LNG],((doc.ZOOM)?doc.ZOOM:3), {animate: true, pan: {duration: 1 }});
					}
				},
				removeMarker: function(){
					try{
						if(this.marker!=undefined){
							this.map.removeLayer(this.marker);
						}
					}catch(e){
						
					}
				},
				removeMarkers: function(){
					for(let i=0;i<this.markers.length;i++){
						this.map.removeLayer(this.markers[i]);
					}
					this.markers = [];
				},
				addMarker: function(doc){
					if(doc && doc.LAT && doc.LNG){
						this.markers.push(L.marker([doc.LAT, doc.LNG]).addTo(this.map));
					}
				}
			});
		},
		collection: function(){
			return new trascender({
				increase: true,
				baseurl: "/api/story",
				months:  ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
				start: function(){
					
					$("#background,#loading").fadeIn();
					
					$("#dvGO").css("width","50%");
					$("#dvGO").css("left","50%");
					this.goSPLIT = true;
					
					$(document).keydown((e)=>{
						switch(e.keyCode){
							case 71:
								$("#dvGO").fadeToggle();//G
								break;
							case 76:
								$("#dvTimeline").fadeToggle();//L
								break;
							case 77:
								$("#dvMap").fadeToggle();//M
								break;
							case 80://P
								if(this.goSPLIT){
									$("#dvGO").css("width","100%");
									$("#dvGO").css("left","0%");
									this.goSPLIT = false;
								}else{
									$("#dvGO").css("width","50%");
									$("#dvGO").css("left","50%");
									this.goSPLIT = true;
								}
								break;
							case 83:
								$("#mdCog").modal("toggle");//S
								break;
							case 84:
								$("#mdTextarea").modal("toggle");//T
								break;
							/*
							case 123:
								alert("nos vemos de otra forma ;)");
								break;*/
							default:
								console.log(e.keyCode);
						}
					});
					
					this.query.tag = "";
					this.getTag();
					this.listTAG = [];
					this.started = false;
					let u = new URL(location.href);
					
					if(u.searchParams.get("show_tag")=="1"){
						this.show_tag = true;
					}
					
					if(u.searchParams.get("id")!=null){
						this.show_id = u.searchParams.get("id");
					}
					
					let t = u.searchParams.get("tag");
					if(t){
						this.query.tag = t;
						this.getTotal();
					}else{
						$("#background,#loading").fadeOut();
					}
					
					$('#mdCog').on('show.bs.modal', (e)=>{$('#dvTimeline').fadeOut();});
					$('#mdCog').on('hide.bs.modal', (e)=>{if(this.started){$('#dvTimeline').fadeIn();}});
					
					$('#mdTextarea').on('show.bs.modal', (e)=>{$('#dvTimeline').fadeOut();});
					$('#mdTextarea').on('hide.bs.modal', (e)=>{if(this.started){$('#dvTimeline').fadeIn();}});
					
					$('#mdGo').on('show.bs.modal', (e)=>{$('#dvTimeline').fadeOut();});
					$('#mdGo').on('hide.bs.modal', (e)=>{if(this.started){$('#dvTimeline').fadeIn();}});
					
					$('#mdTextarea').delegate('textarea', 'keydown', function(e) {
						var keyCode = e.keyCode || e.which;
						if (keyCode == 9) {
							e.preventDefault();
							var start = this.selectionStart;
							var end = this.selectionEnd;
							// set textarea value to: text before caret + tab + text after caret
							$(this).val($(this).val().substring(0, start) + "\t" + $(this).val().substring(end));
							// put caret at right position again
							this.selectionStart =
							this.selectionEnd = start + 1;
						}
					});
					
				},
				afterGetTag: function(){
					$( "#input_tag" ).autocomplete({source: this.tag, select: ( event, ui )=>{
						this.query.tag = ui.item.value;
					}});
				},
				beforeGetTotal: function(){
					this.index = -1;
					this.INDEXTODOC = 0;
					$("#mdCog").modal("hide");
					$("#background,#loading").fadeIn();
					this.started = true;
					return true;
				},
				afterGetTotal: async function(){
					let d = await this.getRESUME();
					this.coll = await this.service_collection({query:JSON.stringify({tag: this.query.tag}),options:JSON.stringify({sort: {year: 1, month: 1, day: 1, title: 1}})});
					this.coll = this.formatCollectionToClient(this.coll);
					
					if(d[0] == undefined && d[1] == undefined){
						$("#background,#loading").fadeOut();
						return;
					}
					let years = [];
					for(let i=d[0].year;i<d[1].year+100;i=i+100){
						let d = {};
						d.label = this.centuryFromYear(i);
						d.data = this.coll.filter((r)=>{return r.epoch == d.label});
						years.push(d);
					}
					$("#dvTimeline").animate({scrollTop: 0});
					this.years = years;
					
					if(!this.timeliner_started){
						$.timeliner({});
						this.timeliner_started = true;
						$(document).keydown((e)=>{
							switch(e.keyCode){
								case 37://left
									this.back();
									break;
								case 38://up
									this.back();
									break;
								case 39://right
									this.next();
									break;
								case 40://down
									this.next();
									break;
							}
						});
					}
					
					$("#dvTimeline").fadeIn(()=>{
						$("#background,#loading").fadeOut();
						$scope.$digest();
						if(this.show_id){
							this.preSELECT();
						}else{
							this.next();
						}
					});
				},
				preSELECT: async function(){
					await this.wait(1000);
					this.setDOC(this.coll.filter((r)=>{return r._id==this.show_id})[0]);
				},
				getRESUME: async function(){
					try{
						let f = await this.service_collection({query:JSON.stringify({tag: this.query.tag}),options:JSON.stringify({sort: {year: 1, month: 1, day: 1, title: 1}, limit: 1, skip: 0})});
						s=-1;
						let l = await this.service_collection({query:JSON.stringify({tag: this.query.tag}),options:JSON.stringify({sort: {year:-1, month:-1, day:-1, title:-1}, limit: 1, skip: 0})});
						return [f[0],l[0]]
					}catch(e){
						alert(e);
						console.log(e);
						return null;
					}
				},
				centuryFromYear: function(year){
					if(year==0){
						return "Año 0";
					}
					let r = null;
					if( isNaN(Number(year)) ){
						r = undefined;
					}else{
						r = Math.floor((year-1)/100) + 1;
						if(r<0){
							r = "Siglo " + this.romanize((r*-1)) + " (ac)";
						}else{
							r = "Siglo" + this.romanize(r);
						}
					}
					return r;
				},
				romanize: function(num) {
					if (!+num)
						return false;
					let digits = String(+num).split(""),
					key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM", "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC","","I","II","III","IV","V","VI","VII","VIII","IX"],
					roman = "",
					i = 3;
					while (i--)
						roman = (key[+digits.pop() + (i * 10)] || "") + roman;
					return Array(+digits.join("") + 1).join("M") + roman;
				},
				formatToClient: function(row){
					
					for(let i=0;i<row.tag.length;i++){
						if(this.listTAG.indexOf(row.tag[i])==-1){
							this.listTAG.push(row.tag[i]);
						}
					}
					
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
					row.epoch = this.centuryFromYear(row.year);
					row.INDEX = this.INDEXTODOC;
					this.INDEXTODOC++;
					return row;
				},
				back: function(){
					this.index--;
					if(!this.coll[this.index]){
						this.index = this.coll.length-1;
					}
					this.refresh();
				},
				next: function(){
					this.index++;
					if(!this.coll[this.index]){
						this.index = 0;
					}
					this.refresh();
				},
				setDOC: function(r){
					this.index = r.INDEX;
					this.refresh();
				},
				refresh: function(){
					this.moveTimeline(this.coll[this.index]);
					this.refreshCONCEPTUAL(this.index);
					if(this.show_tag){
						self.document.getFULL(this.coll.slice(0,this.index+1));
					}else{
						self.document.get(this.coll[this.index]._id);
					}
				},
				moveTimeline: function(d){
					let o = $($("#" + d._id)[0]);
					let s = o.offset().top;
					
					$("#dvTimeline").animate({scrollTop: s + $("#dvTimeline").scrollTop()}, 1000);
				},
				refreshCONCEPTUAL: function(index){
					let c = [];
					for(let i=0;i<=index;i++){
						c.push(this.coll[i]);
					}
					this.setConceptualMap(c);
				},
				setConceptualMap: function(coll){
					let tags = [];
					let key = 0;
					
					let inserted = function(tag,parent){
						let i = tags.filter((r)=>{
							let b = false;
							if(r.name==tag){
								if(parent!=null){
									if(r.parent==getParentId(parent)){
										b = true;
									}
								}else{
									b = true;
								}
							}
							return b;
						}).length;
						if(i==0){
							return false;
						}else{
							return true;
						}
					}
					
					let getParentId = function(tag){
						for(let i=tags.length-1;i>=0;i--){
							if(tags[i].name == tag){
								return tags[i].key;
							}
						}
					}
					
					let lastWhitKey = function(parent){
						for(let i=tags.length-1;i>=0;i--){
							if(tags[i].parent == parent && !tags[i].istag){
								return i;
							}
						}
						return -1;
					}
					
					let keybk = key;
					
					let contKEYS = 0;
					
					for(let i=0;i<coll.length;i++){
						let newkey = false;
						for(let x=0;x<coll[i].tag.length;x++){
							if(!inserted(coll[i].tag[x], null)){
								contKEYS++;
							}
							if(!inserted(coll[i].tag[x], ((x!=0)?coll[i].tag[x-1]:null))){
								let tag = {};
								tag.istag = true;
								tag.key = key;
								tag.name = coll[i].tag[x];
								if(x>0){
									tag.parent = getParentId(coll[i].tag[x-1]);
								}
								tags.push(tag);
								keybk = key;
								newkey = true;
								key++;
							}
						}
						let l = lastWhitKey(getParentId(coll[i].tag_main));
						if(l==-1){
							tags.push({key: key, name: coll[i].title, parent: keybk, isChild: true});
							key++;
						}else{
							tags[l].name += "\n" + coll[i].title;
						}
					}
					
					
					if(true){//toMAP
						let c = tags.filter((r)=>{return r.isChild});
						//set cantParent
						//set maxParent
						let maxParent = 0;
						for(let i=0;i<c.length;i++){
							let keyParent = c[i].parent;
							let findParent = true;
							let contParent = 0;
							
							while(findParent){
								let p = tags.filter((r)=>{return r.istag && r.key == keyParent})[0];
								contParent++;
								if(!isNaN(p.parent)){
									keyParent = p.parent;
								}else{
									findParent = false;
								}
							}
							c[i].contParent = contParent;
							if(contParent>maxParent){
								maxParent = contParent;
							}
						}
						//create new childs to beauty map
						for(let i=0;i<c.length;i++){
							c[i].parentToCreate = maxParent - c[i].contParent;
							
							let pSlave	= tags.filter((r)=>{return r.istag && r.key == c[i].parent})[0];
							let pMaster	= tags.filter((r)=>{return r.istag && r.key == pSlave.parent})[0];
							let hasHelper = tags.filter((r)=>{return r.isHelper && r.parent == pSlave.parent});
							if(hasHelper.length==1){
								//YA CREO HELPERS BUSCAR PADRE
								let sH = true;
								hasHelper = hasHelper[0];
								while(sH){
									let auxHelper = tags.filter((r)=>{return r.isHelper && r.parent == hasHelper.key});
									if(auxHelper.length==1){
										hasHelper = auxHelper[0];
									}else{
										sH = false;
									}
								}
								pSlave.parent = hasHelper.key;
							}else{
								let keyParent = pSlave.parent;
								let keyBackup = null;
								for(let x=0;x<c[i].parentToCreate;x++){
									tags.push({key: key, name: "", parent: keyParent, isHelper: true});
									keyParent = key;
									key++;
								}
								pSlave.parent = keyParent;
							}
						}
					}
					
					
					/*for(let i=0;i<tags.length;i++){
						let CHILD = coll.filter((r)=>{return r.tag_main == tags[i].name;});
						if(CHILD.length>0){
							CHILD = CHILD.map((r)=>{return r.title;}).join("\n");
							tags.push({key: key, name: CHILD, parent: i});
							key++;
						}
					}*/
					
					self.go.init(tags);
					
				}
			});
		},
		document: function(){
			return new trascender({
				baseurl: "/api/map",
				get: async function(id){
					try{
						let d = await this.service_collection({query: JSON.stringify({STORY: id}), options: "{}"});
						if(d.length==0){
							this.new();
							this.newdoc.STORY = id;
							self.map.removeMarker();
						}else if(d.length==1){
							this.edit(d[0]);
							$scope.$digest(function(){});
							self.map.setMarker(d[0]);
						}
					}catch(e){
						alert(e);
						console.log(e);
					}
				},
				get2: async function(id){
					try{
						let d = await this.service_collection({query: JSON.stringify({STORY: id}), options: "{}"});
						if(d.length==1){
							self.map.addMarker(d[0]);
						}
					}catch(e){
						console.log(e);
					}
				},
				afterChangeMode: function(action,doc){
					if(doc.AUDIO){
						document.getElementById("audio").src = doc.AUDIO;
						document.getElementById("audio").play();
					}
				},
				beforeCreate: function(){
					return confirm("Confirme creación");
				},
				beforeUpdate: function(){
					return confirm("Confirme edición");
				},
				afterCreate: function(){
					$('#mdForm').modal('hide');
				},
				afterUpdate: function(){
					$('#mdForm').modal('hide');
				},
				setLoc: function(){
					$('#mdForm').modal('hide');
					$('.leaflet-draw-draw-marker').fadeIn();
					$('.leaflet-draw-draw-marker').html("M");
				},
				getFULL: function(coll){
					self.map.removeMarkers();
					for(let i=0;i<coll.length;i++){
						this.get2(coll[i]._id);
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
						$(go.Diagram, "dvGO", // must be the ID or reference to div
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
					this.myDiagram.commandHandler.zoomToFit();
				},
				push: function(DATA){
					this.init(DATA);
				}
			});
		}
	}
	
	for(instance in instances.explain){
		this[instances.explain[instance]] = new i[instances.explain[instance]]();
	}
	
});