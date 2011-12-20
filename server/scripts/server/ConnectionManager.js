var CONTINUATION = '0000';
var TEXT_FRAME = '0001';
var BINARY_FRAME = '0010';
var CONNECTION_CLOSE = '1000';
var PING = '1001';
var PONG = '1010';

function ConnectionManager( address, port ) {
	this.connections = new Array();
	this.connectionMap = {};
	this.socket = new air.ServerSocket();	
	this.port = port;
	this.address = address;

	var connectionManager = this;
	
	this.socket.addEventListener( air.ServerSocketConnectEvent.CONNECT, function( evt ) {
		
		air.trace( "CLIENT SOCKET CONNECTED" );
		air.trace( evt.socket.toString() );
		var client = evt.socket;
		
		client.addEventListener( air.Event.CLOSE, connectionManager.onClientSocketClose() );
		client.addEventListener( air.ProgressEvent.SOCKET_DATA, connectionManager.onClientSocketData() );	
		
		// Track client connections
		connectionManager.connections.push( client );
		air.trace( "CONNECTIONS: " + connectionManager.connections.length );
	} );
	
	this.socket.bind( parseInt( port ), address );
	this.socket.listen();
	
}

ConnectionManager.prototype.dispatch = function( symbol, message ) {
	var array = this.connectionMap[symbol];
	if ( array ) {
		for( var c = 0; c < array.length; c++ ) {	
			this.sendMessage( array[c], message );
		}	
	}
}

ConnectionManager.prototype.subscribe = function( symbol, connection ) {

	if ( this.connectionMap[symbol] == null)
		this.connectionMap[symbol] = [];
		
	this.connectionMap[symbol].push( connection );
	dataFeed.sendSymbol( symbol )
}

ConnectionManager.prototype.unsubscribe = function( symbol, connection ) {
	if ( this.connectionMap[symbol] != null) {
		var index = this.connectionMap[symbol].indexOf( connection );

		this.connectionMap[symbol].splice( index, 1 );
	}
}

ConnectionManager.prototype.sendMessage = function( connection, message ) {
	
	connection.writeByte( 129 );
	connection.writeByte( message.length );
	connection.writeUTFBytes( message );
	connection.flush();
}



ConnectionManager.prototype.onClientSocketClose = function() {
	var self = this;
	return function ( evt ) {

		air.trace( "***SOCKET CLOSED***" );
		air.trace( evt.currentTarget.toString() );
		
		for( var c = 0; c < self.connections.length; c++ ) {
			if( self.connections[c] == evt.currentTarget ) {
				self.connections.splice( c, 1 );
				break;
			}
		}	

		for ( symbol in self.connectionMap ) {
			var array = self.connectionMap[symbol];
			if ( array ) {
				for( var c = 0; c < array.length; c++ ) {
					air.trace( "          testing: " + array[c]  )
					if( array[c] == evt.currentTarget ) {
						array.splice( c, 1 );
						break;
					}
				}	
			}
		}
		
		
		evt.currentTarget.close();		
	}
}

ConnectionManager.prototype.onClientSocketData = function() {
	var self = this;
	return function ( evt ) {

		air.trace( "***SOCKET DATA***" );
		var available = evt.target.bytesAvailable;
		var bits = null;
		var buffer = null;
		var bytes = new air.ByteArray();
		var file = air.File.desktopDirectory.resolvePath( 'headers.txt' );
		var mask = null;
		var output = null;
		var response = null;
		var start = null;
		var stream = new air.FileStream();			
		
		// Read incoming bytes
		evt.currentTarget.readBytes( bytes, 0, available );
	
		// Persist bytes for debugging
		bytes.position = 0;
		stream.open( file, air.FileMode.WRITE );
		stream.writeBytes( bytes, 0, bytes.length );
		stream.close();
		bytes.position = 0;
		
		// Capture first byte
		start = bytes.readUnsignedByte();
		air.trace( start );
	
		// HTTP GET mean opening a socket
		if( start == 71 ) {
			
			bytes.position = 0;
			response = handshake( bytes );
			
			air.trace( response );
			
			output = 
				'HTTP/1.1 101 Switching Protocols\r\n' +
				'Upgrade: websocket\r\n' +					
				'Connection: Upgrade\r\n' +
				'Sec-WebSocket-Accept: ' + response + '\r\n' +
				'\r\n';
			
			air.trace( output );
			evt.currentTarget.writeUTFBytes( output );	
			evt.currentTarget.flush();						
		} else {	
			
			// Determine action based on message frame
			switch( start.toString( 2 ).substr( 4, 4 ) ) {
				case TEXT_FRAME:
					
					// Message length
					available = bytes.readUnsignedByte();
					available = parseInt( available.toString( 2 ).substr( 1, 7 ), 2 );
					
					if( available == 126 ) {
						available = bytes.readUnsignedShort();	
					} else if( available == 127 ) {
						available = bytes.readDouble();
					}
					
					air.trace( 'Length: ' + available );						
					
					// Mask
					mask = new Array();
					mask[0] = bytes.readUnsignedByte();
					mask[1] = bytes.readUnsignedByte();
					mask[2] = bytes.readUnsignedByte();
					mask[3] = bytes.readUnsignedByte();
					
					// Payload
					buffer = new Array();
					
					for( var d = bytes.position; d < bytes.length; d++ )
					{
						buffer.push( bytes.readUnsignedByte() );
					}
	
					air.trace( 'Payload: ' + buffer.length );
	
					// Unmask
					message = new String();
					
					for( var i = 0; i < buffer.length; i++ ) 
					{
							buffer[i] ^= mask[i % 4];
						message = message + String.fromCharCode( buffer[i] );
					}
					
					air.trace( 'Message: ' + message );						
					
					if( message == 'LIST' )
					{
						
						var output = "LIST:" + dataFeed.toArrayJSON();
						air.trace( output );
						
						air.trace( self )
						self.sendMessage(evt.currentTarget, output);
						
						
					} else if( message.search( "SUBSCRIBE:") == 0 ) {
						
						var symbol = message.slice(10);
						self.subscribe( symbol, evt.currentTarget );
						
						air.trace( symbol );
					}else if( message.search( "UNSUBSCRIBE:") == 0 ) {
						var symbol = message.slice(12);
						air.trace( symbol );
						self.unsubscribe( symbol, evt.currentTarget );
					}
	
					break;
			}
		}
	}
	
}