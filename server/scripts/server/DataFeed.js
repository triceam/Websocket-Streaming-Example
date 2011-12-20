
function DataFeed( connectionManager ) {
	this.PUSH_INTERVAL_MS = 100;
	this.interval = NaN;
	this.connectionManager = connectionManager;
	this.symbols = null;
	this.symbolMap = {};
	this.initializeData();
	this.start();
}

DataFeed.prototype.initializeData = function () {
	this.symbols = [ new DataPoint( "ADBE", 0xFF0000 ),
	                 new DataPoint( "MSFT", 0x00FF00 ),
	                 new DataPoint( "GOOG", 0x0000FF ),
	                 new DataPoint( "AAPL", 0xFF00FF )];
	
	//populate a map for quick lookup later
	for (var x=0; x< this.symbols.length; x++) {
		this.symbolMap[ this.symbols[x].symbol ] = this.symbols[x];
	}
}

DataFeed.prototype.start = function () {

	if (isNaN(this.interval)) {
		var self = this;
		this.interval = setInterval( function() { self.update() }, this.PUSH_INTERVAL_MS );
	}
}

DataFeed.prototype.stop = function () {

	clearInterval( this.interval );
	this.interval = NaN;
}

DataFeed.prototype.update = function () {

	var index = parseInt(Math.random() * this.symbols.length);
	var dataPoint = this.symbols[ index ];
	dataPoint.update();
	
	message = dataPoint.toJSON();
	air.trace( "update: " + message);
	this.connectionManager.dispatch( dataPoint.symbol, message );
}

DataFeed.prototype.sendSymbol = function (symbol) {
	var dataPoint = this.symbolMap[ symbol ];
	message = dataPoint.toJSON();
	this.connectionManager.dispatch( symbol, message );
}


DataFeed.prototype.toArrayJSON = function() {
	
	var result = "[";
	for ( var x=0; x< this.symbols.length; x++) {
		if ( x > 0 ) result += ", ";
		result += '{ "v":"' + this.symbols[x].symbol + '", "c": "' + this.symbols[x].color.toString(16) + '" }' ;
	}
	result +=  "]";
	return result;
}


function DataPoint( symbol, color ) {
	this.MAX = 100;
	this.MIN = 10;
	this.symbol = symbol;
	this.value = 10 + (Math.random() * 90);
	this.color = color;
	air.trace( this.toJSON() );
}

DataPoint.prototype.update = function () {
	var delta = ((parseInt(Math.random()*100) %2) == 1 ? 1 : -1 ) * (Math.random() * 5);
	var newVal = this.value + delta;
	if ( newVal < this.MIN || newVal > this.MAX ) {
		delta *= -1;
		newVal = this.value + delta;
	}
	this.value = newVal;
}

DataPoint.prototype.toJSON = function () {
	return '{ "symbol":"'+this.symbol+'", "value":"' + this.value.toPrecision(4) + '" }';
}


