(this["webpackJsonptoponimia-cantabria"]=this["webpackJsonptoponimia-cantabria"]||[]).push([[0],{142:function(e,t){},265:function(e,t,s){},318:function(e,t){},320:function(e,t){},329:function(e,t){},331:function(e,t){},357:function(e,t){},358:function(e,t){},363:function(e,t){},365:function(e,t){},372:function(e,t){},391:function(e,t){},452:function(e,t,s){"use strict";s.r(t);var a=s(0),n=s.n(a),r=s(32),i=s.n(r),o=s(9),c=(s(265),s(56)),l=s(17),u="/busqueda",h="/palabra",p={ast:"L'Unicurniu",esp:"L'Unicurniu"},g={ast:"Imagin de cabeza di unicurniu",esp:"Imagen de cabeza de unicornio"},d={ast:"Iscribi la tu b\xfasqueda\u2026",esp:"Escribe tu b\xfasqueda\u2026"},f={ast:"B\xfasqueda con regexp\u2026",esp:"B\xfasqueda con regexp\u2026"},b=s(23),j=s(24),y=s(47),O=s(46),x=s(256),v=s(148),m=s(468),k=s(258),T=s(467),w=s(465),S=s(15),C=s(101),_=s(1),q=function(e){Object(y.a)(s,e);var t=Object(O.a)(s);function s(e){var a;return Object(b.a)(this,s),(a=t.call(this,e)).searchBar=n.a.createRef(),a.state={tags:[],rawQuery:"",searchString:a.props.queryString},a}return Object(j.a)(s,[{key:"handleSearch",value:function(e){e.preventDefault();var t=this.searchBar.current.value.trim(),s=""===t?Object(l.f)(""):Object(l.f)("/busqueda?q=:query",{query:encodeURIComponent(t)});this.props.history.push(s),this.props.onSearch(t)}},{key:"handleChange",value:function(e){if(this.props.config.searchAutocompleteUnderdoth){var t=RegExp(/h\.\S/,"i");this.searchBar.current.value=this.searchBar.current.value.replace(t,(function(e,t,s){return e.startsWith("h")?"\u1e25".concat(s[t+2]):"\u1e24".concat([t+2])}))}}},{key:"render",value:function(){return Object(_.jsx)(S.a,{inline:!0,onSubmit:this.handleSearch.bind(this),children:Object(_.jsx)(C.a,{type:"text",defaultValue:this.props.value,onChange:this.handleChange.bind(this),placeholder:this.props.regex?f[this.props.config.language]:d[this.props.config.language],ref:this.searchBar})})}}]),s}(a.Component),R=s(31),L=s(149),I=function(e){Object(y.a)(s,e);var t=Object(O.a)(s);function s(){return Object(b.a)(this,s),t.apply(this,arguments)}return Object(j.a)(s,[{key:"handleToggleChanged",value:function(e){"show-title-always"===e.target.id&&e.target.checked&&(this.props.config.resultsTitle="always"),"show-title-search"===e.target.id&&e.target.checked&&(this.props.config.resultsTitle="search"),"show-title-never"===e.target.id&&e.target.checked&&(this.props.config.resultsTitle="never"),"show-tags-always"===e.target.id&&e.target.checked&&(this.props.config.resultsTags="always"),"show-tags-search"===e.target.id&&e.target.checked&&(this.props.config.resultsTags="search"),"show-tags-never"===e.target.id&&e.target.checked&&(this.props.config.resultsTags="never"),"toggle-points"===e.target.id&&(this.props.config.resultsTypes=e.target.checked?Array.from(new Set(this.props.config.resultsTypes).add("point")):this.props.config.resultsTypes.filter((function(e){return"point"!==e}))),"toggle-lines"===e.target.id&&(this.props.config.resultsTypes=e.target.checked?Array.from(new Set(this.props.config.resultsTypes).add("line")):this.props.config.resultsTypes.filter((function(e){return"line"!==e}))),"toggle-polygons"===e.target.id&&(this.props.config.resultsTypes=e.target.checked?Array.from(new Set(this.props.config.resultsTypes).add("poly")):this.props.config.resultsTypes.filter((function(e){return"poly"!==e}))),"toggle-regex"===e.target.id&&(this.props.config.searchUseRegex=e.target.checked),"toggle-underdoth"===e.target.id&&(this.props.config.searchAutocompleteUnderdoth=e.target.checked),"toggle-tag-auto"===e.target.id&&(this.props.config.searchAutocompleteTags=e.target.checked),"toggle-tag-palette"===e.target.id&&(this.props.config.searchDisplayTagPalette=e.target.checked),this.props.onSettingsUpdated()}},{key:"render",value:function(){var e=this.props,t=(e.repository,e.searchBoxContents,e.onSettingsUpdated,Object(R.a)(e,["repository","searchBoxContents","onSettingsUpdated"]));return Object(_.jsx)(L.a,Object(o.a)(Object(o.a)({},t),{},{children:Object(_.jsx)(L.a.Content,{children:Object(_.jsxs)(S.a,{children:[Object(_.jsxs)(S.a.Group,{onChange:this.handleToggleChanged.bind(this),children:[Object(_.jsx)(S.a.Label,{children:Object(_.jsx)("b",{children:"Veyer tup\xfanimu"})}),Object(_.jsxs)("div",{children:[Object(_.jsx)(S.a.Check,{defaultChecked:"always"===this.props.config.resultsTitle,label:"Siempri",type:"radio",id:"show-title-always",name:"showTitle",disabled:!0}),Object(_.jsx)(S.a.Check,{defaultChecked:"search"===this.props.config.resultsTitle,label:"In b\xfasquedas",type:"radio",id:"show-title-search",name:"showTitle",disabled:!0}),Object(_.jsx)(S.a.Check,{defaultChecked:"never"===this.props.config.resultsTitle,label:"In cliquiandu",type:"radio",id:"show-title-never",name:"showTitle",disabled:!0})]})]}),Object(_.jsxs)(S.a.Group,{onChange:this.handleToggleChanged.bind(this),children:[Object(_.jsx)(S.a.Label,{children:Object(_.jsx)("b",{children:"Veyer etiquetas"})}),Object(_.jsxs)("div",{children:[Object(_.jsx)(S.a.Check,{defaultChecked:"always"===this.props.config.resultsTags,label:"Siempri",type:"radio",id:"show-tags-always",name:"showTags"}),Object(_.jsx)(S.a.Check,{defaultChecked:"search"===this.props.config.resultsTags,label:"In b\xfasquedas",type:"radio",id:"show-tags-search",name:"showTags"}),Object(_.jsx)(S.a.Check,{defaultChecked:"never"===this.props.config.resultsTags,label:"Desactiv\xe1s",type:"radio",id:"show-tags-never",name:"showTags"})]})]}),Object(_.jsxs)(S.a.Group,{onChange:this.handleToggleChanged.bind(this),children:[Object(_.jsx)(S.a.Label,{children:Object(_.jsx)("b",{children:"Clas de result\xe1us"})}),Object(_.jsxs)("div",{children:[Object(_.jsx)(S.a.Check,{inline:!0,defaultChecked:this.props.config.resultsTypes.includes("point"),label:"Puntualis",type:"checkbox",id:"toggle-points"}),Object(_.jsx)(S.a.Check,{inline:!0,defaultChecked:this.props.config.resultsTypes.includes("line"),label:"Linialis",type:"checkbox",id:"toggle-lines",disabled:!0}),Object(_.jsx)(S.a.Check,{inline:!0,defaultChecked:this.props.config.resultsTypes.includes("poly"),label:"Zonalis",type:"checkbox",id:"toggle-polygons",disabled:!0})]})]}),Object(_.jsxs)(S.a.Group,{onChange:this.handleToggleChanged.bind(this),children:[Object(_.jsx)(S.a.Label,{children:Object(_.jsx)("b",{children:"Otrus"})}),Object(_.jsx)(S.a.Check,{defaultChecked:this.props.config.searchUseRegex,type:"switch",id:"toggle-regex",label:"B\xfasqueda con regex"}),Object(_.jsx)(S.a.Check,{defaultChecked:this.props.config.searchAutocompleteUnderdoth,type:"switch",id:"toggle-underdoth",label:"Detectar hachi supunti\xe1 (h.\u2192\u1e25)"}),Object(_.jsx)(S.a.Check,{defaultChecked:this.props.config.searchAutocompleteTags,type:"switch",id:"toggle-tag-auto",label:"Autucompletar etiquetas",disabled:!0}),Object(_.jsx)(S.a.Check,{defaultChecked:this.props.config.searchDisplayTagPalette,type:"switch",id:"toggle-tag-palette",label:"Veyer paleta etiquetas",disabled:!0})]})]})})}))}}]),s}(a.Component),B=s(462),P=s(469),U=s(463),A=s(464),F=s(460),W=s(461),z=s(459),D=s(255);function E(e){return Object(_.jsx)(z.a,{permanent:!0,direction:"bottom",offset:[-15,20],className:"tagsContainer",children:Object.keys(e.tags).map((function(t){return Object(_.jsxs)("span",{children:[Object(_.jsx)(D.a,{variant:"primary",children:G(e.tags[t])})," "]},t)}))})}function G(e){if(e.startsWith("etymology")){if(e.endsWith("celtic"))return"Et: Celta";if(e.endsWith("romance"))return"Et: Romanci"}if(e.startsWith("phonology")){if(e.endsWith("metaphony_u"))return"Metafun\xeda U";if(e.endsWith("aspirate_f"))return"F aspir\xe1u";if(e.endsWith("b_g"))return"Cambiu B > G";if(e.endsWith("lost_f"))return"F mudu"}return e.split(":").pop()}function N(e){return Object(_.jsxs)(F.a,{position:e.position,children:[Object(_.jsx)(W.a,{children:Object(_.jsx)(c.b,{to:Object(l.f)("/palabra?h=:hash",{hash:e.hash}),children:e.title})}),e.displayTags?Object(_.jsx)(E,{tags:e.tags}):null]})}var J=[43.19775063914452,-4.029390585676174];function Q(e){return e.reduce((function(t,s){return[t[0]+s[0]/e.length,t[1]+s[1]/e.length]}),[0,0])}function V(e){var t={color:"black"};return Object(_.jsxs)(B.a,{center:J,zoom:10,scrollWheelZoom:!0,zoomControl:!1,dragging:!0,children:[Object(_.jsx)(P.a,{attribution:'\xa9 <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}),Object.keys(e.points).map((function(t){return Object(_.jsx)(N,Object(o.a)({displayTags:e.displayTags,position:e.points[t].coordinates[0]},e.points[t]),e.points[t].hash)})),Object.keys(e.polys).map((function(s){return Object(_.jsxs)("div",{children:[Object(_.jsx)(U.a,{pathOptions:t,positions:e.polys[s].coordinates}),Object(_.jsx)(N,Object(o.a)({displayTags:e.displayTags,position:Q(e.polys[s].coordinates)},e.polys[s]),e.polys[s].hash)]},s)})),Object.keys(e.lines).map((function(s){return Object(_.jsxs)("div",{children:[Object(_.jsx)(A.a,{pathOptions:t,positions:e.lines[s].coordinates}),Object(_.jsx)(N,Object(o.a)({displayTags:e.displayTags,position:Q(e.lines[s].coordinates)},e.lines[s]),e.lines[s].hash)]},s)}))]})}var X=function(e){Object(y.a)(s,e);var t=Object(O.a)(s);function s(e){var a;Object(b.a)(this,s),a=t.call(this,e);var n=function(e){if(!e.search)return{queryString:"",queryResults:e.repository.getFromQueryString("")};if(e.wordId){var t,s=null!==(t=e.repository.getFromId(e.wordId))&&void 0!==t?t:{queryString:"",queryResults:[]};return{queryString:s.title,queryResults:[s]}}return{queryString:e.queryString,queryResults:e.repository.getFromQueryString(e.queryString)}}(e),r=n.queryString,i=n.queryResults;return a.state={queryString:r,queryResults:i,displayTags:"always"===e.config.resultsTags||"search"===e.config.resultsTags&&e.search,displayLines:e.config.resultsTypes.includes("line"),displayPolys:e.config.resultsTypes.includes("poly"),displayPoints:e.config.resultsTypes.includes("point"),useRegex:e.config.searchUseRegex},a}return Object(j.a)(s,[{key:"updateResults",value:function(e){this.setState({queryString:e,queryResults:this.props.repository.getFromQueryString(e,this.props.config.searchUseRegex),displayTags:"always"===this.props.config.resultsTags||!("search"!==this.props.config.resultsTags||!e)})}},{key:"handleSettingsUpdated",value:function(){this.setState({displayTags:"always"===this.props.config.resultsTags||"search"===this.props.config.resultsTags&&this.state.search,displayLines:this.props.config.resultsTypes.includes("line"),displayPolys:this.props.config.resultsTypes.includes("poly"),displayPoints:this.props.config.resultsTypes.includes("point"),useRegex:this.props.config.searchUseRegex})}},{key:"render",value:function(){var e=this.state.displayPoints?this.state.queryResults.filter((function(e){return"point"===e.type})):[],t=this.state.displayPolys?this.state.queryResults.filter((function(e){return"poly"===e.type})):[],s=this.state.displayLines?this.state.queryResults.filter((function(e){return"line"===e.type})):[];return Object(_.jsxs)(x.a,{children:[Object(_.jsxs)(v.a,{fixed:"top",bg:"dark",expand:"lg",variant:"dark",children:[Object(_.jsx)(v.a.Brand,{children:Object(_.jsx)("img",{src:"./unicorn.png",alt:g[this.props.config.language]})}),Object(_.jsx)(v.a.Brand,{className:"main-brand",children:p[this.props.config.language]}),Object(_.jsx)(v.a.Toggle,{"aria-controls":"basic-navbar-nav"}),Object(_.jsx)(v.a.Collapse,{id:"basic-navbar-nav",children:Object(_.jsxs)(m.a,{className:"mr-auto",children:[Object(_.jsx)(q,Object(o.a)({onSearch:this.updateResults.bind(this),value:this.state.queryString,tags:this.props.repository.getAllTags(),regex:this.state.useRegex},this.props)),Object(_.jsx)(k.a,{id:"settings",children:Object(_.jsx)(T.a,{trigger:"click",placement:"bottom",overlay:Object(_.jsx)(I,Object(o.a)({onSettingsUpdated:this.handleSettingsUpdated.bind(this)},this.props)),rootClose:!0,children:Object(_.jsx)(w.a,{style:{fontSize:"xx-large"}})})})]})})]}),Object(_.jsx)(V,Object(o.a)({points:e,lines:s,polys:t,displayTags:this.state.displayTags},this.props))]})}}]),s}(a.Component);function M(e){var t,s,a=new URLSearchParams(Object(l.i)().search),n={wordId:null!==(t=a.get("h"))&&void 0!==t?t:void 0,queryString:null!==(s=a.get("q"))&&void 0!==s?s:""},r=Object(l.h)();return n.wordId||n.queryString?Object(_.jsx)(X,Object(o.a)(Object(o.a)(Object(o.a)({repository:e.repository,search:"true"},n),e),{},{history:r})):Object(_.jsx)(l.a,{to:""})}var Z=s(260),H=s(466);function K(e){Object(H.a)({click:function(t){var s=t.latlng,a=s.lat,n=s.lng;e.onClick([a,n])}})}var Y=function(e){Object(y.a)(s,e);var t=Object(O.a)(s);function s(e){var a;return Object(b.a)(this,s),(a=t.call(this,e)).searchBoxRef=n.a.createRef(),a.state={newPoints:[]},a}return Object(j.a)(s,[{key:"registerLocation",value:function(e){this.setState({newPoints:[].concat(Object(Z.a)(this.state.newPoints),[e])})}},{key:"render",value:function(){var e=this.state.newPoints.length-1;return Object(_.jsxs)(x.a,{children:[Object(_.jsxs)(B.a,{center:J,zoom:10,scrollWheelZoom:!0,zoomControl:!1,dragging:!0,children:[Object(_.jsx)(P.a,{attribution:'\xa9 <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}),Object.keys(this.state.newPoints).map(function(e){return Object(_.jsx)(F.a,{position:this.state.newPoints[e]},e)}.bind(this)),Object(_.jsx)(A.a,{pathOptions:{color:"black"},positions:this.state.newPoints}),this.state.newPoints.length>2?Object(_.jsx)(A.a,{pathOptions:{color:"black",dashArray:"4"},positions:[this.state.newPoints[0],this.state.newPoints[e]]}):null,Object(_.jsx)(K,{onClick:this.registerLocation.bind(this)})]}),Object(_.jsx)(v.a,{fixed:"bottom",bg:"dark",expand:"lg",variant:"dark",children:Object(_.jsx)(v.a.Brand,{children:Object(_.jsx)("img",{src:"./unicorn.png",alt:"Icunu di unicurniu encabrit\xe1u"})})})]})}}]),s}(a.Component);function $(e){var t,s={project:null!==(t=new URLSearchParams(Object(l.i)().search).get("p"))&&void 0!==t?t:void 0};return Object(_.jsx)(Y,Object(o.a)(Object(o.a)({repository:e.repository,project:s},e),{},{history:Object(l.h)()}))}function ee(e){var t=Object(l.h)();return Object(_.jsx)(X,Object(o.a)(Object(o.a)({repository:e.repository},e),{},{search:"false",history:t}))}function te(e){return Object(_.jsx)(c.a,{basename:"/toponimia-cantabria",children:Object(_.jsxs)(l.d,{children:[Object(_.jsx)(l.b,{path:"/nuivu",children:Object(_.jsx)($,Object(o.a)({},e))}),Object(_.jsx)(l.b,{path:u,children:Object(_.jsx)(M,Object(o.a)({},e))}),Object(_.jsx)(l.b,{path:h,children:Object(_.jsx)(M,Object(o.a)({},e))}),Object(_.jsx)(l.b,{path:"",children:Object(_.jsx)(ee,Object(o.a)({},e))})]})})}var se=s(57),ae="config",ne={lang:"ast",results_title:"never",results_tags:"search",results_types:["point"],search_use_regex:!0,search_autocomplete_underdoth:!0,search_autocomplete_tags:!1,search_display_tag_palette:!1},re=function(){function e(t){Object(b.a)(this,e),Object.entries(ne).forEach((function(e){var s,a=Object(se.a)(e,2),n=a[0],r=a[1];return t[n]=null!==(s=t[n])&&void 0!==s?s:r})),this.config=t}return Object(j.a)(e,[{key:"writeToLocalStorage",value:function(){localStorage.setItem(ae,JSON.stringify(this._config))}},{key:"config",set:function(e){this._config=e,this.writeToLocalStorage()}},{key:"language",get:function(){return this._config.lang},set:function(e){this._config.lang=e,this.writeToLocalStorage()}},{key:"resultsTitle",get:function(){return this._config.results_title},set:function(e){this._config.results_title=e,this.writeToLocalStorage()}},{key:"resultsTags",get:function(){return this._config.results_tags},set:function(e){this._config.results_tags=e,this.writeToLocalStorage()}},{key:"resultsTypes",get:function(){return this._config.results_types},set:function(e){this._config.results_types=e,this.writeToLocalStorage()}},{key:"searchAutocompleteUnderdoth",get:function(){return this._config.search_autocomplete_underdoth},set:function(e){this._config.search_autocomplete_underdoth=e,this.writeToLocalStorage()}},{key:"searchAutocompleteTags",get:function(){return this._config.search_autocomplete_tags},set:function(e){this._config.search_autocomplete_tags=e,this.writeToLocalStorage()}},{key:"searchDisplayTagPalette",get:function(){return this._config.search_display_tag_palette},set:function(e){this._config.search_display_tag_palette=e,this.writeToLocalStorage()}},{key:"searchUseRegex",get:function(){return this._config.search_use_regex},set:function(e){this._config.search_use_regex=e,this.writeToLocalStorage()}}],[{key:"readFromLocalStorage",value:function(){var t;return new e(JSON.parse(null!==(t=localStorage.getItem(ae))&&void 0!==t?t:"{}"))}}]),e}(),ie=s(14),oe=s.n(ie),ce=s(86),le=s(259),ue="A1",he=function(){function e(){Object(b.a)(this,e)}return Object(j.a)(e,null,[{key:"load",value:function(){var e=Object(ce.a)(oe.a.mark((function e(){var t,s;return oe.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=this.connect(),e.next=3,t.loadInfo();case 3:return console.log("Spreadsheets: loaded document ".concat(t.title)),e.next=6,t.sheetsByTitle.INFO;case 6:return s=e.sent,e.next=9,s.loadCells("".concat(ue,":").concat(ue));case 9:return e.t0=s.getCellByA1(ue).value,e.next=12,t.sheetsByTitle.DB;case 12:return e.t1=e.sent,e.abrupt("return",{hash:e.t0,sheet:e.t1});case 14:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"connect",value:function(){var e=new le.GoogleSpreadsheet("1Rd8TQOp2hSBOxhSeAaLeb_faICF2_oAv2-jtn2vgXrY");return e.useApiKey("AIzaSyBl_GJjcKmg4Lk0dWPLzGX6bXpT0vXW5R0"),e}}]),e}(),pe=s(69),ge=s.n(pe);function de(){return(de=Object(ce.a)(oe.a.mark((function e(t){return oe.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!ye(t.hash)){e.next=3;break}return e.next=3,be(t.hash,t.sheet);case 3:return e.abrupt("return",fe());case 4:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function fe(){return new Oe(JSON.parse(localStorage.getItem("localIndex")))}function be(e,t){return je.apply(this,arguments)}function je(){return(je=Object(ce.a)(oe.a.mark((function e(t,s){return oe.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.abrupt("return",s.getRows().then((function(e){var s=e.map((function(e){return{hash:e.hash,title:e.name,type:e.type,coordinates:e.coordinates.trim().split(";").map((function(e){return e.trim().split(",").map(parseFloat)})),tags:e.tags.split(",")}}));localStorage.setItem("localIndex",JSON.stringify(s)),localStorage.setItem("localIndexHash",t),console.log("Database: updated to ".concat(t))})));case 1:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function ye(e){var t=localStorage.getItem("localIndexHash"),s=e!==t;return console.log("Database: current is ".concat(t,", reload=").concat(s)),s}var Oe=function(){function e(t){Object(b.a)(this,e),this.database=ge()(t).orderBy(["title"])}return Object(j.a)(e,[{key:"getFromQueryString",value:function(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if(t){var s=RegExp(e,"i");return this.database.filter((function(e){return s.test(e.title)})).value()}return this.database.filter((function(t){return t.title.toLowerCase().includes(e.toLowerCase())}))}},{key:"getFromId",value:function(e){var t,s=this.database.filter((function(t){return t.hash===e})).value();return null!==(t=null===s||void 0===s?void 0:s[0])&&void 0!==t?t:void 0}},{key:"getAllTags",value:function(){var e=new Set;return this.database.map((function(e){return e.tags})).forEach((function(t){return e.add(t)})),Array.from(e)}}]),e}();he.load().then((function(e){return de.apply(this,arguments)}),fe).then((function(e){var t=re.readFromLocalStorage();i.a.render(Object(_.jsx)(te,{config:t,repository:e}),document.getElementById("root"))}))}},[[452,1,2]]]);
//# sourceMappingURL=main.eeb7b181.chunk.js.map