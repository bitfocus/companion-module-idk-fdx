module.exports = {
	initVariables() {
		let self = this
		const variables = []
		 const count = self.CHOICES_OUTPUTS?.length || 0
		//GSW & GAM
		for (let i = 1; i <= count; i++) {
			variables.push({ variableId: `output_${i}_video_input`, name: `Output Channel ${i} - Video Input` })
			variables.push({ variableId: `output_${i}_audio_mute`, name: `Output Channel ${i} - Audio Mute` })
		}
		self.setVariableDefinitions(variables)
	},
}
