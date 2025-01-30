let toolkit;
const backlog = [];

/**
 * Parse and respond to messages sent by NeonCore.
 * @param {MessageEvent} evt
 */
function handleNeonEvent(evt) {
  const data = evt.data;
  const result = {
    id: data.id,
  };

  console.log('VerovioWorker: received message', data);

  switch (data.action) {
    case 'renderData':
      try {
        result.svg = toolkit.renderData(data.mei, {});
        console.log('VerovioWorker: rendered SVG', result.svg);
      } catch (error) {
        console.error('VerovioWorker: error rendering data', error);
        result.error = error.message;
      }
      break;
    case 'getElementAttr':
      try {
        result.attributes = toolkit.getElementAttr(data.elementId);
      } catch (error) {
        console.error('VerovioWorker: error getting element attributes', error);
        result.error = error.message;
      }
      break;
    case 'edit':
      try {
        result.result = toolkit.edit(data.editorAction);
      } catch (error) {
        console.error('VerovioWorker: error editing', error);
        result.error = error.message;
      }
      break;
    case 'getMEI':
      try {
        result.mei = toolkit.getMEI({
          pageNo: 0,
          scoreBased: true,
        });
      } catch (error) {
        console.error('VerovioWorker: error getting MEI', error);
        result.error = error.message;
      }
      break;
    case 'editInfo':
      try {
        result.info = toolkit.editInfo();
      } catch (error) {
        console.error('VerovioWorker: error getting edit info', error);
        result.error = error.message;
      }
      break;
    case 'renderToSVG':
      try {
        result.svg = toolkit.renderToSVG(1);
      } catch (error) {
        console.error('VerovioWorker: error rendering to SVG', error);
        result.error = error.message;
      }
      break;
    default:
      console.error('VerovioWorker: unknown action', data.action);
      result.error = 'Unknown action: ' + data.action;
      break;
  }

  postMessage(result);
  console.log('VerovioWorker: sent response', result);
}

importScripts(
  'https://www.verovio.org/javascript/develop/verovio-toolkit-wasm.js',
);

verovio.module.onRuntimeInitialized = () => {
  toolkit = new verovio.toolkit();
  toolkit.setOptions({
    inputFrom: 'mei',
    footer: 'none',
    header: 'none',
    pageMarginLeft: 0,
    pageMarginTop: 0,
    font: 'Bravura',
    useFacsimile: false,
  });
  console.debug('VerovioWorker: toolkit initialized');
  onmessage = handleNeonEvent;
  for (const message of backlog) {
    handleNeonEvent(message);
  }
};
