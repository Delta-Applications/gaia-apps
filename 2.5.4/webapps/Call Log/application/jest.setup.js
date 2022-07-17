window.performance.mark = jest.fn();
window.performance.measure = jest.fn();

window.navigator.mozSettings = {
  addObserver: jest.fn(),
  createLock: () => ({
    get: () => ({
      then: jest.fn(),
      addEventListener: jest.fn()
    })
  })
};

window.navigator.mozL10n = {
  get: jest.fn()
};
