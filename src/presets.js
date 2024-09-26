const { combineRgb } = require('@companion-module/base')

module.exports = {
	initPresets: function () {
		let self = this
		let presets = []

		const colorWhite = combineRgb(255, 255, 255) // White
		const colorBlack = combineRgb(0, 0, 0) // Black

		presets = [
			{
				category: 'General',
				name: 'Set Converter Mode to Encoder',
				style: {
					text: 'Encoder',
					size: '18',
					color: colorWhite,
					bgcolor: colorBlack,
				},
				steps: [
					{
						down: [
							{
								actionId: 'modeSwitch',
								options: {
									mode: 'encoder',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'mode',
						options: {
							mode: 'encoder',
						},
					},
				],
			},
		]

		self.setPresetDefinitions(presets)
	},
}
