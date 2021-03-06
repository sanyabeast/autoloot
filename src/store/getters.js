import _ from "Helpers";
import Device from "device.js/dist/device"
import Bowser from "bowser"

import packageData from "../../package.json"

const browser = Bowser.getParser(window.navigator.userAgent);
const device = new Device()

import Benchmark from "Benchmark"

window.Benchmark = Benchmark


var getters = {
	performanceIndex ( state ) {

		if ( state.performanceIndex > 0 ) {
			return state.performanceIndex
		}

		let benchmark = new Benchmark()
		let index = benchmark.run().index
		return index
	},	
	translation ( state ) {
		return state.translations[ state.language ]
	},
	routes ( state ) {
		return state.routes[ state.currentPage ]
	},
	defaultSettings ( state, getters ) {
		state.performanceIndex = -1

		let performanceIndex = getters.performanceIndex
		let bumpmappingEnabled = false
		let renderingResolution = 1
		let fxEnabled = false

		if ( performanceIndex >= 0.39 ) {
			fxEnabled = true
		}

		if ( performanceIndex >= 0.65 ) {
			bumpmappingEnabled = true
			fxEnabled = true
		}

		if ( device.ios || performanceIndex >= 0.85 ) {
			bumpmappingEnabled = true
			renderingResolution = state.DPR
			fxEnabled = true
		}

		return {
			soundMuted: false,
			physicsEnabled: true,
			gravityX: 0,
			speedCamera: true,
			freeCamera: false,
			freeCameraZ: 400,
			bumpmappingEnabled: bumpmappingEnabled,
			bumpmapMultiplier: 0.5,
			saveChunks: false,
			enginePower: 1,
			wireframeMode: false,
			wonderMatterTestRenderer: false,
			wonderMatterTestRendererSize: 1,
			timeScale: 1,
			fxEnabled: fxEnabled,
			version: packageData.version,
			renderingResolution: renderingResolution,
			performanceIndex: performanceIndex

		}
	}
};

export default getters;      