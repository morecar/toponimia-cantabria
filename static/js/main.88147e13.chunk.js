(this["webpackJsonptoponimia-cantabria"]=this["webpackJsonptoponimia-cantabria"]||[]).push([[0],{157:function(e,t){},281:function(e,t,s){},333:function(e,t){},335:function(e,t){},344:function(e,t){},346:function(e,t){},372:function(e,t){},373:function(e,t){},378:function(e,t){},380:function(e,t){},387:function(e,t){},406:function(e,t){},467:function(e,t,s){"use strict";s.r(t);var a={};s.r(a),s.d(a,"ast_pas",(function(){return le})),s.d(a,"esp",(function(){return ue})),s.d(a,"unlocalizable",(function(){return he}));var r=s(0),n=s.n(r),i=s(34),o=s.n(i),c=s(10),l=(s(281),s(61)),u=s(18),h="/busqueda",g="/palabra",p=s(24),d=s(25),f=s(51),b=s(50),j=s(273),y=s(482),O=s(483),_=s(117),x=s(481),m=s(479),v=s(16),k=s(110),w=s(2),T=function(e){Object(f.a)(s,e);var t=Object(b.a)(s);function s(e){var a;return Object(p.a)(this,s),(a=t.call(this,e)).searchBar=n.a.createRef(),a.state={tags:[],rawQuery:"",searchString:a.props.queryString},a}return Object(d.a)(s,[{key:"handleSearch",value:function(e){e.preventDefault();var t=this.searchBar.current.value.trim(),s=""===t?Object(u.f)("/"):Object(u.f)("/busqueda?q=:query",{query:encodeURIComponent(t)});this.props.history.push(s),this.props.onSearch(t)}},{key:"handleChange",value:function(e){if(this.props.config.searchAutocompleteUnderdoth){var t=RegExp(/h\.\S/,"i");this.searchBar.current.value=this.searchBar.current.value.replace(t,(function(e,t,s){return e.startsWith("h")?"\u1e25".concat(s[t+2]):"\u1e24".concat([t+2])}))}}},{key:"render",value:function(){return Object(w.jsx)(v.a,{inline:!0,onSubmit:this.handleSearch.bind(this),children:Object(w.jsx)(k.a,{type:"text",defaultValue:this.props.value,onChange:this.handleChange.bind(this),placeholder:this.props.regex?this.props.loc.get("search_regex_placeholder"):this.props.loc.get("search_placeholder"),ref:this.searchBar})})}}]),s}(r.Component),S=s(33),C=s(163),q=function(e){Object(f.a)(s,e);var t=Object(b.a)(s);function s(){return Object(p.a)(this,s),t.apply(this,arguments)}return Object(d.a)(s,[{key:"handleToggleChanged",value:function(e){"show-title-always"===e.target.id&&e.target.checked&&(this.props.config.resultsTitle="always"),"show-title-search"===e.target.id&&e.target.checked&&(this.props.config.resultsTitle="search"),"show-title-click"===e.target.id&&e.target.checked&&(this.props.config.resultsTitle="click"),"show-tags-always"===e.target.id&&e.target.checked&&(this.props.config.resultsTags="always"),"show-tags-search"===e.target.id&&e.target.checked&&(this.props.config.resultsTags="search"),"show-tags-click"===e.target.id&&e.target.checked&&(this.props.config.resultsTags="click"),"toggle-points"===e.target.id&&(this.props.config.resultsTypes=e.target.checked?Array.from(new Set(this.props.config.resultsTypes).add("point")):this.props.config.resultsTypes.filter((function(e){return"point"!==e}))),"toggle-lines"===e.target.id&&(this.props.config.resultsTypes=e.target.checked?Array.from(new Set(this.props.config.resultsTypes).add("line")):this.props.config.resultsTypes.filter((function(e){return"line"!==e}))),"toggle-polygons"===e.target.id&&(this.props.config.resultsTypes=e.target.checked?Array.from(new Set(this.props.config.resultsTypes).add("poly")):this.props.config.resultsTypes.filter((function(e){return"poly"!==e}))),"toggle-regex"===e.target.id&&(this.props.config.searchUseRegex=e.target.checked),"toggle-underdoth"===e.target.id&&(this.props.config.searchAutocompleteUnderdoth=e.target.checked),"toggle-tag-auto"===e.target.id&&(this.props.config.searchAutocompleteTags=e.target.checked),"toggle-tag-palette"===e.target.id&&(this.props.config.searchDisplayTagPalette=e.target.checked),this.props.onSettingsUpdated()}},{key:"render",value:function(){var e=this.props,t=(e.repository,e.searchBoxContents,e.onSettingsUpdated,Object(S.a)(e,["repository","searchBoxContents","onSettingsUpdated"]));return Object(w.jsx)(C.a,Object(c.a)(Object(c.a)({},t),{},{children:Object(w.jsx)(C.a.Content,{children:Object(w.jsxs)(v.a,{children:[Object(w.jsxs)(v.a.Group,{onChange:this.handleToggleChanged.bind(this),children:[Object(w.jsx)(v.a.Label,{children:Object(w.jsx)("b",{children:this.props.loc.get("show_title")})}),Object(w.jsxs)(r.Fragment,{children:[Object(w.jsx)(v.a.Check,{defaultChecked:"always"===this.props.config.resultsTitle,label:this.props.loc.get("toggle_always"),type:"radio",id:"show-title-always",name:"showTitle",disabled:!0}),Object(w.jsx)(v.a.Check,{defaultChecked:"search"===this.props.config.resultsTitle,label:this.props.loc.get("toggle_search"),type:"radio",id:"show-title-search",name:"showTitle",disabled:!0}),Object(w.jsx)(v.a.Check,{defaultChecked:"click"===this.props.config.resultsTitle,label:this.props.loc.get("toggle_click"),type:"radio",id:"show-title-click",name:"showTitle",disabled:!0})]})]}),Object(w.jsxs)(v.a.Group,{onChange:this.handleToggleChanged.bind(this),children:[Object(w.jsx)(v.a.Label,{children:Object(w.jsx)("b",{children:this.props.loc.get("show_tags")})}),Object(w.jsxs)(r.Fragment,{children:[Object(w.jsx)(v.a.Check,{defaultChecked:"always"===this.props.config.resultsTags,label:this.props.loc.get("toggle_always"),type:"radio",id:"show-tags-always",name:"showTags"}),Object(w.jsx)(v.a.Check,{defaultChecked:"search"===this.props.config.resultsTags,label:this.props.loc.get("toggle_search"),type:"radio",id:"show-tags-search",name:"showTags"}),Object(w.jsx)(v.a.Check,{defaultChecked:"click"===this.props.config.resultsTags,label:this.props.loc.get("toggle_click"),type:"radio",id:"show-tags-click",name:"showTags"})]})]}),Object(w.jsxs)(v.a.Group,{onChange:this.handleToggleChanged.bind(this),children:[Object(w.jsx)(v.a.Label,{children:Object(w.jsx)("b",{children:this.props.loc.get("result_class")})}),Object(w.jsxs)("div",{children:[Object(w.jsx)(v.a.Check,{inline:!0,defaultChecked:this.props.config.resultsTypes.includes("point"),label:this.props.loc.get("result_class_point"),type:"checkbox",id:"toggle-points"}),Object(w.jsx)(v.a.Check,{inline:!0,defaultChecked:this.props.config.resultsTypes.includes("line"),label:this.props.loc.get("result_class_line"),type:"checkbox",id:"toggle-lines",disabled:!0}),Object(w.jsx)(v.a.Check,{inline:!0,defaultChecked:this.props.config.resultsTypes.includes("poly"),label:this.props.loc.get("result_class_poly"),type:"checkbox",id:"toggle-polygons",disabled:!0})]})]}),Object(w.jsxs)(v.a.Group,{onChange:this.handleToggleChanged.bind(this),children:[Object(w.jsx)(v.a.Label,{children:Object(w.jsx)("b",{children:this.props.loc.get("settings_category_other")})}),Object(w.jsx)(v.a.Check,{defaultChecked:this.props.config.searchUseRegex,type:"switch",id:"toggle-regex",label:this.props.loc.get("toogle_search_regex")}),Object(w.jsx)(v.a.Check,{defaultChecked:this.props.config.searchAutocompleteUnderdoth,type:"switch",id:"toggle-underdoth",label:this.props.loc.get("toogle_detect_underdoth")}),Object(w.jsx)(v.a.Check,{defaultChecked:this.props.config.searchAutocompleteTags,type:"switch",id:"toggle-tag-auto",label:this.props.loc.get("toogle_search_tags_autocomplete"),disabled:!0}),Object(w.jsx)(v.a.Check,{defaultChecked:this.props.config.searchDisplayTagPalette,type:"switch",id:"toggle-tag-palette",label:this.props.loc.get("toogle_search_tags_palette"),disabled:!0})]})]})})}))}}]),s}(r.Component),L=s(476),R=s(484),I=s(477),B=s(478),A=s(474),U=s(475),P=s(473),F=s(271);function W(e){return Object(w.jsx)(P.a,{permanent:!0,direction:"bottom",offset:[-15,20],className:"tagsContainer",children:Object.keys(e.tags).map((function(t){return Object(w.jsxs)("span",{children:[Object(w.jsx)(F.a,{variant:"primary",children:z(e.tags[t])})," "]},t)}))})}function z(e){if(e.startsWith("etymology")){if(e.endsWith("celtic"))return"Et: Celta";if(e.endsWith("romance"))return"Et: Romanci"}if(e.startsWith("phonology")){if(e.endsWith("metaphony_u"))return"Metafun\xeda U";if(e.endsWith("aspirate_f"))return"F aspir\xe1u";if(e.endsWith("b_g"))return"Cambiu B > G";if(e.endsWith("lost_f"))return"F mudu"}return e.split(":").pop()}function E(e){return Object(w.jsxs)(A.a,{position:e.position,children:[Object(w.jsx)(U.a,{children:Object(w.jsx)(l.b,{to:Object(u.f)("/palabra?h=:hash",{hash:e.hash}),children:e.title})}),e.displayTags?Object(w.jsx)(W,{tags:e.tags}):null]})}var N=[43.19775063914452,-4.029390585676174],D="config",G={locale:"ast_pas",results_title:"never",results_tags:"search",results_types:["point"],search_use_regex:!0,search_autocomplete_underdoth:!0,search_autocomplete_tags:!1,search_display_tag_palette:!1};function M(e){return e.reduce((function(t,s){return[t[0]+s[0]/e.length,t[1]+s[1]/e.length]}),[0,0])}function J(e){var t={color:"black"};return Object(w.jsxs)(L.a,{center:N,zoom:10,scrollWheelZoom:!0,zoomControl:!1,dragging:!0,children:[Object(w.jsx)(R.a,{attribution:'\xa9 <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}),Object.keys(e.points).map((function(t){return Object(w.jsx)(E,Object(c.a)({displayTags:e.displayTags,position:e.points[t].coordinates[0]},e.points[t]),e.points[t].hash)})),Object.keys(e.polys).map((function(s){return Object(w.jsxs)("div",{children:[Object(w.jsx)(I.a,{pathOptions:t,positions:e.polys[s].coordinates}),Object(w.jsx)(E,Object(c.a)({displayTags:e.displayTags,position:M(e.polys[s].coordinates)},e.polys[s]),e.polys[s].hash)]},s)})),Object.keys(e.lines).map((function(s){return Object(w.jsxs)("div",{children:[Object(w.jsx)(B.a,{pathOptions:t,positions:e.lines[s].coordinates}),Object(w.jsx)(E,Object(c.a)({displayTags:e.displayTags,position:M(e.lines[s].coordinates)},e.lines[s]),e.lines[s].hash)]},s)}))]})}var Q=s(480);function X(e){var t=e.loc.getBatch(e.loc.availableLocales);return Object(w.jsx)(Q.a,{title:e.title,onClick:e.onLanguageChanged,alignRight:!0,children:t.map((function(e){return Object(w.jsx)(Q.a.Item,{id:e.key,children:e.value},e.key)}))})}var Z=function(e){Object(f.a)(s,e);var t=Object(b.a)(s);function s(e){var a;Object(p.a)(this,s),a=t.call(this,e);var r=function(e){if(!e.search)return{queryString:"",queryResults:e.repository.getFromQueryString("")};if(e.wordId){var t,s=null!==(t=e.repository.getFromId(e.wordId))&&void 0!==t?t:{queryString:"",queryResults:[]};return{queryString:s.title,queryResults:[s]}}return{queryString:e.queryString,queryResults:e.repository.getFromQueryString(e.queryString)}}(e),n=r.queryString,i=r.queryResults;return a.state={locale:a.props.loc.locale,queryString:n,queryResults:i,displayTags:"always"===e.config.resultsTags||"search"===e.config.resultsTags&&e.search,displayLines:e.config.resultsTypes.includes("line"),displayPolys:e.config.resultsTypes.includes("poly"),displayPoints:e.config.resultsTypes.includes("point"),useRegex:e.config.searchUseRegex},a}return Object(d.a)(s,[{key:"updateResults",value:function(e){this.setState({queryString:e,queryResults:this.props.repository.getFromQueryString(e,this.props.config.searchUseRegex),displayTags:"always"===this.props.config.resultsTags||!("search"!==this.props.config.resultsTags||!e)})}},{key:"handleSettingsUpdated",value:function(){this.setState({displayTags:"always"===this.props.config.resultsTags||"search"===this.props.config.resultsTags&&this.state.search,displayLines:this.props.config.resultsTypes.includes("line"),displayPolys:this.props.config.resultsTypes.includes("poly"),displayPoints:this.props.config.resultsTypes.includes("point"),useRegex:this.props.config.searchUseRegex})}},{key:"handleChangeLanguage",value:function(e){this.props.loc.availableLocales.includes(e.target.id)&&(this.props.loc.locale=e.target.id,this.setState({locale:e.target.id}))}},{key:"render",value:function(){var e=this.state.displayPoints?this.state.queryResults.filter((function(e){return"point"===e.type})):[],t=this.state.displayPolys?this.state.queryResults.filter((function(e){return"poly"===e.type})):[],s=this.state.displayLines?this.state.queryResults.filter((function(e){return"line"===e.type})):[];return Object(w.jsxs)(j.a,{children:[Object(w.jsxs)(y.a,{fixed:"top",bg:"dark",expand:"lg",variant:"dark",children:[Object(w.jsx)(y.a.Brand,{children:Object(w.jsx)("img",{src:"./unicorn.png",alt:this.props.loc.get("brand_alt")})}),Object(w.jsx)(y.a.Brand,{className:"main-brand",children:this.props.loc.get("brand_name")}),Object(w.jsx)(y.a.Toggle,{"aria-controls":"basic-navbar-nav"}),Object(w.jsxs)(y.a.Collapse,{id:"basic-navbar-nav",children:[Object(w.jsx)(O.a,{className:"mr-auto",children:Object(w.jsx)(T,Object(c.a)({onSearch:this.updateResults.bind(this),value:this.state.queryString,tags:this.props.repository.getAllTags(),regex:this.state.useRegex},this.props))}),Object(w.jsx)(X,Object(c.a)({onLanguageChanged:this.handleChangeLanguage.bind(this),title:this.props.loc.get(this.state.locale)},this.props)),Object(w.jsx)(_.a,{id:"settings",children:Object(w.jsx)(x.a,{trigger:"click",placement:"bottom",overlay:Object(w.jsx)(q,Object(c.a)({onSettingsUpdated:this.handleSettingsUpdated.bind(this)},this.props)),rootClose:!0,children:Object(w.jsx)(m.a,{style:{fontSize:"xx-large"}})})})]})]}),Object(w.jsx)(J,Object(c.a)({points:e,lines:s,polys:t,displayTags:this.state.displayTags},this.props))]})}}]),s}(r.Component);function H(e){var t,s,a=new URLSearchParams(Object(u.i)().search),r={wordId:null!==(t=a.get("h"))&&void 0!==t?t:void 0,queryString:null!==(s=a.get("q"))&&void 0!==s?s:""},n=Object(u.h)();return r.wordId||r.queryString?Object(w.jsx)(Z,Object(c.a)(Object(c.a)(Object(c.a)({repository:e.repository,search:"true"},r),e),{},{history:n})):Object(w.jsx)(u.a,{to:"/"})}var K=s(275),V=function(e){Object(f.a)(s,e);var t=Object(b.a)(s);function s(e){var a;return Object(p.a)(this,s),(a=t.call(this,e)).searchBoxRef=n.a.createRef(),a.state={newPoints:[]},a}return Object(d.a)(s,[{key:"registerLocation",value:function(e){this.setState({newPoints:[].concat(Object(K.a)(this.state.newPoints),[e])})}},{key:"render",value:function(){return Object(w.jsx)(j.a,{})}}]),s}(r.Component);function Y(e){var t,s={project:null!==(t=new URLSearchParams(Object(u.i)().search).get("p"))&&void 0!==t?t:void 0};return Object(w.jsx)(V,Object(c.a)(Object(c.a)({repository:e.repository,project:s},e),{},{history:Object(u.h)()}))}function $(e){var t=Object(u.h)();return Object(w.jsx)(Z,Object(c.a)(Object(c.a)({repository:e.repository},e),{},{search:"false",history:t}))}function ee(e){return Object(w.jsx)(l.a,{basename:"/toponimia-cantabria",children:Object(w.jsxs)(u.d,{children:[Object(w.jsx)(u.b,{exact:!0,path:"/",children:Object(w.jsx)($,Object(c.a)({},e))}),Object(w.jsx)(u.b,{path:"/nuivu",children:Object(w.jsx)(Y,Object(c.a)({},e))}),Object(w.jsx)(u.b,{path:h,children:Object(w.jsx)(H,Object(c.a)({},e))}),Object(w.jsx)(u.b,{path:g,children:Object(w.jsx)(H,Object(c.a)({},e))})]})})}var te=s(64),se=function(){function e(t){Object(p.a)(this,e),Object.entries(G).forEach((function(e){var s,a=Object(te.a)(e,2),r=a[0],n=a[1];return t[r]=null!==(s=t[r])&&void 0!==s?s:n})),this.config=t}return Object(d.a)(e,[{key:"writeToLocalStorage",value:function(){localStorage.setItem(D,JSON.stringify(this._config))}},{key:"config",set:function(e){this._config=e,this.writeToLocalStorage()}},{key:"locale",get:function(){return this._config.locale},set:function(e){this._config.locale=e,this.writeToLocalStorage()}},{key:"resultsTitle",get:function(){return this._config.results_title},set:function(e){this._config.results_title=e,this.writeToLocalStorage()}},{key:"resultsTags",get:function(){return this._config.results_tags},set:function(e){this._config.results_tags=e,this.writeToLocalStorage()}},{key:"resultsTypes",get:function(){return this._config.results_types},set:function(e){this._config.results_types=e,this.writeToLocalStorage()}},{key:"searchAutocompleteUnderdoth",get:function(){return this._config.search_autocomplete_underdoth},set:function(e){this._config.search_autocomplete_underdoth=e,this.writeToLocalStorage()}},{key:"searchAutocompleteTags",get:function(){return this._config.search_autocomplete_tags},set:function(e){this._config.search_autocomplete_tags=e,this.writeToLocalStorage()}},{key:"searchDisplayTagPalette",get:function(){return this._config.search_display_tag_palette},set:function(e){this._config.search_display_tag_palette=e,this.writeToLocalStorage()}},{key:"searchUseRegex",get:function(){return this._config.search_use_regex},set:function(e){this._config.search_use_regex=e,this.writeToLocalStorage()}}],[{key:"readFromLocalStorage",value:function(){var t;return new e(JSON.parse(null!==(t=localStorage.getItem(D))&&void 0!==t?t:"{}"))}}]),e}(),ae=s(15),re=s.n(ae),ne=s(95),ie=s(274),oe="A1",ce=function(){function e(){Object(p.a)(this,e)}return Object(d.a)(e,null,[{key:"load",value:function(){var e=Object(ne.a)(re.a.mark((function e(){var t,s;return re.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=this.connect(),e.next=3,t.loadInfo();case 3:return console.log("Spreadsheets: loaded document ".concat(t.title)),e.next=6,t.sheetsByTitle.INFO;case 6:return s=e.sent,e.next=9,s.loadCells("".concat(oe,":").concat(oe));case 9:return e.t0=s.getCellByA1(oe).value,e.next=12,t.sheetsByTitle.DB;case 12:return e.t1=e.sent,e.abrupt("return",{hash:e.t0,sheet:e.t1});case 14:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"connect",value:function(){var e=new ie.GoogleSpreadsheet("1Rd8TQOp2hSBOxhSeAaLeb_faICF2_oAv2-jtn2vgXrY");return e.useApiKey("AIzaSyBl_GJjcKmg4Lk0dWPLzGX6bXpT0vXW5R0"),e}}]),e}(),le={brand_alt:"Imagin de cabeza di unicurniu",search_placeholder:"Iscribi la tu b\xfasqueda\u2026",search_regex_placeholder:"B\xfasqueda con regexp\u2026",show_tags:"Mostrar etiquetas",show_title:"Mostrar top\xf3nimus",toggle_never:"Nunca",toggle_always:"Siempri",toggle_search:"In b\xfasquedas",toggle_click:"In cliquiandu",result_class:"Clas de result\xe1us",result_class_point:"Puntualis",result_class_line:"Linialis",result_class_poly:"Zonalis",toogle_detect_underdoth:"Detectar hachi supunti\xe1 (h.\u2192\u1e25)",settings_category_other:"Otrus",toogle_search_regex:"B\xfasqueda con regex",toogle_search_tags_autocomplete:"Autucompletar etiquetas",toogle_search_tags_palette:"Mostrar paleta etiquetas"},ue={brand_alt:"Imagen de cabeza de unicornio",search_placeholder:"Escribe tu b\xfasqueda\u2026",search_regex_placeholder:"B\xfasqueda con regexp\u2026",show_tags:"Mostrar etiquetas",show_title:"Mostrar top\xf3nimos",toggle_never:"Nunca",toggle_always:"Siempre",toggle_search:"En b\xfasquedas",toggle_click:"Al clicar",result_class:"Clase de resultados",result_class_point:"Puntuales",result_class_line:"Lineales",result_class_poly:"Zonales",settings_category_other:"Otros",toogle_search_regex:"B\xfasqueda con regex",toogle_detect_underdoth:"Detectar hache sopunteada (h.\u2192\u1e25)",toogle_search_tags_autocomplete:"Autocompletar etiquetas",toogle_search_tags_palette:"Mostrar paleta etiquetas"},he={brand_name:"L'Unicurniu",esp:"Castellano",ast_pas:"Pasiigu"},ge=function(){function e(t){Object(p.a)(this,e),this.locale=t}return Object(d.a)(e,[{key:"locale",get:function(){return this._locale},set:function(e){if(!Object.keys(a).includes(e))throw new Error("Unknown Locale");this._locale=e,this.repository=Object(c.a)(Object(c.a)({},he),a[e])}},{key:"availableLocales",get:function(){return Object.keys(a).filter((function(e){return"unlocalizable"!==e}))}},{key:"get",value:function(e){var t;return null!==(t=this.repository[e])&&void 0!==t?t:e}},{key:"getBatch",value:function(e){var t=this;return e.map((function(e){return{key:e,value:t.get(e)}}))}}],[{key:"createFromConfig",value:function(t){return new e(t.locale)}}]),e}(),pe=s(75),de=s.n(pe);function fe(){return(fe=Object(ne.a)(re.a.mark((function e(t){return re.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!Oe(t.hash)){e.next=3;break}return e.next=3,je(t.hash,t.sheet);case 3:return e.abrupt("return",be());case 4:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function be(){return new _e(JSON.parse(localStorage.getItem("localIndex")))}function je(e,t){return ye.apply(this,arguments)}function ye(){return(ye=Object(ne.a)(re.a.mark((function e(t,s){return re.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.abrupt("return",s.getRows().then((function(e){var s=e.map((function(e){return{hash:e.hash,title:e.name,type:e.type,coordinates:e.coordinates.trim().split(";").map((function(e){return e.trim().split(",").map(parseFloat)})),tags:e.tags.split(",")}}));localStorage.setItem("localIndex",JSON.stringify(s)),localStorage.setItem("localIndexHash",t),console.log("Database: updated to ".concat(t))})));case 1:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function Oe(e){var t=localStorage.getItem("localIndexHash"),s=e!==t;return console.log("Database: current is ".concat(t,", reload=").concat(s)),s}var _e=function(){function e(t){Object(p.a)(this,e),this.database=de()(t).orderBy(["title"])}return Object(d.a)(e,[{key:"getFromQueryString",value:function(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if(t){var s=RegExp(e,"i");return this.database.filter((function(e){return s.test(e.title)})).value()}return this.database.filter((function(t){return t.title.toLowerCase().includes(e.toLowerCase())}))}},{key:"getFromId",value:function(e){var t,s=this.database.filter((function(t){return t.hash===e})).value();return null!==(t=null===s||void 0===s?void 0:s[0])&&void 0!==t?t:void 0}},{key:"getAllTags",value:function(){var e=new Set;return this.database.map((function(e){return e.tags})).forEach((function(t){return e.add(t)})),Array.from(e)}}]),e}();ce.load().then((function(e){return fe.apply(this,arguments)}),be).then((function(e){var t=se.readFromLocalStorage(),s=ge.createFromConfig(t);o.a.render(Object(w.jsx)(ee,{config:t,repository:e,loc:s}),document.getElementById("root"))}))}},[[467,1,2]]]);
//# sourceMappingURL=main.88147e13.chunk.js.map