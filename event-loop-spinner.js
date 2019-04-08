const async_hooks = require('async_hooks');

class EventLoopSpinner{
  constructor() {
    this.hooksMap = {};
    this.blockedSince = Date.now();

    const asyncHook = async_hooks.createHook({
      init: (asyncId, type, triggerAsyncId, resource) => {
        this.hooksMap[asyncId] = {type};
      },
      before: (asyncId) => {
        if (asyncId === 0) {
          return;
        }
        if (!['TickObject', 'Microtask', 'PROMISE'].includes(this.hooksMap[asyncId].type)) {
          this.blockedSince = Date.now();
        }
      },
      destroy: (asyncId) => {
        delete this.hooksMap[asyncId];
      }
    });
    asyncHook.enable();
  }

  isStarving(thresholdMs = 100) {
    return Date.now() - this.blockedSince > thresholdMs;
  }

  async spin() {
    return new Promise(setImmediate);
  }
}

const eventLoopSpinner = new EventLoopSpinner();

module.exports = {
  eventLoopSpinner,
}
