import { forEach, forEachRight } from "lodash"
import _ from "Helpers"

const cache = {
	textures: {}
}

class Core {

	static laodTexture ( name ) {
        let texture = cache.textures[ name ]

        if ( !texture ) {
            cache.textures[ name ] = texture = new THREE.TextureLoader().load( `res/pics/${name}` );
        }

        return texture
    }

    static forEachGrid ( x, y, iteratee ) {
    	for ( let a  = 0; a < x; a++ ) {
    		for ( let b = 0; b < y; b++ ) {
    			iteratee( a, b )
    		}
    	}
    }

    static getRoomBoundIndex ( sizeX, sizeY, x, y ) {
    	let result = -1;

    	if ( ( x === 0 && y === 0 ) || ( x === 0 && y === sizeY - 1 ) || ( x === sizeX - 1 && y === 0) || ( x === sizeX - 1 && y === sizeY - 1 ) ) {
    		result = -2
    	} else {
	    	if ( x === 0 && ( y > 0 && y < sizeY - 1 ) )  result = 0;
	    	if ( y === 0 && ( x > 0 && x < sizeX - 1 ) )  result = 1;
	    	if ( x === ( sizeX - 1 ) && ( y > 0 && y < sizeY - 1 ) )  result = 2;
	    	if ( y === ( sizeY - 1 ) && ( x > 0 && x < sizeX - 1 ) )  result = 3;    		
    	}

    	return result
    }

    static isRoomBound ( sizeX, sizeY, x, y ) {
    	return ( x === 0 || y === 0 || ( x === sizeX - 1 ) || ( y === sizeY - 1 ) )
    }

    static isRoomDoor ( doors, boundIndex, x, y ) {
    	let result = false
    	forEach( doors, ( doorData, index )=>{
    		let alignment = doorData.location[ 0 ] % 2
    		let position = alignment ? x : y

    		if ( doorData.location[ 0 ] === boundIndex && doorData.location[ 1 ] == position ) {
    			result = true
    			return true
    		}
    	} )

    	return result
    }
}

window.Core = Core

export default Core