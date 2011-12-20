
var dataFeed = null;
var connectionManager = null;


$( document ).ready( function() {

	// Configuration file
	config = air.File.applicationDirectory.resolvePath( 'configuration.xml' );
	
	// Load configuration
	$.ajax( {
		url: config.url,
		dataType: 'xml',
		success: function( data, status, xhr ) {
			var address = $( data ).find( 'address' ).text();
			var port = new Number( $( data ).find( 'port' ).text() );
		
			connectionManager = new ConnectionManager(address, port)
			dataFeed = new DataFeed( connectionManager );
			
			// Display in application for information
			$( 'body' ).append( 'Local address: ' + connectionManager.socket.localAddress + '<br/>' );
			$( 'body' ).append( 'Local port: ' + connectionManager.socket.localPort + '<br/>' );	
			
		}
	} );
} );