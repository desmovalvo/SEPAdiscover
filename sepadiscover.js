// state variables
var deviceListSub = null;
var devicePropertiesSub = null;
var devicePropertiesSpuid = null
var deviceEventsSub = null;
var deviceEventsSpuid = null;
var deviceActionsSub = null;
var deviceActionsSpuid = null;
var devices = [];
var activeDevice = null;

// namespace
wot = "http://wot.arces.unibo.it/sepa#";

subText = {};
subText["things"] = "PREFIX wot:<http://wot.arces.unibo.it/sepa#> " +
    "PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
    "PREFIX td:<http://wot.arces.unibo.it/ontology/web_of_things#> "+
    "SELECT ?thingUri ?thingName " +
    "WHERE { " +
    "?thingUri rdf:type td:Thing . " +
    "?thingUri td:hasName ?thingName . " +
    "}";

subText["sensors"] = "PREFIX wot:<http://wot.arces.unibo.it/sepa#> " +
    "PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
    "PREFIX td:<http://wot.arces.unibo.it/ontology/web_of_things#> "+
    "SELECT ?thingUri ?thingName ?thingStatus " +
    "WHERE { " +
    "?thingUri rdf:type td:Thing . " +
    "?thingUri rdf:type td:Sensor . " +
    "?thingUri td:hasName ?thingName . " +
    "?thingUri wot:isDiscoverable ?thingStatus " +
    "}";

subText["actuators"] = "PREFIX wot:<http://wot.arces.unibo.it/sepa#> " +
    "PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
    "PREFIX td:<http://wot.arces.unibo.it/ontology/web_of_things#> "+
    "SELECT ?thingUri ?thingName ?thingStatus " +
    "WHERE { " +
    "?thingUri rdf:type td:Thing . " +
    "?thingUri rdf:type td:Actuator . " +
    "?thingUri td:hasName ?thingName . " +
    "?thingUri wot:isDiscoverable ?thingStatus " +
    "}";

subText["thingsProperties"] = "PREFIX wot:<http://wot.arces.unibo.it/sepa#> " +
    "PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
    "PREFIX td:<http://wot.arces.unibo.it/ontology/web_of_things#> " +
    "PREFIX dul:<http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#> " +
    "SELECT ?thing ?property ?propertyName ?propertyValue " +
    "WHERE { " +
    "?thing td:hasProperty ?property . " +
    "?property td:hasName ?propertyName . " +
    "?property td:hasValueType ?propertyValueType . " +	
    "?property dul:hasDataValue ?propertyValue " +
    "}";

subText["thingsActions"] = "PREFIX wot:<http://wot.arces.unibo.it/sepa#> " +
    "PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
    "PREFIX td:<http://wot.arces.unibo.it/ontology/web_of_things#> " +
    "PREFIX dul:<http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#> " +
    "SELECT ?thing ?action ?actionName " +
    "WHERE { " +
    "?thing td:hasAction ?action . " +
    "?action td:hasName ?actionName " +
    "}";


subText["thingsEvents"] = "PREFIX wot:<http://wot.arces.unibo.it/sepa#> " +
    "PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
    "PREFIX td:<http://wot.arces.unibo.it/ontology/web_of_things#> " +
    "PREFIX dul:<http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#> " +
    "SELECT ?thing ?event ?eventName ?instance ?timestamp ?value " +
    "WHERE { " +
    "?thing td:hasEvent ?event . " +
    "?event td:hasName ?eventName . " +
    "OPTIONAL { ?event wot:hasInstance ?instance . " +
    "?instance wot:hasTimeStamp ?timestamp . " +
    "?instance wot:isGeneratedBy ?thing . " +
    "OPTIONAL { ?instance td:hasOutput ?output ." +
    "?output dul:hasDataValue ?value }}" +
    "}";


function init(){

    // reset panels colours
    $("#devicesPanel").removeClass("panel-success");
    $("#devicesEventsPanel").removeClass("panel-success");
    $("#devicesPropPanel").removeClass("panel-success");    
    $("#devicesActionsPanel").removeClass("panel-success");

    // reset buttons colours
    $("#sub1button").removeClass("btn-success");
    $("#sub2button").removeClass("btn-success");
    $("#sub3button").removeClass("btn-success");

    // reset buttons colours
    $("#sub1button").removeClass("disabled");
    $("#sub2button").removeClass("disabled");
    $("#sub3button").removeClass("disabled");

    // re-enable subscribe buttons
    $("#sub1button").prop("disabled", false);
    $("#sub2button").prop("disabled", false);
    $("#sub3button").prop("disabled", false);

    // re-enable subscribe uri bar
    $("#subscribeURI").prop("disabled", false);
    $("#updateURI").prop("disabled", false);

    // clear the areas for subscription ids
    document.getElementById("spuid").innerHTML = "";
    document.getElementById("devicePropertiesSpuid").innerHTML = "";
    document.getElementById("deviceEventsSpuid").innerHTML = "";
    document.getElementById("deviceActionsSpuid").innerHTML = "";
};


function subscribeToDevices(subType){

    // clear previous data in table
    var table = document.getElementById("deviceTable");
    while(table.rows.length > 1) {
	table.deleteRow(-1);
    }
    
    // read form data
    subscUrl = document.getElementById("subscribeURI").value;

    ///////////////////////////////////////////////////
    //
    // First subscription: things
    //
    ///////////////////////////////////////////////////
    
    // subscription
    
    // 1 - open connection
    var ws = new WebSocket(subscUrl);
    
    // 2 - send subscription
    ws.onopen = function(){
	
	wsText = subText[subType];
	$("#subscribeURI").prop("disabled", true);
	$("#updateURI").prop("disabled", true);
	$("#devicesPanel").addClass("panel-success");
	$("#eventsPanel").addClass("panel-success");
	ws.send(JSON.stringify({"subscribe":wsText, "alias":subType}));

    };
    
    // 3 - handler for received messages
    ws.onmessage = function(event){
	
	// parse the message
	msg = JSON.parse(event.data);
	if (msg["ping"] === undefined){
	    console.log(msg);
	}

	// get and store the subscription ID
	if (msg["subscribed"] !== undefined){

	    // get the subid
	    subid = msg["subscribed"];

	    // store the subid into the html field
	    document.getElementById("spuid").innerHTML = subid;

	    // store the subscription into the global variable
	    deviceListSub = ws;

	    // change the colour of the buttons
	    if (subType === "things"){
		$("#sub1button").addClass("btn-success");			
	    } else if (subType === "sensors"){
		$("#sub2button").addClass("btn-success");
	    } else if (subType === "actuators"){
		$("#sub3button").addClass("btn-success");
	    } 
	    $("#sub3button").addClass("disabled");
	    $("#sub2button").addClass("disabled");
	    $("#sub1button").addClass("disabled");
	    $("#sub1button").prop("disabled", true);
	    $("#sub2button").prop("disabled", true);
	    $("#sub3button").prop("disabled", true);


	    // iterate over rows of the results
	    for (var i in msg["firstResults"]["results"]["bindings"]){

		// iterate over columns
		thingUri = msg["firstResults"]["results"]["bindings"][i]["thingUri"]["value"];
		thingName = msg["firstResults"]["results"]["bindings"][i]["thingName"]["value"];

		// get the table and check if it's a new device
		var table = document.getElementById("deviceTable");
		if (!document.getElementById(thingUri)){

		    // determine id for html elements
		    htmlThingId = thingUri.split("#")[1];
		    
		    var row = table.insertRow(-1);
		    row.id = thingUri;		
		    var f1 = row.insertCell(0);
		    var f2 = row.insertCell(1);
		    f1.innerHTML = thingUri.replace(wot, "wot:");
		    f2.innerHTML = thingName;
		}
            }

	    
	} else if (msg["results"] !== undefined){

	    // iterate over rows of the removed results
	    for (var i in msg["results"]["removedresults"]["bindings"]){

		// iterate over columns
		thingUri = msg["results"]["removedresults"]["bindings"][i]["thingUri"]["value"];

		// get the table and check if it's a new device
		var table = document.getElementById("deviceTable");
		if (document.getElementById(thingUri)){
		    document.getElementById(thingUri).remove();
		}
		
	    };
	    
	    // iterate over rows of the results
	    for (var i in msg["results"]["addedresults"]["bindings"]){

		// iterate over columns
		thingUri = msg["results"]["addedresults"]["bindings"][i]["thingUri"]["value"];
		thingName = msg["results"]["addedresults"]["bindings"][i]["thingName"]["value"];

		// get the table and check if it's a new device
		var table = document.getElementById("deviceTable");
		if (!document.getElementById(thingUri)){

		    // determine id for html elements
		    htmlThingId = thingUri.split("#")[1];
		    
		    var row = table.insertRow(-1);
		    row.id = thingUri;		
		    var f1 = row.insertCell(0);
		    var f2 = row.insertCell(1);
		    f1.innerHTML = thingUri.replace(wot, "wot:");
		    f2.innerHTML = thingName;
		}
		
	    }
	}
	
    };

    // 4 - handler for closed websocket
    ws.onclose = function(event){

	// reset the sub id area
	document.getElementById("spuid").innerHTML = "";

	// recolour interface
	$("#devicesPanel").removeClass("panel-success");
	$("#eventsPanel").removeClass("panel-success");
	$("#sub1button").removeClass("btn-success");
	$("#sub2button").removeClass("btn-success");
	$("#sub3button").removeClass("btn-success");

	// re-enable disabled fields
	$("#sub1button").removeClass("disabled");
	$("#sub2button").removeClass("disabled");
	$("#sub3button").removeClass("disabled");
	$("#sub1button").prop("disabled", false);
	$("#sub2button").prop("disabled", false);
	$("#sub3button").prop("disabled", false);
	$("#subscribeURI").prop("disabled", false);
	$("#updateURI").prop("disabled", false);
	
    }; 

    ///////////////////////////////////////////////////
    //
    // Second subscription: things properties
    //
    ///////////////////////////////////////////////////

    // 1 - open connection
    var ws2 = new WebSocket(subscUrl);
    
    // 2 - send subscription
    ws2.onopen = function(){
    	ws2.send(JSON.stringify({"subscribe":subText["thingsProperties"], "alias":"properties"}));
    };
    
    // 3 - handler for received messages
    ws2.onmessage = function(event){
	
    	// parse the message
    	msg = JSON.parse(event.data);
	if (msg["ping"] === undefined){
	    console.log(msg);
	}

    	// store the subscription ID
    	if (msg["subscribed"] !== undefined){

    	    // check if the confirm is for the properties subscription
    	    if (msg["alias"] === "properties"){
		
    		// get the subid
    		subid = msg["subscribed"];
		
    		// store the subid in the html field
    		document.getElementById("devicePropertiesSpuid").innerHTML = subid;

    		// store the subid
    		devicePropertiesSpuid = subid;

    		// store the websocket
    		devicePropertiesSub = ws2;

    		// colour the panel
    		$("#devicePropPanel").addClass("panel-success");

		// iterate over rows of the results
    		for (var i in msg["firstResults"]["results"]["bindings"]){

    		    // iterate over columns
    		    tUri = msg["firstResults"]["results"]["bindings"][i]["thing"]["value"];
    		    pUri = msg["firstResults"]["results"]["bindings"][i]["property"]["value"];
    		    pName = msg["firstResults"]["results"]["bindings"][i]["propertyName"]["value"];
    		    pValue = msg["firstResults"]["results"]["bindings"][i]["propertyValue"]["value"];
    		    var table = document.getElementById("devicePropTable");

    		    if (!document.getElementById(pUri)){		
    			var row = table.insertRow(-1);
    			row.id = pUri;
    			var f1 = row.insertCell(0);
    			var f2 = row.insertCell(1);
    			var f3 = row.insertCell(2);
    			var f4 = row.insertCell(3);
    			f4.id = pUri.split("#")[1] + "_value";
    			f1.innerHTML = tUri.replace(wot, "wot:");
    			f2.innerHTML = pUri.replace(wot, "wot:");
    			f3.innerHTML = pName;
    			f4.innerHTML = pValue;
    		    } else {
    			f3 = document.getElementById(pUri.split("#")[1] + "_value");
    			f3.innerHTML = pValue;
    		    }				
    		}
		
		
    	    };	    
	    
    	} else if (msg["results"] !== undefined){
	    
    	    if (msg["spuid"] === devicePropertiesSpuid){
		
    		// iterate over rows of the results
    		for (var i in msg["results"]["addedresults"]["bindings"]){

    		    // iterate over columns
    		    tUri = msg["results"]["addedresults"]["bindings"][i]["thing"]["value"];
    		    pUri = msg["results"]["addedresults"]["bindings"][i]["property"]["value"];
    		    pName = msg["results"]["addedresults"]["bindings"][i]["propertyName"]["value"];
    		    pValue = msg["results"]["addedresults"]["bindings"][i]["propertyValue"]["value"];
    		    var table = document.getElementById("devicePropTable");

    		    if (!document.getElementById(pUri)){		
    			var row = table.insertRow(-1);
    			row.id = pUri;
    			var f1 = row.insertCell(0);
    			var f2 = row.insertCell(1);
    			var f3 = row.insertCell(2);
    			var f4 = row.insertCell(3);
    			f4.id = pUri.split("#")[1] + "_value";
    			f1.innerHTML = tUri.replace(wot, "wot:");
    			f2.innerHTML = pUri.replace(wot, "wot:");
    			f3.innerHTML = pName;
    			f4.innerHTML = pValue;
    		    } else {
    			f3 = document.getElementById(pUri.split("#")[1] + "_value");
    			f3.innerHTML = pValue;
    		    }				
    		}		
    	    }
    	}	
    };

    // 4 - handler for closed websocket
    ws2.onclose = function(event){

    	// restore the interface
    	$("#devicePropPanel").removeClass("panel-success");
    	document.getElementById("devicePropertiesSpuid").innerHTML = "";
    	$("#" + deviceId.split("#")[1] + "Btn").removeClass("btn-success");

    	// forget the active device
    	activeDevice = null;

    };

    ///////////////////////////////////////////////////
    //
    // Third subscription: things events
    //
    ///////////////////////////////////////////////////

    // 1 - open connection
    var ws3 = new WebSocket(subscUrl);
    
    // 2 - send subscription
    ws3.onopen = function(){
    	ws3.send(JSON.stringify({"subscribe":subText["thingsEvents"], "alias":"events"}));
    };
    
    // 3 - handler for received messages
    ws3.onmessage = function(event){
	
    	// parse the message
    	emsg = JSON.parse(event.data);
	console.log(emsg);

    	// store the subscription ID
    	if (emsg["subscribed"] !== undefined){

    	    if (emsg["alias"] === "events"){

    		// get the subid
    		subid = emsg["subscribed"];
		
    		// store the subid in the html field
    		document.getElementById("deviceEventsSpuid").innerHTML = subid;
		
    		// store the subid
    		deviceEventsSpuid = subid;
		
    		// save the websocket
    		deviceEventsSub = ws3;
		
    		// colour the panel
    		$("#deviceEventsPanel").addClass("panel-success");

    		// iterate over rows of the results
		if (emsg["firstResults"] !== undefined){
    		    for (var i in emsg["firstResults"]["results"]["bindings"]){
    			// iterate over columns
    			tUri = emsg["firstResults"]["results"]["bindings"][i]["thing"]["value"];
    			eUri = emsg["firstResults"]["results"]["bindings"][i]["event"]["value"];
			if (emsg["firstResults"]["results"]["bindings"][i]["timestamp"] !== undefined){
    			    eTimestamp = emsg["firstResults"]["results"]["bindings"][i]["timestamp"]["value"];
			}
			else {
			    eTimestamp = "-";
			}
    			if (emsg["firstResults"]["results"]["bindings"][i]["value"] !== undefined){
    			    eValue = emsg["firstResults"]["results"]["bindings"][i]["value"]["value"];
    			}
    			var table = document.getElementById("deviceEventsTable");
			if (!document.getElementById(eUri.split("#")[1] + tUri.split("#")[1])){
    			    var row = table.insertRow(-1);
    			    row.id = eUri.split("#")[1] + tUri.split("#")[1];
    			    var f1 = row.insertCell(0);
    			    var f2 = row.insertCell(1);
    			    var f3 = row.insertCell(2);
    			    var f4 = row.insertCell(3);
    			    f3.id = eUri.split("#")[1] + tUri.split("#")[1] + "_timestamp";
    			    f4.id = eUri.split("#")[1] + tUri.split("#")[1] + "_value";
    			    f1.innerHTML = tUri.replace(wot, "wot:");
    			    f2.innerHTML = eUri.replace(wot, "wot:");
    			    f3.innerHTML = eTimestamp;
    			    if (emsg["firstResults"]["results"]["bindings"][i]["value"] !== undefined){
    				f4.innerHTML = eValue;
    			    }
			}
			else {			
			    f4 = document.getElementById(eUri.split("#")[1] + tUri.split("#")[1] + "_timestamp");
			    f5 = document.getElementById(eUri.split("#")[1] + tUri.split("#")[1] + "_value");
			    f4.innerHTML = eTimestamp;
			    if (emsg["firstResults"]["results"]["bindings"][i]["value"] !== undefined){
    				f5.innerHTML = eValue;
			    }			
			}
		    }
    		} else {
		    console.log("SDFA");
		}		   
    	    }
	    
    	} else if (emsg["results"] !== undefined){

    	    if (emsg["spuid"] === deviceEventsSpuid){

		// iterate over columns
		for (var i in emsg["results"]["removedresults"]["bindings"]){		    
		    eUri = emsg["results"]["removedresults"]["bindings"][i]["event"]["value"].split("#")[1] + tUri.split("#")[1];
		    
		    // get the table and check if it's a new device
		    if (document.getElementById(eUri)){
			document.getElementById(eUri).remove();
		    }
		}
				
    		// iterate over rows of the results
    		for (var i in emsg["results"]["addedresults"]["bindings"]){
		    
    		    // iterate over columns
    		    tUri = emsg["results"]["addedresults"]["bindings"][i]["thing"]["value"];
    		    eUri = emsg["results"]["addedresults"]["bindings"][i]["event"]["value"];
		    if (emsg["results"]["addedresults"]["bindings"][i]["timestamp"] !== undefined){
    			eTimestamp = emsg["results"]["addedresults"]["bindings"][i]["timestamp"]["value"];
		    } else { eTimestamp = "-"};
    		    if (emsg["results"]["addedresults"]["bindings"][i]["value"] !== undefined){
    			eValue = emsg["results"]["addedresults"]["bindings"][i]["value"]["value"];
    		    }
    		    var table = document.getElementById("deviceEventsTable");
		    if (!document.getElementById(eUri.split("#")[1] + tUri.split("#")[1])){
    			var row = table.insertRow(-1);
    			row.id = eUri.split("#")[1] + tUri.split("#")[1];
    			var f1 = row.insertCell(0);
    			var f2 = row.insertCell(1);
    			var f3 = row.insertCell(2);
    			var f4 = row.insertCell(3);
    			f3.id = eUri.split("#")[1] + tUri.split("#")[1] + "_timestamp";
    			f4.id = eUri.split("#")[1] + tUri.split("#")[1] + "_value";
    			f1.innerHTML = tUri.replace(wot, "wot:");
    			f2.innerHTML = eUri.replace(wot, "wot:");
    			f3.innerHTML = eTimestamp;
    			if (emsg["results"]["addedresults"]["bindings"][i]["value"] !== undefined){
    			    f4.innerHTML = eValue;
    			}
		    }
		    else {			
			f4 = document.getElementById(eUri.split("#")[1] + tUri.split("#")[1] + "_timestamp");
			f5 = document.getElementById(eUri.split("#")[1] + tUri.split("#")[1] + "_value");
			f4.innerHTML = eTimestamp;
			if (emsg["results"]["addedresults"]["bindings"][i]["value"] !== undefined){
    			    f5.innerHTML = eValue;
			}			
		    }
    		}
    	    }
    	}	
    };
    
    // 4 - handler for closed websocket
    ws3.onclose = function(event){

    	// restore the interface
    	$("#deviceEventsPanel").removeClass("panel-success");
    	document.getElementById("deviceEventsSpuid").innerHTML = "";

    };

    ///////////////////////////////////////////
    //
    // fourth subscription: actions
    //
    ///////////////////////////////////////////
    
    // 1 - open connection
    var ws4 = new WebSocket(subscUrl);
    
    // 2 - send subscription
    ws4.onopen = function(){
    	ws4.send(JSON.stringify({"subscribe":subText["thingsActions"], "alias":"actions"}));
    };
    
    // 3 - handler for received messages
    ws4.onmessage = function(event){
	
    	// parse the message
    	msg = JSON.parse(event.data);
	console.log(msg);

    	// store the subscription ID
    	if (msg["subscribed"] !== undefined){

    	    // check if the confirm is for the properties subscription
    	    if (msg["alias"] === "actions"){
		
    		// get the subid
    		subid = msg["subscribed"];
		
    		// store the subid in the html field
    		document.getElementById("deviceActionsSpuid").innerHTML = subid;

    		// store the subid
    		deviceActionsSpuid = subid

    		// save the websocket
    		deviceActionsSub = ws4;

    		// colour the panel
    		$("#deviceActionsPanel").addClass("panel-success");

		// results
    		for (var i in msg["firstResults"]["results"]["bindings"]){

    		    // iterate over columns
    		    tUri = msg["firstResults"]["results"]["bindings"][i]["thing"]["value"];		   
    		    aUri = msg["firstResults"]["results"]["bindings"][i]["action"]["value"];
    		    aName = msg["firstResults"]["results"]["bindings"][i]["actionName"]["value"];
    		    var table = document.getElementById("deviceActionsTable");

    		    if (!document.getElementById(aUri)){		
    			var row = table.insertRow(-1);
    			row.id = tUri + aUri;
    			var f1 = row.insertCell(0);
    			var f2 = row.insertCell(1);
    			var f3 = row.insertCell(2);
    			var f4 = row.insertCell(3);
    			var f5 = row.insertCell(4);
    			f1.innerHTML = tUri.replace(wot, "wot:");
    			f2.innerHTML = aUri.replace(wot, "wot:");
    			f3.innerHTML = aName;
    			f4id = "input_" + aUri.split("#")[1];
    			f4.innerHTML = '<input type="text" class="form-control" aria-describedby="basic-addon1" id=' + f4id + ' />';
    			f5.innerHTML = "<button action='button' class='btn btn-secondary btn-sm' onclick='javascript:invokeAction(" + '"' + tUri + '"' + ","  + '"' + aUri + '"' + ");'><span class='glyphicon glyphicon-play-circle' aria-hidden='true'>&nbsp;</span>Invoke</button>";
    		    }
    		}		
		
    	    };	    
	    
    	} else if (msg["results"] !== undefined){

    	    if (msg["spuid"] === deviceActionsSpuid){
		
    		// iterate over rows of the results
    		for (var i in msg["results"]["addedresults"]["bindings"]){

    		    // iterate over columns
    		    tUri = msg["results"]["addedresults"]["bindings"][i]["thing"]["value"];		   
    		    aUri = msg["results"]["addedresults"]["bindings"][i]["action"]["value"];
    		    aName = msg["results"]["addedresults"]["bindings"][i]["actionName"]["value"];
    		    var table = document.getElementById("deviceActionsTable");

    		    if (!document.getElementById(tUri + aUri)){		
    			var row = table.insertRow(-1);
    			row.id = aUri;
    			var f1 = row.insertCell(0);
    			var f2 = row.insertCell(1);
    			var f3 = row.insertCell(2);
    			var f4 = row.insertCell(3);
    			var f5 = row.insertCell(4);
    			f1.innerHTML = tUri.replace(wot, "wot:");
    			f2.innerHTML = aUri.replace(wot, "wot:");
    			f3.innerHTML = aName;
    			f4id = "input_" + aUri.split("#")[1];
    			f4.innerHTML = '<input type="text" class="form-control" aria-describedby="basic-addon1" id=' + f4id + ' />';
    			f5.innerHTML = "<button action='button' class='btn btn-secondary btn-sm' onclick='javascript:invokeAction(" + '"' + tUri + '"' + ","  + '"' + aUri + '"' + ");'><span class='glyphicon glyphicon-play-circle' aria-hidden='true'>&nbsp;</span>Invoke</button>";
    		    }
    		}
    	    }

	    
    	    // iterate over rows of the results
    	    for (var i in msg["results"]["removedresults"]["bindings"]){
		aUri = msg["results"]["removedresults"]["bindings"][i]["action"]["value"];
		if (document.getElementById(aUri)){
		    document.getElementById(aUri).remove();
		}
    	    }
	    
    	}	
    };

    // 4 - handler for closed websocket
    ws4.onclose = function(event){

    	// restore the interface
    	$("#deviceActionsPanel").removeClass("panel-success");
    	document.getElementById("deviceActionsSpuid").innerHTML = "";
    	$("#" + deviceId.split("#")[1] + "Btn").removeClass("btn-success");

    };

    
};


function unsubscribe(){

    // close subscription to devices
    if (deviceListSub !== null){
	deviceListSub.close();
	deviceListSub = null;
    };

    // close subscription to properties
    if (devicePropertiesSub !== null){
	devicePropertiesSub.close();
	devicePropertiesSub = null;
    };

    // close subscription to events
    if (deviceEventsSub !== null){
	deviceEventsSub.close();
	deviceEventsSub = null;
    };

    // close subscription to events
    if (deviceActionsSub !== null){
	deviceActionsSub.close();
	deviceActionsSub = null;
    };
    
};


//////////////////////////////////////////////
//
// Functions to clear the interface
//
//////////////////////////////////////////////

function clearData(){

    // unsubscribe
    unsubscribe("all");

    // empty tables
    emptyTables("all");

    // empty panels
    emptyPanelHeadFoot("all");
    
};

function emptyTables(req){

    table = document.getElementById("deviceTable");
    while(table.rows.length > 1) {
	table.deleteRow(-1);
    };
    
    table = document.getElementById("deviceActionsTable");
    while(table.rows.length > 1) {
	table.deleteRow(-1);
    };
    
    table = document.getElementById("deviceEventsTable");
    while(table.rows.length > 1) {
	table.deleteRow(-1);
    };
    
    table = document.getElementById("devicePropTable");
    while(table.rows.length > 1) {
	table.deleteRow(-1);
    };

}

function emptyPanelHeadFoot(req){

    // main panel
    if (req === "all"){
	$("#devicesPanel").removeClass("panel-success");
	document.getElementById("spuid").innerHTML = "";
    }

    // clear actions panel
    $("#deviceActionsPanel").removeClass("panel-success");
    document.getElementById("deviceActionsSpuid").innerHTML = "";
    
    // clear events panel
    $("#deviceEventsPanel").removeClass("panel-success");
    document.getElementById("deviceEventsSpuid").innerHTML = "";
    
    // clear props panel
    $("#devicePropPanel").removeClass("panel-success");
    document.getElementById("devicePropertiesSpuid").innerHTML = "";

    // clear the device name from every panel
    deviceNameSections = document.getElementsByClassName("deviceName");
    for (d in deviceNameSections){
	deviceNameSections[d].innerHTML = "";
    };
    
}


function invokeAction(thingId, actionId){

    console.log("INVOKED ACTION: " + actionId + " OF THING: " + thingId);
    
    // read the URI to send SPARQL update
    updateURI = document.getElementById("updateURI").value;

    // read the input
    actionInputField = "input_" + actionId.split("#")[1];
    actionInput = document.getElementById(actionInputField).value;

    // build the sparql update
    su = "PREFIX wot:<http://wot.arces.unibo.it/sepa#> " +
	"PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
	"PREFIX dul:<http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#> " + 
	"PREFIX td:<http://wot.arces.unibo.it/ontology/web_of_things#> "+
	"DELETE { <" + actionId + "> wot:hasInstance ?oldInstance . " +
	"?oldInstance rdf:type wot:ActionInstance . " +
	"?oldInstance wot:hasReqeustTimeStamp ?aOldTimeStamp . " +
	"?oldInstance wot:hasInputData ?oldInput . " +
	"?oldInput dul:hasDataValue ?oldValue } " +

    "INSERT { <" + actionId + "> wot:hasActionInstance ?newInstance . " +
	"?newInstance rdf:type wot:ActionInstance . " +
	"?newInstance wot:hasRequestTimeStamp ?time . " +
	"?newInstance wot:hasInputData ?newInput . " +
	"?newInput dul:hasDataValue '" + actionInput + "' } " +

    "WHERE { <" + actionId + "> rdf:type td:Action . " +
	"<" + thingId + "> td:hasAction <" + actionId + "> . " +
	"BIND(now() AS ?time) . " +
	"BIND(IRI(concat('http://wot.arces.unibo.it/sepa#Action_',STRUUID())) AS ?newInstance) . " +
	"BIND(IRI(concat('http://wot.arces.unibo.it/sepa#ActionInput_',STRUUID())) AS ?newInput) . " +
	"OPTIONAL{ <" + actionId + "> wot:hasInstance ?oldInstance. " +
	"?oldInstance rdf:type wot:ActionInstance. " +
	"?oldInstance wot:hasRequestTimeStamp ?aOldTimeStamp . " +
	"?oldInstance wot:hasInputData ?oldInput . " +
	"?oldInput dul:hasDataValue ?oldValue}}";

    console.log(su);
    
    // send the sparql update
    var req = $.ajax({
	url: updateURI,
	crossOrigin: true,
	method: 'POST',
	contentType: "application/sparql-update",
	data: su,	
	error: function(event){
	    d = new Date();
	    ts = new Intl.DateTimeFormat('en-GB').format(d);
//	    ts = d.toLocaleFormat("%y/%m/%d %H:%M:%S");
	    return false;
	},
	success: function(data){
	    d = new Date();
	    ts = new Intl.DateTimeFormat('en-GB').format(d)
	    // ts = d.toLocaleFormat("%y/%m/%d %H:%M:%S"); 
	}
    });
    
    // eventually wait/subscribe for results
    
}
