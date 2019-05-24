import Core from "Core"
import { forEach } from "lodash"

let cell_size = 100

class Room {
    constructor ( params ) {
        this.params = params
        this.data = {
            center: new THREE.Vector2( params.size.x / 2 * cell_size, params.size.y / 2 * cell_size ),
            rendering: {
                root: null,
                bounds: null,
                floor: null
            },
            matter: {}
        }

        this.data.rendering.root = new THREE.Group()

        this.createFloor()
        this.createBounds()
    }

    get center () { return this.data.center } 

    createBounds () {
        this.createBoundsMesh()
    }

    createBoundsMesh () {
        let sizeX = this.params.size.x
        let sizeY = this.params.size.y
        let doors = this.params.doors 

        let material = new THREE.MeshPhongMaterial( {
            color: 0xFFFFFF,
            transparent: true,
            side: THREE.DoubleSide,
            map: Core.laodTexture( "wall_brick.jpg" ),
            // bumpMap: Core.laodTexture( "stones.jpg" ),
            // bumpScale: 10
            // wireframe: true
        } ) 

        let geometry = new THREE.BufferGeometry()
        geometry.addAttribute( "position", new THREE.BufferAttribute( new Float32Array( 900 ), 3 ) )
        geometry.addAttribute( "normal", new THREE.BufferAttribute( new Float32Array( 900 ), 3 ) )
        geometry.addAttribute( "uv", new THREE.BufferAttribute( new Float32Array( 600 ), 2 ) )

        let position = 0
        Core.forEachGrid( sizeX, sizeY, ( x, y )=>{
            /* left top right bottom */
            let isBound = Core.isRoomBound( sizeX, sizeY, x, y )

            if ( isBound ) {
                let boundIndex = Core.getRoomBoundIndex( sizeX, sizeY, x, y ) 
                
                if ( boundIndex >= 0 || boundIndex === -2 ) {
                    let isDoor = Core.isRoomDoor( doors, boundIndex, x, y )

                    if ( !isDoor ) {

                        geometry.attributes.normal.setXYZ( position, 0, 0, 1 )
                        geometry.attributes.uv.setXY( position, 0, 0 )
                        geometry.attributes.position.setXYZ( position++, x, y, 0 )

                        geometry.attributes.normal.setXYZ( position, 0, 0, 1 )
                        geometry.attributes.uv.setXY( position, 1, 1 )
                        geometry.attributes.position.setXYZ( position++, x + 1, y + 1, 0 )

                        geometry.attributes.normal.setXYZ( position, 0, 0, 1 )
                        geometry.attributes.uv.setXY( position, 0, 1 )
                        geometry.attributes.position.setXYZ( position++, x, y + 1, 0 )


                        geometry.attributes.normal.setXYZ( position, 0, 0, 1 )
                        geometry.attributes.uv.setXY( position, 0, 0 )
                        geometry.attributes.position.setXYZ( position++, x, y, 0 )

                        geometry.attributes.normal.setXYZ( position, 0, 0, 1 )
                        geometry.attributes.uv.setXY( position, 1, 0 )
                        geometry.attributes.position.setXYZ( position++, x + 1, y, 0 )

                        geometry.attributes.normal.setXYZ( position, 0, 0, 1 )
                        geometry.attributes.uv.setXY( position, 1, 1 )
                        geometry.attributes.position.setXYZ( position++, x + 1, y + 1, 0 )

                    } else {
                        console.log( x, y )
                    }
                }

            }
        } )

        geometry.scale( cell_size, cell_size, 1 )

        let mesh = new THREE.Mesh( geometry, material )

        this.data.rendering.root.add( mesh )

        this.data.rendering.bounds = mesh

        // console.log( sizeX, sizeY, doors )


    }

    /**/

    createFloor() {
        this.createFloorMesh()
    }

    createFloorMesh() {
        let geometry = new THREE.PlaneBufferGeometry( this.params.size.x, this.params.size.y, 1 )
        geometry.translate( this.params.size.x / 2, this.params.size.y / 2, 0 )
        geometry.scale( cell_size, cell_size, 1 )
        geometry.needsUpdate = true

        let material = new THREE.MeshPhongMaterial( {
            transparent: true,
            side: THREE.DoubleSide,
            map: Core.laodTexture( "floors/stones.png" ),
            bumpMap: Core.laodTexture( "floors/bumps/stones.png" ),
            bumpScale: 1
        } )

        material.map.wrapS     = material.bumpMap.wrapS      = THREE.RepeatWrapping;
        material.map.wrapT     = material.bumpMap.wrapT      = THREE.RepeatWrapping;
        material.map.repeat.x  = material.bumpMap.repeat.x   = this.params.size.x;
        material.map.repeat.y  = material.bumpMap.repeat.y   = this.params.size.y;

        let mesh = new THREE.Mesh( geometry, material )

        this.data.rendering.root.add( mesh )
        this.data.rendering.floor = mesh
    }
}

export default Room