module.exports = {
	initVariables() {
		let self = this
		let variables = []

		//GSW & GAM
		for (let i = 0; i < self.DATA.outputs.length; i++) {
			variables.push({ variableId: `output_${i}_video_input`, name: `Output Channel ${i} - Video Input` })
			variables.push({ variableId: `output_${i}_audio_mute`, name: `Output Channel ${i} - Audio Mute` })
		}

		self.setVariableDefinitions(variables)
	},
}
