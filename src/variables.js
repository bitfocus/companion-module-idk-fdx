module.exports = {
	initVariables() {
		let self = this
		const variables = []
		for (const o of this.CHOICES_OUTPUTS ?? []) {
			if (o.id === 0) continue

			const i = o.id
			variables.push({ variableId: `output_${i}_video_input`, name: `Output Channel ${i} - Video Input` })
			variables.push({ variableId: `output_${i}_audio_mute`, name: `Output Channel ${i} - Audio Mute` })
		}
		self.setVariableDefinitions(variables)
	},
}
