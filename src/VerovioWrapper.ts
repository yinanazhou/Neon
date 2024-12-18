import { VerovioMessage } from './Types';

/**
 * A wrapper around the verovio web worker to permit mocking in tests.
 */
export default class VerovioWrapper {
  verovioWorker: Worker;
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      this.verovioWorker = new Worker(
        __ASSET_PREFIX__ + 'workers/VerovioWorker.js'
      );
    } else {
      this.verovioWorker = new Worker(
        __ASSET_PREFIX__ + 'workers/VerovioWorker-dev.js'
      );
    }
  }

  /**
   * Set an event listener onto the actual web worker.
   */
  addEventListener(
    type: string,
    handler: EventListenerOrEventListenerObject
  ): void {
    return this.verovioWorker.addEventListener(type, handler);
  }

  /**
   * Send a message to the actual web worker.
   */
  postMessage(message: VerovioMessage): void {
    return this.verovioWorker.postMessage(message);
  }
}
