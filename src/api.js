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

		self.sendCommand('@GSW') //get io channel status
		self.sendCommand('@GAM,0') //get audio mute status
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

		let variableObj = {}

		switch (sections[0]) {
			case '@GSW':
				//the number of sections is the number of outputs, and the value of the section is the input assigned to that output number
				self.DATA.outputs = {} //clear the outputs
				for (let i = 1; i < sections.length; i++) {
					let input = parseInt(sections[i])
					self.DATA.outputs[i].currentVideoInput = input
					variableObj[`output_${i}_video_input`] = input
				}

				//if the number of outputs is not equal to the number of CHOICES_OUTPUTS, update the CHOICES_OUTPUTS
				if (sections.length - 1 !== self.CHOICES_OUTPUTS.length) {
					self.CHOICES_OUTPUTS = []
					for (let i = 1; i < sections.length; i++) {
						self.CHOICES_OUTPUTS.push({ id: i, label: `Output ${i}` })
					}
					self.initActions() //reinitialize actions
					self.initFeedbacks() //reinitialize feedbacks
					self.initVariables() //reinitialize variables
				}
				break
			case '@GAM':
				//the number of sections is the number of outputs, and the value of the section is the mute status of that output number
				for (let i = 1; i < sections.length; i++) {
					let mute = parseInt(sections[i])
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
}
