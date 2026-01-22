const { InstanceStatus, TCPHelper } = require('@companion-module/base')

module.exports = {
	async initConnection() {
		let self = this

		if (self.config.host && self.config.host !== '') {
			self.openSocket()
		}
	},

	openSocket() {
		let self = this

		//clear any existing intervals
		clearInterval(self.INTERVAL)

		self.updateStatus(InstanceStatus.Connecting)

		self.socket = new TCPHelper(self.config.host, self.config.port)

		self.socket.on('connect', () => {
			self.updateStatus(InstanceStatus.Ok)

			self.getData() //get initial data
			//start polling, if enabled
			if (self.config.polling) {
				self.INTERVAL = setInterval(() => {
					self.getData()
				}, self.config.pollInterval)
			}

			//send any commands in the queue
			if (self.commandQueue) {
				self.commandQueue.forEach((command) => {
					if (self.config.verbose) {
						self.log('debug', `Sending queued command: ${command}`)
					}
					self.sendCommand(command)
				})
			}
		})

		self.socket.on('error', (error) => {
			self.log('error', error.toString())
			self.updateStatus(InstanceStatus.UnknownError)
		})

		self.socket.on('data', (data) => {
			self.processData(data)
		})

		self.socket.on('close', () => {
			self.updateStatus(InstanceStatus.Disconnected)
		})
	},

	getData() {
		let self = this
		self.sendCommand('@GIV')
		self.sendCommand('@GSW') //get io channel status
		self.sendCommand('@GAM') //get audio mute status
	},

	async processData(data) {
		let self = this

		let response = data.toString()
		let sections = response.split(',')

		if (self.config.verbose) {
			self.log('debug', `Received: ${response}`)
		}

		if (sections[0].indexOf('@ERR') !== -1) {
			self.log('error', response)
			self.log('error', `Last Command: ${self.lastCommand}`)

			let errorCode = parseInt(sections[1]) //ensure this is an integer

			if (errorCode === 1) {
				self.log('error', 'Erroneous parameter format or value')
			} else if (errorCode === 2) {
				self.log('error', 'Undefined command or wrong format')
			} else if (errorCode === 3) {
				self.log('error', 'Currently cannot be used')
			} else if (errorCode === 4) {
				self.log('error', 'Loading EDID from the sink device failed')
			}

			return
		}
		self.DATA = self.DATA || {};
		if (!Array.isArray(self.DATA.outputs)) self.DATA.outputs = []
		let variableObj = {}

		switch (sections[0]) {
			case '@GIV':
			case '@GIV': {
				// 例: @GIV,FDX-S16U,02.00.00,12,16
				const model = sections[1]?.trim()
				const { inputs, outputs } = self.getMaxIoByModel(model)


				// Input choices（0=All を入れる）
				self.CHOICES_INPUTS = [{ id: 0, label: 'OFF' }]
				for (let i = 1; i <= inputs; i++) {
					self.CHOICES_INPUTS.push({ id: i, label: `Input ${i}` })
				}

				// Output choices（All outputs が要るなら 0 を入れる）
				self.CHOICES_OUTPUTS = [{ id: 0, label: 'All' }]
				for (let i = 1; i <= outputs; i++) {
					self.CHOICES_OUTPUTS.push({ id: i, label: `Output ${i}` })
				}

				self.initActions()
				self.initFeedbacks()
				self.initVariables()

			}
				break
			case '@GSW':
				//the number of sections is the number of outputs, and the value of the section is the input assigned to that output number
				//self.DATA.outputs = {} //clear the outputs
				for (let i = 1; i < sections.length; i++) {
					let input = parseInt(sections[i])
					if (!self.DATA.outputs[i]) self.DATA.outputs[i] = {}
					self.DATA.outputs[i].currentVideoInput = input
					variableObj[`output_${i}_video_input`] = input
				}

				break
			case '@GAM':
				//the number of sections is the number of outputs, and the value of the section is the mute status of that output number
				for (let i = 1; i < sections.length; i++) {
					let mute = parseInt(sections[i])
					if (!self.DATA.outputs[i]) self.DATA.outputs[i] = {}
					self.DATA.outputs[i].audioMute = mute
					variableObj[`output_${i}_audio_mute`] = mute === 0 ? 'Muted' : 'Unmuted'
				}
				break
		}

		self.setVariableValues(variableObj)
		self.checkFeedbacks()
	},

	async sendCommand(command) {
		let self = this


		if (self.socket && self.socket.isConnected) {
			if (self.config.verbose) {
				self.log('debug', `Sending: ${command}`)
			}

			self.socket.send(command + '\r\n')
			self.lastCommand = command

			//remove from queue if needed
			if (self.commandQueue) {
				let index = self.commandQueue.indexOf(command)
				if (index !== -1) {
					self.commandQueue.splice(index, 1)
				}
			}
		} else {
			self.log('error', 'Socket not connected. Attempting to reconnect...')
			self.addToQueue(command)
			self.openSocket()
		}
	},

	addToQueue(command) {
		let self = this

		if (!self.commandQueue) {
			self.commandQueue = []
		}

		if (self.config.verbose) {
			self.log('debug', `Adding to queue: ${command}`)
		}

		self.commandQueue.push(command)

		console.log(self.commandQueue)
	},
	// Determine maximum I/O channels based on FDX model suffix
	// e.g. "FDX-S16U" -> "S16U" -> max inputs/outputs = 16
	getMaxIoByModel(model) {
		const m = (model || '').toUpperCase()

		const suffix = m.split('FDX-')[1] || m // 雑に
		// Extract model suffix from full model string
		// Example: "FDX-S16U" -> "S16U"

		switch (suffix) {
			case 'S64U':
				return { inputs: 64, outputs: 64 }
			case 'S32U':
				return { inputs: 32, outputs: 32 }
			case 'S16U':
				return { inputs: 16, outputs: 16 }
			case 'S08U':
				return { inputs: 8, outputs: 8 }
			default:
				return { inputs: 16, outputs: 16 } //default
		}
	}
}
