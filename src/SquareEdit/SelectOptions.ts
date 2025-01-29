import * as Contents from './Contents';
import * as Grouping from './Grouping';
import Notification from '../utils/Notification';
import NeonView from '../NeonView';
import { SplitStaffHandler } from './StaffTools';
import { SplitNeumeHandler } from './NeumeTools';
import {
  ChainAction,
  ChangeStaffAction,
  DisplaceClefOctaveAction,
  EditorAction,
  MatchHeightAction,
  RemoveAction,
  SetAction,
  SetClefAction,
  SetLiquescentAction,
} from '../Types';
import { getStaffBBox } from '../utils/SelectTools';
import { ModalWindow, ModalWindowView } from '../utils/ModalWindow';

/**
 * The NeonView parent to call editor actions.
 */
let neonView: NeonView;

/**
 * Initialize NeonView.
 */
export function initNeonView(view: NeonView): void {
  neonView = view;
  Grouping.initNeonView(view);
}

/**
 * @param id - The id of the neume component.
 * @returns An action that unsets the inclinatum parameter of a neume component.
 */
export function unsetInclinatumAction(id: string): SetAction {
  return {
    action: 'set',
    param: {
      elementId: id,
      attrType: 'tilt',
      attrValue: '',
    },
  };
}

/**
 * @param id - The id of the neume component.
 * @returns An action that unsets the virga parameter of a neume component.
 */
export function unsetVirgaAction(id: string): SetAction {
  return {
    action: 'set',
    param: {
      elementId: id,
      attrType: 'tilt',
      attrValue: '',
    },
  };
}

/**
 * @param id - The id of the neume component.
 * @returns An action that unsets the reversed virga parameter of a neume component.
 */
export function unsetVirgaReversedAction(id: string): SetAction {
  return {
    action: 'set',
    param: {
      elementId: id,
      attrType: 'tilt',
      attrValue: '',
    },
  };
}

/**
 * @param id - The id of the neume component.
 * @returns An action that unsets the liquescent_clockwise parameter of a neume component.
 */
export function unsetLiquescentClockwiseAction(id: string): SetAction {
  return {
    action: 'set',
    param: {
      elementId: id,
      attrType: 'curve',
      attrValue: '',
    },
  };
}

/**
 * @param id - The id of the neume component.
 * @returns An action that unsets the liquescent_anticlockwise parameter of a neume component.
 */
export function unsetLiquescentAnticlockwiseAction(
  id: string,
): SetLiquescentAction {
  return {
    action: 'setLiquescent',
    param: {
      elementId: id,
      curve: '',
    },
  };
}

/** Event handler for delete button press. */
export function deleteButtonHandler(evt: KeyboardEvent): void {
  if (evt.key === 'd' || evt.key === 'Backspace') {
    removeHandler();
    evt.preventDefault();
  }
}

/**
 * End the extra options menu.
 */
export function endOptionsSelection(): void {
  const moreEdit = document.getElementById('moreEdit');
  const extraEdit = document.getElementById('extraEdit');
  if (moreEdit) {
    moreEdit.innerHTML = '';
    moreEdit.parentElement.classList.add('hidden');
  }
  if (extraEdit) {
    extraEdit.innerHTML = '';
    extraEdit.parentElement.classList.add('hidden');
  }
  document.body.removeEventListener('keydown', deleteButtonHandler);
}

/**
 * Function to handle removing elements
 */
export function removeHandler(): void {
  const toRemove: RemoveAction[] = [];
  const selected = Array.from(document.getElementsByClassName('selected'));
  selected.forEach((elem) => {
    if (elem.classList.contains('syl')) {
      elem = elem.closest('.syllable');
    }
    if (elem.classList.contains('accid')) {
      elem = elem.closest('.accid');
    }
    if (elem.classList.contains('divLine')) {
      elem = elem.closest('.divLine');
    }
    toRemove.push({
      action: 'remove',
      param: {
        elementId: elem.id,
      },
    });
  });
  const chainAction: ChainAction = {
    action: 'chain',
    param: toRemove,
  };
  endOptionsSelection();
  neonView.edit(chainAction, neonView.view.getCurrentPageURI()).then(() => {
    neonView.updateForCurrentPage();
  });
}

/**
 * Function to handle re-associating elements to the nearest staff
 */
export function changeStaffHandler(): void {
  const toChange: ChangeStaffAction[] = [];
  const selected = Array.from(document.getElementsByClassName('selected'));
  selected.forEach((elem) => {
    toChange.push({
      action: 'changeStaff',
      param: {
        elementId: elem.id,
      },
    });
  });
  const chainAction: EditorAction = {
    action: 'chain',
    param: toChange,
  };
  endOptionsSelection();
  neonView.edit(chainAction, neonView.view.getCurrentPageURI()).then(() => {
    neonView.updateForCurrentPage();
  });
}

/**
 * Function to handle inserting divisio or accidental into nearest syllable
 */
export function insertToSyllableHandler(): void {
  const toInsert: EditorAction[] = [];
  const selected = Array.from(document.getElementsByClassName('selected'));
  selected.forEach((elem) => {
    toInsert.push({
      action: 'insertToSyllable',
      param: {
        elementId: elem.id,
      },
    });
  });
  const chainAction: ChainAction = {
    action: 'chain',
    param: toInsert,
  };
  neonView
    .edit(chainAction, neonView.view.getCurrentPageURI())
    .then((result) => {
      if (result) {
        Notification.queueNotification('Insert Success', 'success');
      } else {
        Notification.queueNotification('Insert Failed XoX', 'error');
      }
      endOptionsSelection();
      neonView.updateForCurrentPage();
    });
}

/**
 * Function to handle moving divisio or accidental out of syllable
 */
export function moveOutsideSyllableHandler(): void {
  const toMove: EditorAction[] = [];
  const selected = Array.from(document.getElementsByClassName('selected'));
  selected.forEach((elem) => {
    toMove.push({
      action: 'moveOutsideSyllable',
      param: {
        elementId: elem.id,
      },
    });
  });
  const chainAction: ChainAction = {
    action: 'chain',
    param: toMove,
  };
  neonView
    .edit(chainAction, neonView.view.getCurrentPageURI())
    .then((result) => {
      if (result) {
        Notification.queueNotification('Move Success', 'success');
      } else {
        Notification.queueNotification('Move Failed XoX', 'error');
      }
      endOptionsSelection();
      neonView.updateForCurrentPage();
    });
}

/**
 * Function to match bbox height to the selected bbox
 */
export function matchHeightHandler(): void {
  const selected = Array.from(document.getElementsByClassName('selected'));
  if (selected.length > 1) {
    Notification.queueNotification(
      'Cannot match height to multiple bbox',
      'error',
    );
  }
  const toChange: MatchHeightAction = {
    action: 'matchHeight',
    param: {
      elementId: selected[0].id,
    },
  };

  neonView.edit(toChange, neonView.view.getCurrentPageURI()).then((result) => {
    if (result) {
      Notification.queueNotification('Height Match Success', 'success');
    } else {
      Notification.queueNotification('Height Match Failed XoX', 'error');
    }
    endOptionsSelection();
    neonView.updateForCurrentPage();
  });
}

/**
 * Opens Add Syl Text modal window with UI for entering syllable text.
 */
function openAddSylWindow(): void {
  // generate modal window
  const modalWindow = neonView.modal;
  modalWindow.setModalWindowView(ModalWindowView.ADD_TEXT);
  modalWindow.openModalWindow();
}

export function addAddSylListener(): void {
  const addSyl = document.getElementById('addSyl');
  addSyl?.removeEventListener('click', openAddSylWindow);
  addSyl?.addEventListener('click', openAddSylWindow);
}

function addDeleteListener(): void {
  const del = document.getElementById('delete');

  if (del) {
    del.removeEventListener('click', removeHandler);
    del.addEventListener('click', removeHandler);

    // TODO: should this be outside the if condition?
    document.body.addEventListener('keydown', deleteButtonHandler);
  }
}

export function addChangeStaffListener(): void {
  const changeStaff = document.getElementById('changeStaff');
  changeStaff?.removeEventListener('click', changeStaffHandler);
  changeStaff?.addEventListener('click', changeStaffHandler);
}

/**
 * Update the column number in the input
 */
function updateColumnInfo(): void {
  const colInput = document.getElementById('col-input') as HTMLInputElement;
  const staves = document.querySelectorAll('.staff.selected');
  let colInfo: number;
  for (const staff of staves) {
    const hasColumn = Array.from(staff.classList)
      .join(' ')
      .match(/\bcolumn(\d+)\b/);
    if (hasColumn) {
      const staffCol = parseInt(hasColumn[1], 10);
      if (colInfo && colInfo != staffCol) {
        const warning = document.getElementById('col-warning');
        warning.innerText = 'The selected staves are not of the same column!';
        colInfo = 0;
        break;
      } else {
        colInfo = staffCol;
      }
    }
  }
  if (colInfo) colInput.value = colInfo.toString();
}

/**
 * Add column info edit handler for column info editor
 */
function addColumnInfoStepHandler(): void {
  const decrementButton = document.getElementById(
    'col-decrement',
  ) as HTMLButtonElement;
  const incrementButton = document.getElementById(
    'col-increment',
  ) as HTMLButtonElement;
  const confirmButton = document.getElementById(
    'col-confirm',
  ) as HTMLButtonElement;
  const colInput = document.getElementById('col-input') as HTMLInputElement;

  decrementButton.addEventListener('click', function () {
    updateNumber(-1);
  });

  incrementButton.addEventListener('click', function () {
    updateNumber(1);
  });

  // Add column info edit handler
  confirmButton.addEventListener('click', function () {
    const toSetColumn: EditorAction[] = [];
    const staves = document.querySelectorAll('.staff.selected');
    staves.forEach((staff) => {
      toSetColumn.push({
        action: 'set',
        param: {
          elementId: staff.id,
          attrType: 'type',
          attrValue: 'column' + colInput.value,
        },
      });
    });
    const chainAction: ChainAction = {
      action: 'chain',
      param: toSetColumn,
    };
    neonView
      .edit(chainAction, neonView.view.getCurrentPageURI())
      .then((result) => {
        if (result) {
          Notification.queueNotification(
            'Column Value Update Success',
            'success',
          );
        } else {
          Notification.queueNotification(
            'Column Value Update Failed XoX',
            'error',
          );
        }
        endOptionsSelection();
        neonView.updateForCurrentPage();
      });
  });

  function updateNumber(change: number) {
    const minNum = 1;
    const maxNum = 5;
    let currentValue = parseInt(colInput.value, 10) || 0;
    currentValue += change;

    currentValue = Math.min(Math.max(currentValue, minNum), maxNum);
    if (currentValue.toString() != colInput.value)
      confirmButton.style.display = '';
    colInput.value = currentValue.toString();
  }
}

/**
 * Function to set the HTML content of edit controls: either #moreEdit or #extraEdit
 *
 * @param {'moreEdit' | 'extraEdit'} editType - The type of edit controls
 * @param {string} contents - The innerHTML contents
 * @param {boolean} replace - Is the innerHTML being replaced, or being added to?
 */
function setEditControls(
  editType: 'moreEdit' | 'extraEdit',
  contents: string,
  replace = true,
): void {
  const edit = document.getElementById(editType);

  if (edit) {
    edit.parentElement.classList.remove('hidden');
    if (replace) edit.innerHTML = contents;
    else edit.innerHTML += contents;
  }
}

/**
 * Trigger the extra nc action menu for a selection.
 */
export function triggerNcActions(nc: SVGGraphicsElement): void {
  endOptionsSelection();

  setEditControls('moreEdit', Contents.defaultActionContents);
  setEditControls('extraEdit', Contents.ncActionContents);
  addDeleteListener();

  document
    .querySelector('#Punctum.dropdown-item')
    .addEventListener('click', () => {
      const unsetInclinatum = unsetInclinatumAction(nc.id);
      const unsetVirga = unsetVirgaAction(nc.id);
      const unsetVirgaReversed = unsetVirgaReversedAction(nc.id);
      const unsetLiquescentClockwise = unsetLiquescentClockwiseAction(nc.id);
      const unsetLiquescentAnticlockwise = unsetLiquescentAnticlockwiseAction(
        nc.id,
      );
      neonView
        .edit(
          {
            action: 'chain',
            param: [
              unsetInclinatum,
              unsetVirga,
              unsetVirgaReversed,
              unsetLiquescentClockwise,
              unsetLiquescentAnticlockwise,
            ],
          },
          neonView.view.getCurrentPageURI(),
        )
        .then((result) => {
          if (result) {
            Notification.queueNotification('Shape Changed', 'success');
          } else {
            Notification.queueNotification('Shape Change Failed', 'error');
          }
          endOptionsSelection();
          neonView.updateForCurrentPage();
        });
    });

  document
    .querySelector('#Inclinatum.dropdown-item')
    .addEventListener('click', () => {
      const unsetVirga = unsetVirgaAction(nc.id);
      const unsetVirgaReversed = unsetVirgaReversedAction(nc.id);
      const unsetLiquescentClockwise = unsetLiquescentClockwiseAction(nc.id);
      const unsetLiquescentAnticlockwise = unsetLiquescentAnticlockwiseAction(
        nc.id,
      );
      const setInclinatum: SetAction = {
        action: 'set',
        param: {
          elementId: nc.id,
          attrType: 'tilt',
          attrValue: 'se',
        },
      };
      neonView
        .edit(
          {
            action: 'chain',
            param: [
              unsetVirga,
              unsetVirgaReversed,
              unsetLiquescentClockwise,
              unsetLiquescentAnticlockwise,
              setInclinatum,
            ],
          },
          neonView.view.getCurrentPageURI(),
        )
        .then((result) => {
          if (result) {
            Notification.queueNotification('Shape Changed', 'success');
          } else {
            Notification.queueNotification('Shape Change Failed', 'error');
          }
          endOptionsSelection();
          neonView.updateForCurrentPage();
        });
    });

  document
    .querySelector('#Virga.dropdown-item')
    .addEventListener('click', () => {
      const unsetVirgaReversed = unsetVirgaReversedAction(nc.id);
      const unsetInclinatum = unsetInclinatumAction(nc.id);
      const unsetLiquescentClockwise = unsetLiquescentClockwiseAction(nc.id);
      const unsetLiquescentAnticlockwise = unsetLiquescentAnticlockwiseAction(
        nc.id,
      );
      const setVirga: SetAction = {
        action: 'set',
        param: {
          elementId: nc.id,
          attrType: 'tilt',
          attrValue: 's',
        },
      };
      neonView
        .edit(
          {
            action: 'chain',
            param: [
              unsetVirgaReversed,
              unsetInclinatum,
              unsetLiquescentClockwise,
              unsetLiquescentAnticlockwise,
              setVirga,
            ],
          },
          neonView.view.getCurrentPageURI(),
        )
        .then((result) => {
          if (result) {
            Notification.queueNotification('Shape Changed', 'success');
          } else {
            Notification.queueNotification('Shape Change Failed', 'error');
          }
          endOptionsSelection();
          neonView.updateForCurrentPage();
        });
    });

  document
    .querySelector('#VirgaReversed.dropdown-item')
    .addEventListener('click', () => {
      const unsetInclinatum = unsetInclinatumAction(nc.id);
      const unsetVirga = unsetVirgaAction(nc.id);
      const unsetLiquescentClockwise = unsetLiquescentClockwiseAction(nc.id);
      const unsetLiquescentAnticlockwise = unsetLiquescentAnticlockwiseAction(
        nc.id,
      );
      const setVirgaReversed: SetAction = {
        action: 'set',
        param: {
          elementId: nc.id,
          attrType: 'tilt',
          attrValue: 'n',
        },
      };
      neonView
        .edit(
          {
            action: 'chain',
            param: [
              unsetInclinatum,
              unsetVirga,
              unsetLiquescentClockwise,
              unsetLiquescentAnticlockwise,
              setVirgaReversed,
            ],
          },
          neonView.view.getCurrentPageURI(),
        )
        .then((result) => {
          if (result) {
            Notification.queueNotification('Shape Changed', 'success');
          } else {
            Notification.queueNotification('Shape Change Failed', 'error');
          }
          endOptionsSelection();
          neonView.updateForCurrentPage();
        });
    });

  document
    .querySelector('#LiquescentClockwise.dropdown-item')
    .addEventListener('click', () => {
      const unsetInclinatum = unsetInclinatumAction(nc.id);
      const unsetVirga = unsetVirgaAction(nc.id);
      const unsetVirgaReversed = unsetVirgaReversedAction(nc.id);
      const unsetLiquescentAnticlockwise = unsetLiquescentAnticlockwiseAction(
        nc.id,
      );
      const setLiquescentClockwise: SetLiquescentAction = {
        action: 'setLiquescent',
        param: {
          elementId: nc.id,
          curve: 'c',
        },
      };
      neonView
        .edit(
          {
            action: 'chain',
            param: [
              unsetInclinatum,
              unsetVirga,
              unsetVirgaReversed,
              unsetLiquescentAnticlockwise,
              setLiquescentClockwise,
            ],
          },
          neonView.view.getCurrentPageURI(),
        )
        .then((result) => {
          if (result) {
            Notification.queueNotification('Shape Changed', 'success');
          } else {
            Notification.queueNotification('Shape Change Failed', 'error');
          }
          endOptionsSelection();
          neonView.updateForCurrentPage();
        });
    });

  document
    .querySelector('#LiquescentAnticlockwise.dropdown-item')
    .addEventListener('click', () => {
      const unsetInclinatum = unsetInclinatumAction(nc.id);
      const unsetVirga = unsetVirgaAction(nc.id);
      const unsetVirgaReversed = unsetVirgaReversedAction(nc.id);
      const unsetLiquescentClockwise = unsetLiquescentClockwiseAction(nc.id);
      const setLiquescentAnticlockwise: SetLiquescentAction = {
        action: 'setLiquescent',
        param: {
          elementId: nc.id,
          curve: 'a',
        },
      };
      neonView
        .edit(
          {
            action: 'chain',
            param: [
              unsetInclinatum,
              unsetVirga,
              unsetVirgaReversed,
              unsetLiquescentClockwise,
              setLiquescentAnticlockwise,
            ],
          },
          neonView.view.getCurrentPageURI(),
        )
        .then((result) => {
          if (result) {
            Notification.queueNotification('Shape Changed', 'success');
          } else {
            Notification.queueNotification('Shape Change Failed', 'error');
          }
          endOptionsSelection();
          neonView.updateForCurrentPage();
        });
    });

  initOptionsListeners();
}

/**
 * Trigger extra neume actions.
 */
export function triggerNeumeActions(): void {
  endOptionsSelection();

  setEditControls('moreEdit', Contents.defaultNeumeActionContents);
  setEditControls('extraEdit', Contents.neumeActionContents);
  addDeleteListener();

  const neume = document.querySelectorAll('.selected');
  if (neume.length !== 1) {
    console.warn(
      'More than one neume selected! Cannot trigger Neume ClickSelect actions.',
    );
    return;
  }

  // TODO add trigger for split action
  document.getElementById('split-neume').addEventListener('click', () => {
    const neume = document.querySelector('.neume.selected') as SVGGElement;
    if (neume !== null) {
      const split = new SplitNeumeHandler(neonView, neume);
      split.startSplit();
      endOptionsSelection();
    } else {
      console.error('No staff was selected!');
      endOptionsSelection();
    }
  });

  document
    .querySelector('#Pes.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });
  document
    .querySelector('#PesSubpunctis.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });
  document
    .querySelector('#Clivis.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });
  document
    .querySelector('#Scandicus.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });
  document
    .querySelector('#ScandicusFlexus.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });
  document
    .querySelector('#ScandicusSubpunctis.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });
  document
    .querySelector('#Climacus.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });
  document
    .querySelector('#ClimacusResupinus.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });
  document
    .querySelector('#Torculus.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });
  document
    .querySelector('#TorculusResupinus.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });
  document
    .querySelector('#Porrectus.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });
  document
    .querySelector('#PorrectusFlexus.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });
  document
    .querySelector('#PorrectusSubpunctis.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });
  document
    .querySelector('#Pressus.dropdown-item')
    .addEventListener('click', (e) => {
      const contour = neonView.info.getContourByValue(
        (e.target as HTMLElement).id,
      );
      triggerChangeGroup(contour);
    });

  function triggerChangeGroup(contour: string): void {
    const changeGroupingAction: EditorAction = {
      action: 'changeGroup',
      param: {
        elementId: neume[0].id,
        contour: contour,
      },
    };
    neonView
      .edit(changeGroupingAction, neonView.view.getCurrentPageURI())
      .then((result) => {
        if (result) {
          Notification.queueNotification('Grouping Changed', 'success');
        } else {
          Notification.queueNotification('Grouping Failed', 'error');
        }
        endOptionsSelection();
        neonView.updateForCurrentPage();
      });
  }

  initOptionsListeners();
}

/**
 * Trigger extra syllable actions.
 */
export function triggerSyllableActions(selectionType: string): void {
  endOptionsSelection();

  setEditControls('moreEdit', Contents.syllableActionsContent);
  // initialize variable that will hold html to be added to Display panel
  let extraActionsHTML = '';

  // determine the type of selection that was made by the user
  switch (selectionType) {
    // only one syllable and syllable has no <syl>
    case 'noSyl':
      extraActionsHTML += `<div class="right-side-panel-btns-container">
          <button class="side-panel-btn" id="addSyl">Add Syllable Text</button>
          <button class="side-panel-btn" id="delete">Delete</button>
        </div>`;
      break;

    // only one syllable
    case 'singleSelect':
      extraActionsHTML += `<div class="right-side-panel-btns-container">
          <button class="side-panel-btn" id="ungroupNeumes">Ungroup</button>
          <button class="side-panel-btn" id="changeStaff">Re-associate to nearest staff</button>
          <button class="side-panel-btn" id="delete">Delete</button>
        </div>`;
      break;

    // two syllables on separate staves
    case 'linkableSelect':
      extraActionsHTML += `<div class="right-side-panel-btns-container">
          <button class="side-panel-btn" id="toggle-link">Toggle Linked Syllables</button>
          <button class="side-panel-btn" id="changeStaff">Re-associate to nearest staff</button>
          <button class="side-panel-btn" id="delete">Delete</button>
        </div>`;
      break;

    // tow or more syllables on one staff
    case 'multiSelect':
      extraActionsHTML += `<div class="right-side-panel-btns-container">
          <button class="side-panel-btn" id="mergeSyls">Merge Syllables</button>
          <button class="side-panel-btn" id="changeStaff">Re-associate to nearest staff</button>
          <button class="side-panel-btn" id="delete">Delete</button>
        </div>`;
      break;

    //default options
    case 'default':
      extraActionsHTML += `<div class="right-side-panel-btns-container">
          <button class="side-panel-btn" id="changeStaff">Re-associate to nearest staff</button>
          <button class="side-panel-btn" id="delete">Delete</button>
        </div>`;
      break;
  }

  // set content of additional actions in Display panel
  // and initialize necessary listeners
  setEditControls('moreEdit', extraActionsHTML, true);
  addChangeStaffListener();
  addDeleteListener();
  Grouping.initGroupingListeners();
}

/**
 * Trigger extra layer element (accid, divLine, custos, clef) actions.
 */
export function triggerLayerElementActions(element: SVGGraphicsElement): void {
  endOptionsSelection();

  if (element.classList.contains('custos')) {
    setEditControls('moreEdit', Contents.custosActionContents);
    addChangeStaffListener();
    addDeleteListener();

    return;
  }

  const parentIsSyllable = element.parentElement.classList.contains('syllable');
  const layerElementActions = parentIsSyllable
    ? Contents.layerElementInActionContents
    : Contents.layerElementOutActionContents;

  setEditControls('moreEdit', layerElementActions, false);

  // extra actions for accid and divLine
  if (element.classList.contains('accid')) {
    setEditControls('extraEdit', Contents.accidActionContents);
    accidOptionsListener(element);
  } else if (element.classList.contains('clef')) {
    setEditControls('extraEdit', Contents.clefActionContents);
    clefOptionsListener(element);
  } else if (element.classList.contains('divLine')) {
    setEditControls('extraEdit', Contents.divLineActionContents);
    divLineOptionsListener(element);
  }
  addChangeStaffListener();
  document
    .getElementById('insertToSyllable')
    ?.addEventListener('click', insertToSyllableHandler);
  document
    .getElementById('moveOutsideSyllable')
    ?.addEventListener('click', moveOutsideSyllableHandler);

  addDeleteListener();

  addChangeStaffListener();
  document
    .getElementById('insertToSyllable')
    ?.addEventListener('click', insertToSyllableHandler);
  document
    .getElementById('moveOutsideSyllable')
    ?.addEventListener('click', moveOutsideSyllableHandler);
}

function accidOptionsListener(element: SVGGraphicsElement): void {
  document
    .querySelector('#ChangeToFlat.dropdown-item')
    .addEventListener('click', () => {
      const changeToFlat: SetAction = {
        action: 'set',
        param: {
          elementId: element.id,
          attrType: 'accid',
          attrValue: 'f',
        },
      };
      parseShapeChangeAction(changeToFlat);
    });
  document
    .querySelector('#ChangeToNatural.dropdown-item')
    .addEventListener('click', () => {
      const changeToNatural: EditorAction = {
        action: 'set',
        param: {
          elementId: element.id,
          attrType: 'accid',
          attrValue: 'n',
        },
      };
      parseShapeChangeAction(changeToNatural);
    });

  initOptionsListeners();
}

function clefOptionsListener(element: SVGGraphicsElement): void {
  document.querySelector('#increment-octave').addEventListener('click', () => {
    const incrementOctave: DisplaceClefOctaveAction = {
      action: 'displaceClefOctave',
      param: {
        elementId: element.id,
        direction: 'above',
      },
    };

    neonView
      .edit(incrementOctave, neonView.view.getCurrentPageURI())
      .then((result) => {
        if (result) {
          Notification.queueNotification('Clef octave incremented.', 'success');
        } else {
          Notification.queueNotification(
            'Maximum octave displacement reached. Clef can only be displaced up to 3 octaves.',
            'error',
          );
        }
        endOptionsSelection();
        neonView.updateForCurrentPage();
      });
  });

  document.querySelector('#decrement-octave').addEventListener('click', () => {
    const incrementOctave: DisplaceClefOctaveAction = {
      action: 'displaceClefOctave',
      param: {
        elementId: element.id,
        direction: 'below',
      },
    };

    neonView
      .edit(incrementOctave, neonView.view.getCurrentPageURI())
      .then((result) => {
        if (result) {
          Notification.queueNotification('Clef octave decremented.', 'success');
        } else {
          Notification.queueNotification(
            'Maximum octave displacement reached. Clef can only be displaced up to 3 octaves.',
            'error',
          );
        }
        endOptionsSelection();
        neonView.updateForCurrentPage();
      });
  });

  document
    .querySelector('#CClef.dropdown-item')
    .addEventListener('click', () => {
      const setCClef: SetClefAction = {
        action: 'setClef',
        param: {
          elementId: element.id,
          shape: 'C',
        },
      };
      parseShapeChangeAction(setCClef);
    });
  document
    .querySelector('#FClef.dropdown-item')
    .addEventListener('click', () => {
      const setFClef: SetClefAction = {
        action: 'setClef',
        param: {
          elementId: element.id,
          shape: 'F',
        },
      };
      parseShapeChangeAction(setFClef);
    });

  initOptionsListeners();
}

function divLineOptionsListener(element: SVGGraphicsElement): void {
  document
    .querySelector('#ChangeToMinima.dropdown-item')
    .addEventListener('click', () => {
      const ChangeToMinima: SetAction = {
        action: 'set',
        param: {
          elementId: element.id,
          attrType: 'form',
          attrValue: 'minima',
        },
      };
      parseShapeChangeAction(ChangeToMinima);
    });

  document
    .querySelector('#ChangeToMaior.dropdown-item')
    .addEventListener('click', () => {
      const ChangeToMaior: EditorAction = {
        action: 'set',
        param: {
          elementId: element.id,
          attrType: 'form',
          attrValue: 'maior',
        },
      };
      parseShapeChangeAction(ChangeToMaior);
    });

  document
    .querySelector('#ChangeToMaxima.dropdown-item')
    .addEventListener('click', () => {
      const ChangeToMaxima: EditorAction = {
        action: 'set',
        param: {
          elementId: element.id,
          attrType: 'form',
          attrValue: 'maxima',
        },
      };
      parseShapeChangeAction(ChangeToMaxima);
    });

  document
    .querySelector('#ChangeToFinalis.dropdown-item')
    .addEventListener('click', () => {
      const ChangeToFinalis: EditorAction = {
        action: 'set',
        param: {
          elementId: element.id,
          attrType: 'form',
          attrValue: 'finalis',
        },
      };
      parseShapeChangeAction(ChangeToFinalis);
    });

  document
    .querySelector('#ChangeToCaesura.dropdown-item')
    .addEventListener('click', () => {
      const ChangeToCaesura: EditorAction = {
        action: 'set',
        param: {
          elementId: element.id,
          attrType: 'form',
          attrValue: 'caesura',
        },
      };
      parseShapeChangeAction(ChangeToCaesura);
    });

  document
    .querySelector('#ChangeToVirgula.dropdown-item')
    .addEventListener('click', () => {
      const ChangeToVirgula: EditorAction = {
        action: 'set',
        param: {
          elementId: element.id,
          attrType: 'form',
          attrValue: 'virgula',
        },
      };
      parseShapeChangeAction(ChangeToVirgula);
    });

  initOptionsListeners();
}

/**
 * Parse actions regarding shape changes to editor action
 */
function parseShapeChangeAction(action: SetAction | SetClefAction) {
  neonView.edit(action, neonView.view.getCurrentPageURI()).then((result) => {
    if (result) {
      Notification.queueNotification('Shape Changed', 'success');
    } else {
      Notification.queueNotification('Shape Change Failed', 'error');
    }
    endOptionsSelection();
    neonView.updateForCurrentPage();
  });
}

/**
 * Trigger extra staff actions.
 */
export function triggerMultiStaffActions(): void {
  endOptionsSelection();
  setEditControls('moreEdit', Contents.staffMergeActionContents);
  setEditControls('extraEdit', Contents.columnActionContents);
  addDeleteListener();

  // Column info editor
  updateColumnInfo();
  addColumnInfoStepHandler();

  document.getElementById('merge-systems').addEventListener('click', () => {
    Grouping.mergeStaves();
  });
}

/**
 * Enter staff splitting mode
 */
export function triggerStaffSplitMode(): void {
  const staff = document.querySelector('.staff.selected') as SVGGElement;
  if (staff !== null) {
    const split = new SplitStaffHandler(neonView, staff);
    split.startSplit();
    endOptionsSelection();
  } else {
    console.error('No staff was selected!');
    endOptionsSelection();
  }
}

/**
 * Trigger split staff option
 */
export function triggerSingleStaffActions(): void {
  endOptionsSelection();
  setEditControls('moreEdit', Contents.staffSplitActionContents);
  setEditControls('extraEdit', Contents.columnActionContents);
  addDeleteListener();

  // Column info editor
  updateColumnInfo();
  addColumnInfoStepHandler();

  // Add trigger for split action
  document.getElementById('split-system').addEventListener('click', () => {
    triggerStaffSplitMode();
  });

  document.getElementById('reset-rotate').addEventListener('click', () => {
    const staff = document.querySelector('.staff.selected') as SVGElement;
    // Unused variables:
    // const rect = staff.querySelector('#resizeRect');
    // const co = rect.getAttribute('points').split(' ');
    // const dy = parseInt(co[0].split(',')[1]) - parseInt(co[1].split(',')[1]);
    const points = getStaffBBox(staff as SVGGElement);
    const y_change = Math.tan(points.rotate) * (points.lrx - points.ulx);
    if (staff !== null) {
      const editorAction: EditorAction = {
        action: 'resizeRotate',
        param: {
          elementId: staff.id,
          ulx: points.ulx,
          uly:
            points.rotate > 0
              ? points.uly + y_change / 2
              : points.uly - y_change / 2,
          lrx: points.lrx,
          lry:
            points.rotate > 0
              ? points.lry - y_change / 2
              : points.lry + y_change / 2,
          rotate: 0,
        },
      };
      neonView
        .edit(editorAction, neonView.view.getCurrentPageURI())
        .then(async (result) => {
          if (result) {
            await neonView.updateForCurrentPage();
          }
        });
      endOptionsSelection();
    } else {
      console.error('No staff was selected');
      endOptionsSelection();
    }
  });
}

/**
 * Trigger bbox option.
 */
export function triggerBBoxActions(): void {
  endOptionsSelection();
  setEditControls('moreEdit', Contents.bboxActionContents);
  addDeleteListener();
  document.getElementById('matchHeight').addEventListener('click', () => {
    matchHeightHandler();
  });
}

/**
 * Trigger default actions when selecting by syl
 */
export function triggerDefaultSylActions(): void {
  endOptionsSelection();
  setEditControls('moreEdit', Contents.defaultSylActionContents);
  addDeleteListener();
  addChangeStaffListener();
}

/**
 * Trigger default selection option.
 */
export function triggerDefaultActions(): void {
  endOptionsSelection();
  setEditControls('moreEdit', Contents.defaultActionContents);
  addDeleteListener();
}

/**
 * Initialize extra dropdown options:
 * Listen to clicks on dropdowns
 */
function initOptionsListeners(): void {
  document.querySelectorAll('.drop_select').forEach((drop) => {
    // When anything that is not the dropdown is clicked away, the dropdown
    // should lose its visibility
    const optionsClickaway = () => {
      document.body.removeEventListener('click', optionsClickaway);
      drop.classList.remove('is-active');
    };

    drop.addEventListener('click', (evt) => {
      // Toggle visibility of dropdown
      drop.classList.toggle('is-active');

      // Remove visibility of other dropdowns when this one is clicked
      Array.from(document.querySelectorAll('.drop_select'))
        .filter((other) => other !== drop)
        .forEach((other) => other.classList.remove('is-active'));

      // Don't allow other event listeners on the body to interfere with this listener
      evt.stopPropagation();

      if (drop.classList.contains('is-active'))
        document.body.addEventListener('click', optionsClickaway);
      else document.body.removeEventListener('click', optionsClickaway);
    });
  });
}
