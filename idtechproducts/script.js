/* 

Serial Test Utility
by Kas Thomas
Copyright 2016 by ID TECH
Visit: idtechproducts.com

Code is provided for educational purposes only. 
Use at your own risk.

*/

var COM3 = "COM3"; // for Linux, change this to something like "/dev/tty0" or "/dev/ttyUSB0"
var connectionId;

var outputNode = document.getElementById("outputNode"); // get the text area node

var WAIT_TIME = 500; // accumulate data for 500 msec

var options = {
  'bitrate': 19200,
  'dataBits': 'eight',
  'parityBit': 'no',
  'stopBits': 'one'
}

// UI
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('actionButton').addEventListener( 'click', btnSend );
    document.getElementById('clearButton').addEventListener( 'click', clearAll );
    document.getElementById('selection').addEventListener( 'change', writeToUserText );
    document.getElementById('connectButton').addEventListener( 'click', connect );
    enumerate();
    connect(COM3);
});

function enumerate() {
 // On startup:
 chrome.serial.getDevices( function( devices ) {
   for (var i = 0; i < devices.length; i++) {
       	var info = devices[i];
       	writeOutput( "\nDevice " + i + "\n");
       	writeOutput( "   path: " + info.path + "\n");
       	writeOutput( "   vendorId: " + info.vendorId + "\n");
       	writeOutput( "   displayName: " + info.displayName + "\n");
   	}
   } );
}

function connect( port ) { 
try {
	chrome.serial.connect( port, options, function(info) {
                if (!info)
			return;
    		connectionId = info.connectionId;
    		console.log("Connection established.");
		writeOutput("\nConnection established.");
		try {
		for (var k in info)
			writeOutput("\n" + k + ": " + info[k].toString() ); 
		}
		catch(e) { console.log("Error: " + e.toString() ); }
  	});
   } 
   catch(e) { console.log("Exception while trying to connect: " + e.toString() ); }

}

function clearAll() {
    document.getElementById("cmd").value = "";
    document.getElementById("outputNode").value = "";
}

function getSelection() {

    var selection = document.getElementById("selection").value;
    return selection;
}

function writeToUserText( str ) {

    document.getElementById("cmd").value = getSelection();
}

// Take s = "020400724609013cc203" and turn it
// into [2, 4, 0, 114, 70, 9, 1, 60, 194, 3]
function hexStringToNumericArray( s ) {

	var array = s.match(/../g);
	var output = [];

	for ( var i = 0; i < array.length; i++ )
		output.push( 1 * ("0x"+array[i] ) );

	return output;
}

function commandStringToArrayBuffer( s ) {

	var numericArray = hexStringToNumericArray(s);
	var uint8 = new Uint8Array( numericArray);
	return uint8.buffer;
}

// SEND
var btnSend = function() {
  var ab;
  var cmd = document.getElementById("cmd");
  var userText = cmd.value;
  
  cmd = userText.replace(/\s/g,""); // just pass the command as-is
  ab = commandStringToArrayBuffer( cmd );
  chrome.serial.send(connectionId,   ab , function() {} );
  writeOutput( "\nSent: " + cmd.match(/../g).join(" ") );
}

// convert ArrayBuffer to hex string
function arrayBufferToHex( array ) {

	var output = "";
	var dv = new DataView( array );
	var len = dv.byteLength;
	for ( var i = 0; i < len; i++) {

		var item = dv.getUint8( i );
		var hex = item.toString( 16 );
		if (hex.length < 2) 
			hex = '0' + hex;
		output += hex + " ";
	}
	return output;
}

// write to the app's HTML page
function writeOutput( value ) {

	if (document)
		outputNode = document.getElementById("outputNode");
	else throw ("No output node!");

	if (outputNode) {
		outputNode.value += value ;
		outputNode.scrollTop = outputNode.scrollHeight;
	}
	else
		console.log("outputNode was null.");
}

responseData = { busy:false, data:"" }; // accumulate response data here

function report() { 
	writeOutput( "\nReceived:\n" + responseData.data + "\n");
	responseData.busy = false;
	responseData.data = "";
}

function collect( text ) {
	if ( responseData.busy == false )
		setTimeout( report, WAIT_TIME );
	responseData.busy = true;
	responseData.data += text;
}

receiver = function( info ) {	

	var data = info.data;
	var str = arrayBufferToHex( data );
	collect( str ); 
        console.log( "Received: " + str + "\r\nFrom: " + info.connectionId );
};

chrome.serial.onReceive.addListener(receiver);