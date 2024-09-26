module.exports = {
	initActions: function () {
		let self = this
		let actions = {}

		actions.SSW = {
			name: 'I/O Channel Switching',
			description: 'Switch the input going to an output',
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
			callback: async function (action) {
				let options = action.options
				let output = options.output
				let input = options.input
				let command = `@SSW,${input},${output}`
				self.sendCommand(command)
			},
		}

		actions.SAM = {
			name: 'Audio Mute',
			description: 'Mute or Unmute an Output',
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
						{ id: 0, label: 'Mute' },
						{ id: 1, label: 'Unmute' },
					],
				},
			],
			callback: async function (action) {
				let options = action.options
				let output = options.output
				let mute = options.mute
				let command = `@SAM,${output},${mute}`
				self.sendCommand(command)
			},
		}

		actions.RCM = {
			name: 'Load Crosspoint Preset',
			description: 'Load a crosspoint preset',
			options: [
				{
					type: 'number',
					label: 'Crosspoint Number',
					id: 'crosspoint',
					default: 1,
					min: 1,
					max: 32,
					required: true,
				},
			],
			callback: async function (action) {
				let options = action.options
				let command = `@RCM,${options.crosspoint}`
				self.sendCommand(command)
			},
		}

		actions.RPM = {
			name: 'Load Preset',
			description: 'Load a preset',
			options: [
				{
					type: 'number',
					label: 'Preset Number',
					id: 'preset',
					default: 1,
					min: 1,
					max: 32,
					required: true,
				},
			],
			callback: async function (action) {
				let options = action.options
				let command = `@RPM,${options.preset}`
				self.sendCommand(command)
			},
		}

		actions.RBT = {
			name: 'Reboot Device',
			description: 'Reboot the device',
			callback: async function () {
				self.sendCommand('@RBT')
			},
		}

		actions.sendCustomCommand = {
			name: 'Send Custom Command',
			description: 'Send a custom command to the device',
			options: [
				{
					type: 'textinput',
					label: 'Command',
					id: 'command',
					default: '',
					useVariables: true,
				},
			],
			callback: async function (action) {
				let options = action.options
				let command = await self.parseVariablesInString(options.command)
				self.sendCommand(command)
			},
		}

		self.setActionDefinitions(actions)
	},
}
