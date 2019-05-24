<template>
    <div 
        ref="root"
        class="wonderland root"
        tabindex="-1" 
    >

        <canvas
            ref="canvas"
        ></canvas>
        <div
            ref="matterRenderer"
            class="matter-renderer"
            v-show="wonderMatterTestRenderer"
        ></div>
        
    </div>
</template>

<script>

import Core from "Core"
import Room from "components/Wonderland/Room"

import EffectComposer  from "three_fx/EffectComposer"
import RenderPass from "three_fx/passes/RenderPass"
import CopyShader from "three_fx/shaders/CopyShader"
import ShaderPass from "three_fx/passes/ShaderPass"
import RGBShiftShader from "three_fx/shaders/RGBShiftShader"
import ColorCorrectionShader from "three_fx/shaders/ColorCorrectionShader"
import FilmPass from "three_fx/passes/FilmPass"
import UnrealBloomPass from "three_fx/passes/UnrealBloomPass"    

import { forEach, forEachRight } from "lodash"
import _ from "Helpers"
import Hamer from "hammerjs"
import { TweenMax } from "gsap/TweenMax"
import SoundBlaster from "components/Wonderland/SoundBlaster"
import { mapState } from 'vuex'

import decomp from 'poly-decomp'
window.decomp = decomp

const Matter = window.Matter = require("matter-js")
const DPR = window.devicePixelRatio

export default {
    components: {},
    data () {
        return {
            prevRenderedFrameTime: +new Date(),
            sunOffset: { x: 0, y: 0, z: 0 },
            hoursCount: 0,
            cameraOffset: { x: 0, y: 0, z: 1 }
        }
    },
    computed: {
        ...mapState([
            "bumpmappingEnabled",
            "gravityX",
            "gravityY",
            "physicsEnabled",
            "bumpmapMultiplier",
            "paused",
            "mainThemePlays",
            "soundMuted",
            "wireframeMode",
            "wonderMatterTestRenderer",
            "wonderMatterTestRendererBounds",
            "wonderMatterTestRendererSize",
            "screenAspect",
            "pauseMenuShown",
            "settingsMenuShown",
            "timeScale",
            "fxEnabled",
            "isAndroid",
            "renderingResolution"
        ])
    },
    watch: {
        renderingResolution () {clog(1)
            this.updateSize()
            this.renderFrame()
        },
        fxEnabled () {
            this.renderFrame()
        },
        timeScale ( value ) {
            this.modules.matter.engine.timing.timeScale = value
        },
        wonderMatterTestRendererSize ( value ) {
            this.renderFrame()
        },
        wonderMatterTestRenderer ( enabled ) {
            if ( enabled ) {
                // if ( !this.modules.matter.render ) {
                //     this.createMatterRenderer()                   
                // }

                // this.updateSize()
                Matter.Render.run( this.modules.matter.render )
                this.renderFrame()
            } else {
                Matter.Render.stop( this.modules.matter.render )
                this.renderFrame()
            }
        },
        wireframeMode ( enabled ){
            this.renderFrame()
        },
        mainThemePlays ( plays ) {
            if ( plays ) {
                this.modules.soundBlaster.play( "main_theme", 0.333, true )
            } else {
                this.modules.soundBlaster.stop( "main_theme" )
            }
        },
        soundMuted ( muted ) {
            this.modules.soundBlaster.mute( muted )
            this.$store.dispatch( "save" )
        },
        paused ( value ) {
            if ( value ) {
                this.stopRendering()
                TweenMax.pauseAll( TweenMax.getAllTweens() )
            } else {
                this.startRendering()
                TweenMax.resumeAll( TweenMax.getAllTweens() )
            }
        },
        bumpmapMultiplier ( value ) {
            this.renderFrame()
        },
        bumpmappingEnabled ( enabled ) {
            this.renderFrame()
        },
        gravityX ( value ) {
            this.modules.matter.engine.world.gravity.x = value
        },
        gravityY ( value ) {
            this.modules.matter.engine.world.gravity.y = value
        }
    },
	mounted () {
        window.wonder = this

        this.modules = {
            fx: {
                passes: {}
            },
            rooms: {
                idle: {

                }
            },  
            renderGroups: {

            },
            soundBlaster: new SoundBlaster(),
            objects: {

            },
            lights: {

            },
            data: {
                textures: {}
            },
            time: new THREE.Vector2( 0, 0 ),
            matter: {},
            size: new THREE.Vector2( 1, 1 )
        }


        this.setupRenderer()
        this.setupBackground()
        this.setupMatterEngine()
        this.setupLights()
        this.updateSize()

        window.addEventListener( "resize", ()=>{
            this.updateSize()
        } )

        this.startRendering()

        if ( this.$store.state.isHybridApp ) {
            this.$store.state.mainThemePlays = true
        }

        this.modules.soundBlaster.mute( this.$store.state.soundMuted )

        this.$refs.root.focus()

        /**/

        let room = new Room( {
            size: {
                x: 9,
                y: 7
            },
            doors: [
                /* left top right bottom */
                {
                    location: [ 1, 5 ]
                },
                {
                    location: [ 2, 5 ]
                }
            ]
        } )

        this.modules.rooms.idle.test = room
        this.modules.rooms.active = room

        console.log( room )

        this.modules.scene.add( room.data.rendering.root )
    },
    methods: {
        onRootClick () {
            if ( !this.mainThemePlays && !this.$store.state.isHybridApp ) {
                this.$store.state.mainThemePlays = true
            }
        },
        setupRenderer () {
            let canvasElement = this.$refs.canvas
            let width = window.innerWidth * DPR
            let height = window.innerHeight * DPR


            let scene = new THREE.Scene()
            let camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.001, 100000 )
            // let camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 )
            let renderer = new THREE.WebGLRenderer({ 
                antialias: false, 
                canvas: canvasElement,
            })

            renderer.autoClear = false
            renderer.autoClearColor = false
            renderer.autoClearDepth = false
            renderer.autoClearStencil = false

            let composer = new EffectComposer( renderer )

            camera.position.z = this.$store.state.freeCameraZ
            camera.rotation.z = Math.PI
            camera.rotation.y = Math.PI

            TweenMax.fromTo( camera.rotation, 30, {
                z: Math.PI + (-Math.PI / 256)
            }, {
                z: Math.PI + (Math.PI / 256),
                repeat: -1,
                yoyo: true
            } )


            TweenMax.fromTo( this.cameraOffset, 30, {
                x: -25
            }, {
                x: 25,
                repeat: -1,
                yoyo: true
            } )

            let lightGroup = new THREE.Group()
            lightGroup.name = "lights"

            let pointLight = new THREE.PointLight( 0xffffff, 1, 100000 );
            pointLight.intensity = 1.2;
            pointLight.position.y = 0

            lightGroup.add( pointLight )

            renderer.setClearColor(0xfff17f)    


            this.modules.scene = scene
            this.modules.camera = camera
            this.modules.renderer = renderer
            this.modules.lightGroup = lightGroup
            this.modules.pointLight = pointLight
            this.modules.composer = composer

            this.setupComposer()

            setInterval( ()=>{
                this.modules.time.x += 0.01
                this.modules.time.x = this.modules.time.x % 10
            }, 1000 / 30 )
        },
        setupComposer () {
            let renderPass = new RenderPass(this.modules.scene, this.modules.camera)
            let filmPass = new FilmPass(0.3333, 0.7, 10, false )
            let copyPass = new ShaderPass(CopyShader)
            let rgbsPass = new ShaderPass(RGBShiftShader)
            let colorCorPass = new ShaderPass(ColorCorrectionShader)

            rgbsPass.material.uniforms.amount.value = 0.0022

            this.modules.fx.passes = { 
                renderPass, 
                filmPass, 
                copyPass,
                rgbsPass,
                colorCorPass
            }

            _.getter( renderPass, "renderToScreen", ()=> !this.fxEnabled, ()=>{} )
            _.getter( [ filmPass, copyPass, rgbsPass, colorCorPass ], "enabled", ()=> this.fxEnabled )

            this.modules.composer.addPass(renderPass);
            this.modules.composer.addPass(colorCorPass)
            this.modules.composer.addPass(rgbsPass)
            this.modules.composer.addPass(filmPass)
            this.modules.composer.addPass(copyPass)
        },
        setupMatterEngine () {
            let modules = this.modules


            // create an engine
            var engine = Matter.Engine.create( {
                positionIterations: 1,
                velocityIterations: 1,
                constraintIterations: 1,
                // enableSleeping: true,
            } );

            engine.timing.timeScale = this.timeScale
            modules.matter.engine = engine
            modules.matter.engine.world.gravity.y = 0

            this.createMatterRenderer()
        },
        createMatterRenderer () {
            let boundsConfig = this.wonderMatterTestRendererBounds

            let minx = boundsConfig.x
            let miny = boundsConfig.y
            let maxy = boundsConfig.y + boundsConfig.height
            let maxx = boundsConfig.x + boundsConfig.width

            let render = Matter.Render.create({
                element: this.$refs.matterRenderer,
                engine: this.modules.matter.engine,
                bounds: {
                    min: {
                        x: minx,
                        y: miny
                    },
                    max: {
                        x: maxx,
                        y: maxy
                    }
                },
            });

            this.modules.matter.render = render
        },
        setupLights () {
            let modules = this.modules

            let sun0 = new THREE.PointLight( _.cssHex2Hex( "#fff7b3" ), 1, 1000000 )
            let sun1 = new THREE.PointLight( _.cssHex2Hex( "#fff7b3" ), 1, 1000000 )

            modules.scene.add( sun0 )
            modules.scene.add( sun1 )


            modules.lights.sun0 = sun0
            modules.lights.sun1 = sun1
        },
        setupBackground () {
            let self = this

            let modules = this.modules

            let vertShader = require( "raw-loader!shaders/bg.vert" ).default
            let fragShader = require( "raw-loader!shaders/color.frag" ).default
            // let fragShader = require( "raw-loader!shaders/helix.frag" ).default

            let geometry = new THREE.PlaneGeometry( 1, 1, 1)
            // geometry.translate( height / 2, width / 2, 0 )

            let bg = new THREE.Mesh ( geometry, new THREE.ShaderMaterial( {
                vertexShader: vertShader,
                fragmentShader: fragShader,
                uniforms: {
                    diffuse: {
                        value: new THREE.Color( 0x111111 ),
                    }
                },
                side: THREE.DoubleSide,
                transparent: true
            } ) )

            modules.bg = bg

            bg.frustumCulled = false
            bg.position.z = 1000

            modules.scene.add(bg)
        },
        startRendering () {
            this.prevRenderedFrameTime = +new Date()
            this.renderingActive = true

            if ( this.wonderMatterTestRenderer && this.modules.matter.render ) {
                Matter.Render.run( this.modules.matter.render )
            }
            // modules.matter.runner = Engine.run(modules.matter.engine);
            this.render()
        },
        render () {
            let modules = this.modules
            let now = +new Date()
            let delta = now - this.prevRenderedFrameTime

            if ( delta > 64 ) {
                delta = 64

            }
            this.prevRenderedFrameTime = now

            this.rafId = requestAnimationFrame( ()=> this.render() )

            this.updateThings( delta || 0 )
            this.renderFrame( delta )

           

        },
        updateMatterRendererBounds () {
            if ( ! this.modules.matter.render ) return
            let cameraPosition = this.modules.camera.position
            let render = this.modules.matter.render

                
            let width = window.innerWidth * DPR * this.wonderMatterTestRendererSize
            let height = window.innerHeight * DPR * this.wonderMatterTestRendererSize
            let screenAspect = width / height


            render.bounds.min.x = cameraPosition.x - ((width) / 2)
            render.bounds.min.y = cameraPosition.y - (height / 2)
            render.bounds.max.x = render.bounds.min.x + width * screenAspect
            render.bounds.max.y = render.bounds.min.y + height

        },
        updateThings (delta) {
            let modules = this.modules

            if ( this.modules.rooms.active ) {
                let room = this.modules.rooms.active
                let camera = this.modules.camera

                camera.position.x = room.data.rendering.root.position.x + 430 + this.cameraOffset.x
                camera.position.y = room.data.rendering.root.position.y + 364 + this.cameraOffset.y
                camera.position.z = this.$store.state.freeCameraZ * (-this.cameraOffset.z)

                this.modules.lights.sun0.position.x = camera.position.x
                this.modules.lights.sun0.position.y = camera.position.y
                this.modules.lights.sun0.position.z = camera.position.z 

                this.modules.lights.sun1.position.x = camera.position.x
                this.modules.lights.sun1.position.y = camera.position.y
                this.modules.lights.sun1.position.z = camera.position * -1
            }

            if ( this.wonderMatterTestRenderer ) {
                this.updateMatterRendererBounds()
            }

            if ( this.physicsEnabled ) {
                Matter.Engine.update(modules.matter.engine, 1000 / 60 );
            }

        },
        setBodiesPosition ( bodies, position ) {
            forEach( bodies, ( body )=>{
                Matter.Body.setPosition( body, position )
            } )
        },
        freezeComposite ( composite ) {
            forEach( composite.bodies, ( body )=>{
                Matter.Body.setVelocity( body, { x: 0, y: 0 } )
                Matter.Body.setAngularVelocity( body, 0 )
            } )
        },  
        renderFrame ( ) {
            this.modules.composer.render()
        },
        stopRendering () {
            this.renderingActive = false

            if ( this.wonderMatterTestRenderer && this.modules.matter.render ) {
                Matter.Render.stop( this.modules.matter.render )
            }

            cancelAnimationFrame( this.rafId )
        },
        updateSize () {
            let modules = this.modules

            let canvasElement = this.$refs.canvas

            let width = window.innerWidth * this.renderingResolution
            let height = window.innerHeight * this.renderingResolution

            modules.camera.aspect = this.$store.state.screenAspect =  width / height

            modules.pointLight.position.y = -height / 2

            modules.size.x = width
            modules.size.y = height

            modules.camera.updateProjectionMatrix()
            modules.renderer.setSize( width, height )
            modules.composer.setSize( width, height )

            if ( this.wonderMatterTestRenderer && this.modules.matter.render ) {
                this.modules.matter.render.options.width = width
                this.modules.matter.render.options.height = height
                this.updateMatterRendererBounds()
            }
        },
        createObject ( objectName, config, params) {
            let modules = this.modules
            let spawnX 
            let spawnY
            let composite
            let collisionGroup = -1

            if ( params && typeof params.spawnX == "number" ) {
                spawnX = params.spawnX || 0
            } else if ( config.spawnPosition ) {
                spawnX = config.spawnPosition.x || 0
            } else {
                spawnX = 0
            }

            if ( params && typeof params.spawnY == "number" ) {
                spawnY = params.spawnY ||  0
            } else if ( config.spawnPosition ) {
                spawnY = config.spawnPosition.y ||  0
            } else {
                spawnY = 0
            }            

            if ( params && typeof params.collisionGroup == "number" ) {
                collisionGroup = params.collisionGroup
            } else {
                collisionGroup = config.collisionGroup || 0
            }

            forEach( config.bodies, ( bodyConfig, name )=>{
                let geometry
                let material
                let matterBody

                let x = spawnX + (bodyConfig.x || 0)
                let y = spawnY + (bodyConfig.y || 0)

                let zIndex = bodyConfig.zIndex  == "number" ? bodyConfig.zIndex : 0;

                modules.objects[ objectName ] = modules.objects[ objectName ]  || {
                    parts: {},
                    bodies: []
                }

                switch ( bodyConfig.geometry ) {
                    case "rectangle":
                        geometry = new THREE.PlaneBufferGeometry( bodyConfig.width, bodyConfig.height, 1 )
                        // geometry.translate( bodyConfig.width/2, 0, 0 )
                        matterBody = Matter.Bodies.rectangle( x, y, bodyConfig.width, bodyConfig.height, {
                            collisionFilter: {
                                group: collisionGroup
                            },
                            chamfer: {
                                radius: bodyConfig.chamfer || 0
                            },
                            render: {
                                fillStyle: bodyConfig.color
                            }
                        } )

                        // Matter.Body.translate( matterBody, { x: -bodyConfig.width / 2, y: 0 } )
                    break;
                    case "circle":
                        geometry = new THREE.CircleBufferGeometry( bodyConfig.radius, 32 )
                        matterBody = Matter.Bodies.circle( x, y, bodyConfig.radius, {
                            collisionFilter: {
                                group: collisionGroup
                            },
                        }, 32 )
                    break;
                }

                let color = bodyConfig.color
                let texture

                if ( color ) {
                    color = _.cssHex2Hex( bodyConfig.color )
                }


                if ( bodyConfig.texture ) texture = this.laodTexture( bodyConfig.texture )

                material = new THREE.MeshPhongMaterial( {
                    color,
                    map: texture,
                    transparent: true,
                    depthTest: true,
                    side: THREE.DoubleSide,
                } )

                


                _.getter( material, "wireframe", ()=>{
                    return this.wireframeMode
                } )

                if ( texture && typeof bodyConfig.textureFlip == "boolean" ) {
                    material.map.flipY = !bodyConfig.textureFlip
                    material.map.needsUpdate = true
                }

                if ( bodyConfig.bumpMap ) {
                    let bumpMap = this.laodTexture( bodyConfig.bumpMap )

                    _.getter( material, "bumpMap", ()=>{
                        if ( this.bumpmappingEnabled ) {
                            return bumpMap
                        }
                    } )

                    _.getter( material, "bumpScale", ()=>{
                        return (material._bumpScale * this.bumpmapMultiplier * DPR)
                    }, ( value )=>{
                        material._bumpScale = value
                    } )


                    if ( typeof bodyConfig.bumpScale == "number" ) {
                        material.bumpScale = bodyConfig.bumpScale
                    }

                    if ( typeof bodyConfig.textureFlip == "boolean" ) {
                        bumpMap.flipY = !bodyConfig.textureFlip
                        bumpMap.needsUpdate = true
                    }
                }

                if ( typeof bodyConfig.opacity == "number" ) {
                    material.opacity = bodyConfig.opacity
                }

                let mesh = new THREE.Mesh( geometry, material )
                mesh.position.z = zIndex

                if ( bodyConfig.scale ) {
                    mesh.scale.x = bodyConfig.scale.x
                    mesh.scale.y = bodyConfig.scale.y
                }

                matterBody.restitution = typeof bodyConfig.restitution == "number" ? bodyConfig.restitution : 0.01
                matterBody.frictionAir = typeof bodyConfig.frictionAir == "number" ? bodyConfig.frictionAir : 0.001
                matterBody.friction    = typeof bodyConfig.friction == "number" ? bodyConfig.friction : 0.2

                if ( typeof bodyConfig.density == "number" ) {
                    Matter.Body.setDensity( matterBody , bodyConfig.density );
                }

                if ( typeof bodyConfig.mass == "number" ) {
                    Matter.Body.setMass( matterBody , bodyConfig.mass );
                }


                if ( typeof bodyConfig.angle == "number" ) {
                    Matter.Body.setAngle( matterBody , bodyConfig.angle );
                }

                if ( typeof bodyConfig.static == "boolean" ) {
                    Matter.Body.setStatic( matterBody, bodyConfig.static )
                }



                modules.objects[ objectName ].parts[ name ] = {
                    mesh,
                    matterBody
                }

                modules.objects[ objectName ].bodies.push( matterBody )

                modules.renderGroups.objects.add( mesh )

                if ( !config.composite ) {
                    Matter.World.add(modules.matter.engine.world, [ matterBody ]);
                }

            } )


            if ( config.composite ) {

                composite = Matter.Composite.create( {} )

                forEach( config.bodies, ( bodyConfig, name )=>{
                    let bodyA = modules.objects[ objectName ].parts[ name ].matterBody

                    Matter.Composite.add( composite, [ bodyA ] )

                    if ( bodyConfig.constraint ) {
                        let constraint = bodyConfig.constraint
                        let bodyA = modules.objects[ objectName ].parts[ name ].matterBody
                        let bodyB = modules.objects[ objectName ].parts[ constraint.body ] ? modules.objects[ objectName ].parts[ constraint.body ].matterBody : undefined


                        Matter.Composite.add( composite, Matter.Constraint.create( {
                            bodyA,
                            bodyB,
                            pointA: constraint.pointA,
                            pointB: constraint.pointB,
                            stiffness: typeof constraint.stiffness == "number" ? constraint.stiffness : 1,
                            length: typeof constraint.length == "number" ? constraint.length : 1
                        } ) )
                    }

                    if ( bodyConfig.constraints ) {
                        forEach( bodyConfig.constraints, ( constraint, index )=>{
                            let bodyA = modules.objects[ objectName ].parts[ name ].matterBody
                            let bodyB = modules.objects[ objectName ].parts[ constraint.body ] ? modules.objects[ objectName ].parts[ constraint.body ].matterBody : undefined;


                            Matter.Composite.add( composite, Matter.Constraint.create( {
                                bodyA,
                                bodyB,
                                pointA: constraint.pointA,
                                pointB: constraint.pointB,
                                stiffness: typeof constraint.stiffness == "number" ? constraint.stiffness : 1,
                                length: typeof constraint.length == "number" ? constraint.length : 1
                            } ) )
                        } )
                    }

                } )

    
                modules.objects[ objectName ].composite = composite
                Matter.World.add(modules.matter.engine.world, [ composite ]);
            }

            return modules.objects[ objectName ]
        },
    }

}
   
</script>

<style lang="sass">
    import "sass/wonderland.scss"
</style>