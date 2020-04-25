app.controller("wysiwygCtrl", function(trascender,$scope){
	
	var self = this;
	
	var encode = function(value){
		return btoa(encodeURIComponent(value));
	}
	
	let path = "/html/";
	
	/*directorio de archivos*/
	self.directory = new trascender({
		service: {
			total: 		["GET", "/api/file/public/" + btoa(path) + "/total"],
			collection: ["GET", "/api/file/public/" + btoa(path) + "/collection"],
			read: 		["GET", "/api/file/public/:id"],
			update: 	["PUT", "/api/file/public/:id"]
		},
		start: function(){
			this.service_upload = this.serviceCreate("POST","/api/file/public/:id/uploader");
			this.getCollection();
		},
		afterGetCollection: function(){
			$scope.$digest(function(){});
		},
		formatToServer: function(doc){
			if(self.dom.isCompleteHTML){
				doc.content =	"<!doctype html>\n";
				doc.content +=	"<html>\n";
				doc.content +=		"\t<head>\n";
				doc.content +=			"\t\t" + (codemirror_head.getDoc().getValue()).split("\n").join("\n\t\t") + "\n";
				doc.content +=		"\t</head>\n";
				doc.content +=		"\t<body>\n";
				doc.content +=			"\t\t" + (codemirror_body.getDoc().getValue()).split("\n").join("\n\t\t") + "\n";
				doc.content +=			"\t\t<!--<js>-->\n";
				doc.content +=			"\t\t" + (codemirror_js.getDoc().getValue()).split("\n").join("\n\t\t") + "\n";
				doc.content +=			"\t\t<!--</js>-->\n";
				doc.content +=		"\t</body>\n";
				doc.content +=	"</html>";
			}else{
				doc.content = (codemirror_body.getDoc().getValue()).split("\n").join("\n\t\t");
			}
			return doc;
		},
		afterChangeMode: function(action,doc){
			switch(action){
				case "read":
				this.doc_id = encode(path + doc);
				this.read(this.doc_id);
				break;
			}
		},
		afterRead: function(){
			this.doc = {
				id: this.doc_id,
				content: this.doc
			}
			this.process_onclick(true);
			self.dom.taken();
		},
		beforeUpdate: function(){
			this.process_onclick(false);
			this.idBK = this.doc.id;
			return true;
		},
		paramsToUpdate: function(){
			return {id: this.doc.id};
		},
		afterUpdate: function(){
			this.read(this.idBK);
		},
		process_onclick: function(remove){
			if(remove){
				this.doc.content = this.doc.content.split(" onclick=").join(" onclick-backup=");
			}else{
				this.doc.content = this.doc.content.split(" onclick-backup=").join(" onclick=");
			}
		},
		upload: function(type,src,index){
			try{
				var fd = new FormData();
				var files;
				
				let id="";
				let srcbk="";
				if(type=="elemento"){
					srcbk = self.node.data.doc.attributes[0].value;
					id = self.node.data.doc.attributes[0].value;
					id = encode(id);
					files = $('#file')[0].files[0];
				}else{
					srcbk = src;
					id = encode(src);
					files = $('#file' + index)[0].files[0];
				}
				
				fd.append('file',files);

				$.ajax({
					url: '/api/file/public/' + id + '/replace',
					type: 'POST',
					data: fd,
					contentType: false,
					processData: false,
					success: function(response){
						if(response && response.data){
							alert("Imagen subida correctamente");
							location.reload();
							/*if(type=="elemento"){
								self.node.data.doc.attributes[0].value = "";
								self.node.data.doc.attributes[0].value = srcbk + "?" + new Date().getTime();
							}else{
								self.contenteditor.coll[index].src = "";
								self.contenteditor.coll[index].src = srcbk + "?" + new Date().getTime();
							}
							$scope.$digest(function(){});*/
						}else{
							alert("Error al subir imagen: " + response.error);
						}
					},
				});
			}catch(e){
				alert("error: " + e);
				console.log(e);
			}
		}
	});
	
	/*plantillas de html*/
	self.html = new trascender({
		increase: true,
		baseurl: "/api/document/html",
		start: function(){
			//this.getTotal();
		},
		afterGetTotal: function(){
			this.getCollection();
		},
		formatToClient: function(doc){
			doc.value = doc.html;
			doc.label = doc.name;
			return doc;
		},
		afterGetCollection: function(){
			if(this.obtained<this.total){
				this.getCollection();
			}else{
				$("#inputHTML").autocomplete({source: this.coll});
			}
		}
	});
	
	self.dom = new trascender({
		taken: function(){
			if(self.directory.doc.content.trim()==""){
				self.directory.doc.content = this.default();
			}
			var head = "";
			var body = "";
			var js = "";
			if(self.directory.doc.content.indexOf("<head>")>-1 && self.directory.doc.content.indexOf("<body>")>-1){
				this.isCompleteHTML = true;
				head = extractIn(self.directory.doc.content,"<head>","</head>");
				body = extractIn(self.directory.doc.content,"<body>","</body>");
				js = extractIn(body,"<!--<js>-->","<!--</js>-->");
			}else{
				this.isCompleteHTML = false;
				body = self.directory.doc.content;
			}
			

			body = body.replace("<!--<js>-->" + js + "<!--</js>-->","");
			
			docincontext.id = self.directory.doc.id;
			docincontext.backup = self.directory.doc.content;
			docincontext.head = head;
			docincontext.body = body;
			docincontext.js = js;
			
			dragTreedom.ui.innerHTML = "";
			dragTreedom.hoverNode = dragTreedom.ui;
			dragTreedom.append(dragTreedom.process(body));
			dragTreedom.refresh(true);
		},
		inverse: function(){
			docincontext.body = codemirror_body.getDoc().getValue();
			
			dragTreedom.ui.innerHTML = "";
			dragTreedom.hoverNode = dragTreedom.ui;
			dragTreedom.append(dragTreedom.process(docincontext.body));
			dragTreedom.refresh(true);
			
			self.node.methods.save2();
			
			$("#mdHTML").modal("hide");
		},
		cleanSelected: function(){
			codemirror_body.getDoc().setValue(codemirror_body.getDoc().getValue().split("nodeSelected").join(""));
			this.inverse();
		},
		default: function(){
			var html = "<!doctype html>";
			html += "<html>";
			html += "	<head>";
			html += 		"<title>Hello world!</title>";
			html += 	"</head>";
			html += 	"<body>";
			html += 		"<h1>Hello world!</h1>";
			html += 		"<!--<js>--> <!--</js>-->";
			html += 	"</body>";
			html += "</html>";
			return html;
		}
	});

	self.node = {
		data: {
			doc: null,
			new: {attr: {name: "",value: ""}}
		},
		methods: {
			load: function(){
				if(adminNode.ngNode.getAttribute("data-iselement")!=null){
					self.node.data.doc = {
						type: "element",
						name: adminNode.ngNode.getAttribute("data-element"),
						attrs: JSON.parse(adminNode.ngNode.getAttribute("data-attrs"))
					}
				}else if(adminNode.ngNode.getAttribute("data-istextnode")!=null){
					self.node.data.doc = {
						type: "textnode",
						value: adminNode.ngNode.getAttribute("data-value")
					}
				}
			},
			load2: function(element){
				self.node.data.doc = element;
				$("#dvModal").modal("show");
				$scope.$digest(function(){});
				
			},
			removeAttr: function(name){
				self.node.data.doc.removeAttribute(name);
			},
			pushAttr: function(name,value){
				self.node.data.doc.setAttribute(name, value);
			},
			save2: function(){
				
				//elementUpdated = self.node.data.doc;
				
				self.node.data.doc = null;
				
				dragTreedom.ui.innerHTML = "";
				dragTreedom.hoverNode = dragTreedom.ui;
				dragTreedom.append(dragTreedom.process($("#visualcontent").html()));
				dragTreedom.refresh(true);
				
				self.directory.update();
				
				$('#dvModal').modal('hide');
				//elementUpdated = null;
			}/*,
			save: function(){
				if(self.node.data.doc==null){
					$('#dvModal').modal('hide');
					return false;
				}
				if(self.node.data.new.attr.name!="" || self.node.data.new.attr.value!=""){
					if(confirm("Atributo nuevo en desarrollo,\n¿desea editarlo?\nSi cancela perderá el atributo en desarrollo")){
						return false;
					}
				}
				if(self.node.data.doc.type=="element"){
					adminNode.ngNode.setAttribute("data-element", self.node.data.doc.name);
					adminNode.ngNode.setAttribute("data-attrs", JSON.stringify(self.node.data.doc.attrs));
				}else{
					adminNode.ngNode.setAttribute("data-value", self.node.data.doc.value);
				}
				self.node.data.doc = null;
				dragTreedom.refresh(true);

				$('#dvModal').modal('hide');
			}*/
		}
	}
	
	/*Editor de contenido*/
	self.contenteditor = new trascender({
		load: function(){
			this.coll = [];
			var inputs = $("#visualcontent").find("[data-tr]");
			for(var i=0;i<inputs.length;i++){
				let v = (inputs[i].getAttribute("data-dinamyc")=="textnode")?inputs[i].innerHTML:inputs[i].getAttribute(inputs[i].getAttribute("data-dinamyc"));
				let img = null;
				if(v.indexOf("media/img/simpleweb")>-1){
					img = extractIn(v,"background-image:url(",")");
				}
				
				this.coll.push({
					label: inputs[i].getAttribute("data-label"),
					dinamyc: inputs[i].getAttribute("data-dinamyc"),
					value: v,
					img: img
				})
			}
			//$scope.$digest(function(){});
			
			/*for(var i=0;i<inputs.length;i++){
				this.coll.push({
					input: (inputs[i].getAttribute("data-input"))?inputs[i].getAttribute("data-input"):"text",
					label: inputs[i].getAttribute("data-label"),
					name: "input" + makerandom(5),
					class: inputs[i].getAttribute("data-class"),
					dinamyc: inputs[i].getAttribute("data-dinamyc"),
					default: (inputs[i].getAttribute("data-dinamyc")=="textnode")?inputs[i].innerHTML:inputs[i].getAttribute(inputs[i].getAttribute("data-dinamyc"))
				});
			}
			createFORM(this.coll);*/
		},
		process: function(){
			for(var i=0;i<this.coll.length;i++){
				var label = this.coll[i].label;
				var dinamyc = this.coll[i].dinamyc;
				var value = this.coll[i].value;
				
				var input = $("#visualcontent").find("[data-label='" + label + "']");
				
				if(this.coll[i].class!=null && this.coll[i].class.indexOf("ckeditor")>-1){
					input[0].innerHTML = CKEDITOR.instances[$("[name='" + this.coll[i].name + "']").attr("id")].getData();
				}else{
					if(dinamyc=="textnode"){
						input[0].innerHTML = $("[name='" + this.coll[i].name + "']").val();
					}else{
						input[0].setAttribute(dinamyc,$("[name='" + this.coll[i].name + "']").val());
					}
				}
			}
			
			docincontext.body = $("#visualcontent").html()
			dragTreedom.ui.innerHTML = "";
			dragTreedom.hoverNode = dragTreedom.ui;
			dragTreedom.append(dragTreedom.process(docincontext.body));
			dragTreedom.refresh(true);
				
			$("#abrir-cerrar").click();
			$("#mdCONTENT").modal('hide');
			
			self.node.methods.save2();
		},
		process2: function(){
			for(var i=0;i<this.coll.length;i++){
				var label = this.coll[i].label;
				var dinamyc = this.coll[i].dinamyc;
				var value = this.coll[i].value;
				
				var input = $("#visualcontent").find("[data-label='" + label + "']");
				
				if(dinamyc=="textnode"){
					input[0].innerHTML = value;
				}else{
					input[0].setAttribute(dinamyc,value);
				}
			}
			
			docincontext.body = $("#visualcontent").html()
			dragTreedom.ui.innerHTML = "";
			dragTreedom.hoverNode = dragTreedom.ui;
			dragTreedom.append(dragTreedom.process(docincontext.body));
			dragTreedom.refresh(true);
				
			$("#abrir-cerrar").click();
			$("#mdCONTENT").modal('hide');
			
			self.node.methods.save2();
		}
	});
	
	$("#visualcontent").delegate("a","click",function(){
		return false;
	});
	
	$("#visualcontent").delegate("*","dblclick",function(){
		//elementUpdated = $(this)[0];
		self.node.methods.load2($(this)[0]);
		return false;
	});
	
	/*$("#visualcontent").delegate("*","dblclick",function(){
		$(this).attr("contenteditable","true");
		return false;
	});*/
	
	$("#visualcontent").delegate("*","blur",function(){
		if($(this)[0].hasAttribute("contenteditable")){
			$(this).removeAttr("contenteditable");
			
			dragTreedom.ui.innerHTML = "";
			dragTreedom.hoverNode = dragTreedom.ui;
			dragTreedom.append(dragTreedom.process($("#visualcontent").html()));
			dragTreedom.refresh(true);
			
			self.directory.update();
		}
		return false;
	});
	
	self.cargarContenido = function(){
		self.contenteditor.load();
		$("#abrir-cerrar").click();
	}
	
	self.cargarHTML = function(){
		$("#abrir-cerrar").click();
		
		$('#mdHTML').on('shown.bs.modal', function (e) {
			console.log(codemirror_head.getDoc().getValue());
			codemirror_head.getDoc().setValue(codemirror_head.getDoc().getValue());
			codemirror_body.getDoc().setValue(codemirror_body.getDoc().getValue());
			codemirror_js.getDoc().setValue(codemirror_js.getDoc().getValue());
			
			autoFormatSelection("codemirror_head");
			autoFormatSelection("codemirror_body");
			autoFormatSelection("codemirror_js");
		});
	}
});

var elementUpdated = null;

/*de aqui para abajo corresponde al constructor HTML*/

var extractIn = function(content,from,to){
	var index1 = content.indexOf(from) + from.length;
	content = content.substring(index1);
	var index2 = content.indexOf(to);
	return content.substring(0,index2);
}

/****************/
/*Codigo TREEDOM*/
/****************/

var dragTreedom = {
	ui: document.getElementById("uiTreedom"),
	start: function(event){
		event.target.style.opacity = '0.4';
		event.dataTransfer.setData('html',event.target.getAttribute("data-html"));
	},
	end: function(event){
		event.target.style.opacity = '';
		this.refresh(false);
	},
	hoverNode: null,
	over: function(event){
		event.preventDefault();
	},
	enter: function(event,isBox){
		try{
			event.preventDefault();
			if(!event.target.hasAttribute("data-iselement") && !($(event.target).hasClass("divider"))){return false;}
			dragTreedom.hoverNode = (isBox)?dragTreedom.ui:event.target;
			dragTreedom.overClass(dragTreedom.hoverNode);
		}catch(e){
			console.log(e);
			return false;
		}
	},
	drop: function(event){
		event.preventDefault();
		dragTreedom.append(dragTreedom.process(event.dataTransfer.getData("html")));
		dragTreedom.refresh(true);
	},
	overClass: function(hovernode){
		$(dragTreedom.ui).find("li").removeClass("nodeHover");
		if(hovernode!=undefined){$(hovernode).addClass("nodeHover");}
	},
	selectClass: function(hovernode){
		$(dragTreedom.ui).find("li").removeClass("nodeSelected");
		if(hovernode!=undefined){$(hovernode).addClass("nodeSelected");}
	},
	process: function(textHtml){
		var newdom = textHtml;
		newdom = convert.textToDom(newdom);
		newdom = convert.domToArr(newdom);
		newdom = convert.arrToTree(newdom);
		newdom = convert.textToDom(newdom);
		return newdom;
	},
	append: function(dom){
		for(var i=0;i<dom.length;i++){
			if($(dragTreedom.hoverNode).hasClass("divider")){
				dragTreedom.hoverNode.parentNode.insertBefore(dom[i],dragTreedom.hoverNode.nextSibling);
			}else{
				if(dragTreedom.hoverNode == dragTreedom.ui){
					dragTreedom.hoverNode.appendChild(dom[i]);
				}else{
					if(dragTreedom.hoverNode.getElementsByTagName("UL").length > 0){
						dragTreedom.hoverNode.getElementsByTagName("UL")[0].appendChild(dom[i]);
					}else{
						var ul = document.createElement("ul");
						ul.appendChild(dom[i]);
						dragTreedom.hoverNode.appendChild(ul);
					}
				}
			}
		}
	},
	refresh: function(complete){
		$(dragTreedom.ui).find("li").removeClass("nodeHover");
		dragTreedom.hoverNode = null;
		if(complete){
			//refrescar visual
			try{
				
				//obtengo nuevo html del body
				var newbody = convert.treeToDom(dragTreedom.ui.childNodes);

				//despliego head
				codemirror_head.getDoc().setValue(docincontext.head);
				
				//despliego body
				docincontext.body = newbody;
				codemirror_body.getDoc().setValue(newbody);
				
				//despliego javascript
				codemirror_js.getDoc().setValue(docincontext.js);

				autoFormatSelection("codemirror_head");
				autoFormatSelection("codemirror_body");
				autoFormatSelection("codemirror_js");

				//despliego visual
				$("#visualcontent").html(newbody);
				//$("#iframecontent").attr("src",self.directory.doc.id);

				//alert($("#"));

			}catch(e){
				alert("El renderizado tuvo problemas");
				alert(e);
				console.log(e);
			}
			
			//agregar eventos a li
			var list = dragTreedom.ui.getElementsByTagName("li");
			for(var i=0;i<list.length;i++){
				
				if(list[i].hasAttribute("data-iselement")){
					list[i].setAttribute("draggable",true);
					list[i].addEventListener("dragstart",dragTreedom.dragstart);
					list[i].addEventListener("dragend",dragTreedom.dragend);
					list[i].addEventListener("click",adminNode.click);
					list[i].addEventListener("dblclick",adminNode.dblclick);
					
				}else if(list[i].hasAttribute("data-istextnode")){
					list[i].addEventListener("click",adminNode.click);
					list[i].addEventListener("dblclick",adminNode.dblclick);
				}
			}
			//agregar evento al span
			var spans = dragTreedom.ui.getElementsByTagName("span");
			for(var i=0;i<spans.length;i++){
				spans[i].addEventListener("click",dragTreedom.noDisplay);
			}
		}
	},
	noDisplay: function(event){
		if(event.target.nextSibling!=null){
			var ul = $(event.target.nextSibling);
			if(ul.hasClass("noDisplay")){
				ul.removeClass("noDisplay");
				event.target.innerHTML = event.target.innerHTML.replace("+","");
			}else{
				ul.addClass("noDisplay")
				event.target.innerHTML = event.target.innerHTML + "+";
			}
		}
	},
	node: null,
	dragstart: function(event){
		if(!event.target.hasAttribute("data-iselement")){return false;}
		dragTreedom.node = event.target;
		event.dataTransfer.setData('html',convert.treeToDom([event.target]));
	},
	dragend: function(event){
		dragTreedom.selectClass();
		var parent = dragTreedom.node.parentNode;
		if(parent!=null){
			dragTreedom.refresh(true);
		}
	}
}

//javascript for convert objects
var convert = {
	textToDom: function(textHtml){
		return $(textHtml);
	},
	domToArr: function(dom){
		var arr = [];
		for(var i=0;i<dom.length;i++){
			var node = dom[i];
			if(node.nodeType==1){
				
				var attrs = [];
				for(var x=0;x<node.attributes.length;x++){attrs.push({name: node.attributes[x].name,value: node.attributes[x].value});}
				
				var children = [];
				if(node.childNodes){children = convert.domToArr(node.childNodes);}
				
				arr.push({type: "element", name: node.nodeName, attributes: attrs, children: children /*, textnode: textnode*/});
			}else if(node.nodeType==3){
				if(node.nodeValue.trim()!=""){
					arr.push({type: "textnode", value: node.nodeValue});
				}
			}else if(node.nodeType==8){
				arr.push({type: "comment", value: node.nodeValue});
			}
		}
		return arr;
	},
	arrToTree: function(arr){
		var str = "";
		for(var i=0;i<arr.length;i++){
			var obj = arr[i];
			
			str+= "<li class='list-group-item divider'></li>";
			
			if(obj.type=="element"){
				
				//parche:algunos atributos contienen codigo dentro, incluso ' y " por ende estos son reemplazados para su procesamiento
				var attrs = JSON.stringify(arr[i].attributes);
				if(attrs.indexOf("'")>-1){attrs = attrs.split("'").join("\\\"");}
				//parche:fin
				
				str+= "<li class='list-group-item' data-iselement data-element='"+arr[i].name+"' data-attrs='"+attrs+"'><span>" + arr[i].name + "</span>";
				if(arr[i].children && arr[i].children.length>0){
					str+="<ul>"+convert.arrToTree(arr[i].children)+"</ul>";
				}
				str+="</li>"
				
			}else if(obj.type=="textnode"){
				str+="<li class='list-group-item' data-istextnode data-value='"+obj.value+"'><span>TEXTNODE</span></li>";
			}else if(obj.type=="comment"){
				str+="<li class='list-group-item' data-iscomment data-value='"+obj.value+"'><span>COMENTARIO</span></li>";
			}
			
		}
		return str;
	},
	treeToDom: function(domArr){
		var html = "";

		for(var i=0;i<domArr.length;i++){
			var dom = domArr[i];
			if(dom.hasAttribute("data-iselement")){
				var varElement = dom.getAttribute("data-element").toLowerCase();
				var varAttrs = JSON.parse(dom.getAttribute("data-attrs"));
				
				var attrs = "";
				for(var x=0;x<varAttrs.length;x++){
					attrs += varAttrs[x].name + "=\""+varAttrs[x].value.split("\"").join("'")+"\" ";
				}
				
				var newhtml;
				if(["br","hr","img","input"].indexOf(varElement)>-1){
					newhtml = "<**element** **attrs**/>";
				}else{
					newhtml = "<**element** **attrs**>**children**" + "</**element**>";
				}
				
				newhtml = newhtml.split("**element**").join(varElement);
				newhtml = newhtml.replace("**attrs**", attrs);

				if(dom.getElementsByTagName("UL").length > 0){
					newhtml = newhtml.replace("**children**", convert.treeToDom(dom.childNodes[1].childNodes));
				}else{
					newhtml = newhtml.replace("**children**","");
				}
				
				html+= newhtml;
			}else if(dom.hasAttribute("data-istextnode")){
				html+= dom.getAttribute("data-value");
			}else if(dom.hasAttribute("data-iscomment")){
				html+= "<!--" + dom.getAttribute("data-value") + "-->";
			}
		}
		return html;
	}
}

//javascript for admin attributes and textnode
var adminNode = {
	node: null,
	ngNode: null,
	click: function(event){
		if(!event.target.hasAttribute("data-iselement") && !event.target.hasAttribute("data-istextnode")){return false;}
		adminNode.setSelected(false);
		adminNode.node = event.target;
		adminNode.setSelected(true);
		dragTreedom.selectClass(adminNode.node);
		dragTreedom.refresh(true);
	},
	dblclick: function(event){
		$("#dvModal").modal("show");
		adminNode.ngNode = event.target;
		adminNode.setSelected(false);
		adminNode.node = null;
	},
	remove: function(event){
		if(adminNode.node!=null){
			var parent = adminNode.node.parentNode;
			if(parent!=null){
				parent.removeChild(adminNode.node.previousSibling);
				parent.removeChild(adminNode.node);
				dragTreedom.refresh(true);
			}
		}
	},
	hasSelected: function(event){
		var attrs = JSON.parse(event.getAttribute("data-attrs"));
		var hasClass = false;
		for(var i=0;i<attrs.length;i++){
			if(attrs[i].name.toLowerCase()=="class"){
				if(attrs[i].value.indexOf(" nodeSelected")>-1){
					hasClass = true;
				}
			}
		}
		return hasClass;
	},
	setSelected: function(select){
		if(adminNode.node==null){return true;}
		if(!adminNode.node.hasAttribute("data-iselement")){return false;}
		var attrs = JSON.parse(adminNode.node.getAttribute("data-attrs"));
		var hasClass = false;
		for(var i=0;i<attrs.length;i++){
			if(attrs[i].name.toLowerCase()=="class"){
				hasClass = true;
				if(select){
					if(attrs[i].value.indexOf(" nodeSelected")==-1){
						attrs[i].value+= " nodeSelected";
					}
				}else{
					attrs[i].value = attrs[i].value.replace(" nodeSelected","");
				}
			}
		}
		if(!hasClass){attrs.push({name:"class", value: " nodeSelected"});}
		adminNode.node.setAttribute("data-attrs", JSON.stringify(attrs));
		return true;
	}
}

//javascript body keypress
document.getElementsByTagName("body")[0].addEventListener("keydown",function(event){
	//37 = flecha arriba,38 = flecha abajo,39 = flecha derecha,40 = flecha izquierda,13 = enter
	switch(event.keyCode){
		case 46:
			adminNode.remove(event);
			break;
	}
});

//datos del archivo modificado
var docincontext = {};

var codemirror_head = CodeMirror(document.getElementById("contenthead"), {mode: "text/html"});
var codemirror_body = CodeMirror(document.getElementById("contentbody"), {mode: "text/html"});
var codemirror_js = CodeMirror(document.getElementById("contentjs"), {mode: "text/html"});

function getSelectedRange(editor) {
	return { from: editor.getCursor(true), to: editor.getCursor(false) };
}

function autoFormatSelection(editor) {
	editor = eval(editor);
	CodeMirror.commands["selectAll"](editor);
	var range = getSelectedRange(editor);
	editor.autoFormatRange(range.from, range.to);
}

//genera random
var makerandom = function(length){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for( var i=0; i < length; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}



//crea formulario dinamico en base a form de parametros
var createFORM = function(form_object){
	var form_dinamyc = document.getElementById("form-dinamyc");
	form_dinamyc.innerHTML="";
	var idckeditor = [];
	for(var i=0;i<form_object.length;i++){
		//creacion del div contenedor;
		var div = document.createElement("div");
		div.setAttribute("class", "input-group input-group-sm");
		//creacion del span label
		var span = document.createElement("span");
		span.setAttribute("class", "input-group-addon");
		span.appendChild(document.createTextNode(form_object[i].label));
		//creación del input
		var input;
		switch(form_object[i].input){
			case undefined:
			case "text":
				input = document.createElement("input");
				input.setAttribute("type","text");
				input.setAttribute("class","form-control");
			break;
			case "number":
				input = document.createElement("input");
				input.setAttribute("type","number");
				input.setAttribute("class","form-control");
			break;
			case "checkbox":
				input = document.createElement("input");
				input.setAttribute("type","checkbox");
				input.setAttribute("class","form-control");
			break;
			case "textarea":
				input = document.createElement("textarea");
				input.setAttribute("class","form-control");
			break;
		}
		//agregar atributo name
		input.setAttribute("name",form_object[i].name);
		//concatenar atributo clase
		input.setAttribute("class",input.getAttribute("class") + " " + ((form_object[i].class)?form_object[i].class:""));
		//default valor
		input.setAttribute("value",form_object[i].default);
		//actualizar id ckeditor
		if(input.getAttribute("class").indexOf("ckeditor")>-1){
			var newckeditor = "ckeditor" + makerandom(5);
			idckeditor.push(newckeditor);
			input.setAttribute("id",newckeditor);
		}
		
		//agrego span e input al div
		div.appendChild(span);
		div.appendChild(input);
		form_dinamyc.appendChild(div);
		
	}
			
	//actualizacion de ckeditor
	if(idckeditor.length>0){
		try{
			for(var i=0;i<idckeditor.length;i++){
				CKEDITOR.replace(idckeditor[i]);
				CKEDITOR.instances[idckeditor[i]].setData($("#"+idckeditor[i]).attr("value"));
			}
		}catch(e){
			console.log(e);
		}
	}
}