const EventEmitter = require('events');

class ToolInterface extends EventEmitter {
  constructor(config = {}) {
    super();
    this.name = '';
    this.version = '';
    this.enabled = true;
    this.config = config;
    this.status = 'idle';
    this.progress = 0;
    this.currentProcess = null;
  }

  async validate() {
    throw new Error('validate() must be implemented by subclass');
  }

  async execute(targets, options = {}) {
    throw new Error('execute() must be implemented by subclass');
  }

  async getProgress() {
    return {
      status: this.status,
      progress: this.progress,
      message: ''
    };
  }

  async cancel() {
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM');
      this.status = 'cancelled';
      this.emit('cancelled');
      return true;
    }
    return false;
  }

  getParser() {
    throw new Error('getParser() must be implemented by subclass');
  }

  getName() {
    return this.name;
  }

  getVersion() {
    return this.version;
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  updateProgress(progress, message = '') {
    this.progress = progress;
    this.emit('progress', { progress, message });
  }

  updateStatus(status) {
    this.status = status;
    this.emit('status', { status });
  }
}

module.exports = ToolInterface;
