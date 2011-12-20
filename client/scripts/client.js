var subscriptions = [];
var socket = null;
var data = {}
var list = [];
var listMap = {};

$( document ).ready( function() {
	
	if( socket == null )
	{
		socket = new WebSocket( 'ws://127.0.0.1:4000' );

		socket.onopen = function() {
			socket.send( 'LIST' );
		};
		
		socket.onmessage = function( evt ) {
			
			var data = evt.data;
			
			if ( data.search( "LIST:" ) == 0) {
				displaySymbols( data );
			}
			
			//assume data update
			else {
				updateSymbolData( data );
			}
			
		};
			
		socket.onclose = function() {
			socket = null;				
		};			
	} else {
		socket.close();
	}
	
} );

function displaySymbols( source ) {
	console.log( "LIST" );
	var content = source.slice(5);
	console.log( content );
	
	list = eval(content);
	for (var x=0; x< list.length;x++){
		listMap[ list[x].v ] = list[x];
		$("#symbols").append( $("<a href='javascript:toggleFeed(\""+ list[x].v +"\")' id=\"symbol"+ list[x].v +"\">" + list[x].v  + "</a> ") )
	}
	
}

function toggleFeed(feed) {
	if ( $.inArray(feed, subscriptions) >= 0 )	
		unsubscribe(feed);
	else
		subscribe(feed);
}

function subscribe(feed) {
	createDataForFeed( feed )
	socket.send( 'SUBSCRIBE:' + feed );
	subscriptions.push( feed );
	applyFormat( feed );
}

function unsubscribe(feed) {
	socket.send( 'UNSUBSCRIBE:' + feed );
	var index = $.inArray(feed, subscriptions);
	subscriptions.splice(index,1);
	removeFormat( feed );
	removeDataForFeed( feed );
	updateChart();
}

function applyFormat( feed ) {
	$("#symbol" + feed).addClass( "selected" );
	$("#symbol" + feed).css( "color", formatColor( listMap[feed].c ) );
}

function removeFormat( feed ) {
	$("#symbol" + feed).css( "color", "#000000" );
	$("#symbol" + feed).removeClass( "selected" );
}

function createDataForFeed( feed ) {

	var array = [];
	for( var d = 0; d < 50; d++ )
	{
		array.push( 0 );	
	}
	
	data[ feed ] = array;
}

function removeDataForFeed( feed ) {

	data[ feed ] = null;
}

function updateSymbolData( symbolData ) {
	console.log( symbolData )
	var symbol = eval ( '[' + symbolData + ']' );
	symbol = symbol[ 0 ];
	var array = data[ symbol.symbol ];

	array.splice( 0, 1 );
	array.push( parseFloat( symbol.value ) );
	
	updateChart();
}

function formatColor( color ) {
	
	var stringValue = color.toString();
	while (stringValue.length < 6) {
		stringValue = "0" + stringValue;
	}
	return stringValue;
}

function updateChart() {
	
	var colors = [];
	var chartData = [];
	
	for ( var symbol in data ) {
		
		if ( data[symbol] ) {
			colors.push( formatColor( listMap[symbol].c ) );
			chartData.push( data[symbol] );
		}
		
	}
		
	
	RGraph.Clear( document.getElementById( 'graph' ) );				
	
	var evalStatement = "new RGraph.Line( 'graph'";
	
	for (var x=0; x<chartData.length; x++) {
		evalStatement += ", chartData[" + x.toString() + "] ";
	}
	
	evalStatement += " );";
	line = eval( evalStatement );
	
	line.Set( 'chart.background.grid.color', 'rgba( 238, 238, 238, 1 )' );
	line.Set( 'chart.colors', colors );
	line.Set( 'chart.linewidth', 1 );
	line.Set( 'chart.filled', true );
	line.Set( 'chart.ylabels', false );
	line.Set( 'chart.gutter', 0 );
	line.Set( 'chart.noaxes', true );	
	line.Set( 'chart.background.grid.autofit', true );
	line.Set( 'chart.tickmarks', null );
	line.Set( 'chart.filled', null );
	line.Set( 'chart.ymax', 100 );
	line.Draw();	
}
