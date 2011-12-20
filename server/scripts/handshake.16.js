var GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function handshake( bytes )
{
	var joined = null;
	var header = null;
	var lines = null;	
	var parsed = null;	
	var result = null;
	var value = null;

	lines = bytes.readUTFBytes( bytes.length );
	lines = lines.split( '\r\n' );
				
	for( var h = 0; h < lines.length; h++ )
	{
		if( lines[h].indexOf( ':' ) >= 0 )
		{
			header = lines[h].substring( 0, lines[h].indexOf( ':' ) );
			value = lines[h].substring( header.length + 2, lines[h].length );
						
			switch( header )
			{
				case 'Sec-WebSocket-Key':
					air.trace( value );
					result = value + GUID;
					result = b64_sha1( result );
					air.trace( b64_sha1( 'dGhlIHNhbXBsZSBub25jZQ==' + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11' ) );
					break;
			}
		}
	}

	return result;
}