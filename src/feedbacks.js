const { combineRgb } = require('@companion-module/base')

module.exports = {
	initFeedbacks: function () {
		let self = this
		let feedbacks = {}

		const colorWhite = combineRgb(255, 255, 255) // White
		const colorRed = combineRgb(255, 0, 0) // Red

		feedbacks.videoChannel = {
			type: 'boolean',
			name: 'Selected Video Input is Routed to Selected Output',
			description:
				'Change the button color based on the selected video input being routed to the selected output',
			defaultStyle: {
				color: colorWhite,
				bgcolor: colorRed,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output',
					default: 1,
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: 1,
					choices: self.CHOICES_INPUTS,
				},
			],
			callback: function (feedback, bank) {
				let options = feedback.options
				let input = options.input
				let output = options.output

				if (self.DATA.outputs[output].currentVideoInput === input) {
					return true
				}

				return false
			},
		}

		feedbacks.audioMute = {
			type: 'boolean',
			name: 'Output Audio is Muted',
			description: 'Change the button color based on the output audio being muted',
			defaultStyle: {
				color: colorWhite,
				bgcolor: colorRed,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output',
					default: 1,
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Mute',
					id: 'mute',
					default: 1,
					choices: [
						{ id: 0, label: 'Muted' },
						{ id: 1, label: 'Unmuted' },
					],
				},
			],
			callback: function (feedback, bank) {
				let options = feedback.options
				let output = options.output
				let mute = options.mute

				if (self.DATA.outputs[output].audioMute === mute) {
					return true
				}

				return false
			},
		}

		self.setFeedbackDefinitions(feedbacks)
	},
}
