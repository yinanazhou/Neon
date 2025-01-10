import * as Notification from './Notification';
import NeonView from '../NeonView';
import { convertToNeon } from './ConvertMei';
import { EditorAction } from '../Types';

/**
 * Set top navbar event listeners.
 */
export function initNavbar(neonView: NeonView): void {
  // setup navbar listeners
  const navbarDropdowns = document.querySelectorAll(
    '.navbar-item.has-dropdown.is-hoverable',
  );
  Array.from(navbarDropdowns).forEach((dropDown) => {
    dropDown.addEventListener('mouseover', () => {
      //
    });
  });

  /* "FILE" menu */
  document.getElementById('save').addEventListener('click', () => {
    neonView.save().then(() => {
      Notification.queueNotification('Saved', 'success');
    });
  });
  document.body.addEventListener('keydown', (evt) => {
    if (evt.key === 's') {
      neonView.save().then(() => {
        Notification.queueNotification('Saved', 'success');
      });
    }
  });

  document.getElementById('export').addEventListener('click', () => {
    neonView.export().then((manifest) => {
      const link: HTMLAnchorElement = document.createElement('a');
      link.href = manifest as string;
      link.download = neonView.name + '.jsonld';
      document.body.appendChild(link);
      link.click();
      link.remove();
      Notification.queueNotification('Saved', 'success');
    });
  });

  // Download link for MEI
  // Is an actual file with a valid URI except in local mode where it must be generated.
  document.getElementById('getmei').addEventListener('click', () => {
    const uri = neonView.view.getCurrentPageURI();
    neonView.getPageMEI(uri).then((mei) => {
      const data =
        'data:application/mei+xml;base64,' + window.btoa(convertToNeon(mei));
      document.getElementById('getmei').setAttribute('href', data);
      document
        .getElementById('getmei')
        .setAttribute('download', neonView.view.getPageName() + '.mei');
    });
  });

  /* "MEI ACTIONS" menu */
  // Event listener for "Remove Empty Syllables" button inside "MEI Actions" dropdown
  document
    .getElementById('remove-empty-syls')
    .addEventListener('click', function () {
      const uri = neonView.view.getCurrentPageURI();

      neonView.getPageMEI(uri).then((meiString) => {
        const parser = new DOMParser();
        const meiDoc = parser.parseFromString(meiString, 'text/xml');
        const mei = meiDoc.documentElement;
        const syllables = Array.from(mei.getElementsByTagName('syllable'));

        // Check for syllables without neumes
        let hasEmptySyllables = false;
        const removeSyllableActions = [];
        for (const syllable of syllables) {
          // if empty syllable found, create action object for removing it
          if (syllable.getElementsByTagName('neume').length === 0) {
            const toRemove: EditorAction = {
              action: 'remove',
              param: {
                elementId: syllable.getAttribute('xml:id'),
              },
            };
            // add action object to array (chain) of action objects
            removeSyllableActions.push(toRemove);
            hasEmptySyllables = true;
          }
        }

        // check if empty syllables were found
        if (!hasEmptySyllables) {
          Notification.queueNotification('No empty syllables found', 'warning');
        } else {
          // create "chain action" object
          const chainRemoveAction: EditorAction = {
            action: 'chain',
            param: removeSyllableActions,
          };

          // execute action that removes all empty syllables
          // "result" value is true or false (true if chain of actions was successful)
          neonView.edit(chainRemoveAction, uri).then((result) => {
            if (result) {
              neonView.updateForCurrentPage();
              Notification.queueNotification(
                'Removed empty Syllables',
                'success',
              );
            } else {
              Notification.queueNotification(
                'Failed to remove empty Syllables',
                'error',
              );
            }
          });
        }
      });
    });

  // Event listener for "Remove Empty Neumes" button inside "MEI Actions" dropdown
  document
    .getElementById('remove-empty-neumes')
    .addEventListener('click', function () {
      const uri = neonView.view.getCurrentPageURI();

      neonView.getPageMEI(uri).then((meiString) => {
        const parser = new DOMParser();
        const meiDoc = parser.parseFromString(meiString, 'text/xml');
        const mei = meiDoc.documentElement;
        const neumes = Array.from(mei.getElementsByTagName('neume'));

        // Check for neumes without neume components
        let hasEmptyNeumes = false;
        const removeNeumeActions = [];
        for (const neume of neumes) {
          // if empty neume found, create action object for removing it
          if (neume.getElementsByTagName('nc').length === 0) {
            const toRemove: EditorAction = {
              action: 'remove',
              param: {
                elementId: neume.getAttribute('xml:id'),
              },
            };
            // add action object to array (chain) of action objects
            removeNeumeActions.push(toRemove);
            hasEmptyNeumes = true;
          }
        }

        // check if empty neumes were found
        if (!hasEmptyNeumes) {
          Notification.queueNotification('No empty Neumes found', 'warning');
        } else {
          // create "chain action" object
          const chainRemoveAction: EditorAction = {
            action: 'chain',
            param: removeNeumeActions,
          };

          // execute action that removes all empty neumes
          // "result" value is true or false (true if chain of actions was successful)
          neonView.edit(chainRemoveAction, uri).then((result) => {
            if (result) {
              neonView.updateForCurrentPage();
              Notification.queueNotification('Removed empty Neumes', 'success');
            } else {
              Notification.queueNotification(
                'Failed to remove empty Neumes',
                'error',
              );
            }
          });
        }
      });
    });

  document
    .getElementById('remove-out-of-bounds-glyphs')
    .addEventListener('click', function () {
      const uri = neonView.view.getCurrentPageURI();
      neonView.getPageMEI(uri).then((meiString) => {
        // Load MEI document into parser
        const parser = new DOMParser();
        const meiDoc = parser.parseFromString(meiString, 'text/xml');
        const mei = meiDoc.documentElement;

        // Get bounds of the MEI
        const dimensions = mei.querySelector('surface');
        const meiLrx = Number(dimensions.getAttribute('lrx')),
          meiLry = Number(dimensions.getAttribute('lry'));

        function isAttrOutOfBounds(zone: Element, attr: string): boolean {
          const coord = Number(zone.getAttribute(attr));
          const comp = attr == 'lrx' || attr == 'ulx' ? meiLrx : meiLry;
          return coord < 0 || coord > comp;
        }

        // Get array of zones that are out of bound, and create a hash map
        // for fast retrieval
        const zones = Array.from(mei.querySelectorAll('zone'));
        const outOfBoundZones = zones.filter((zone) =>
          ['ulx', 'uly', 'lrx', 'lry'].some((attr) =>
            isAttrOutOfBounds(zone, attr),
          ),
        );
        const zoneMap = new Map(
          outOfBoundZones.map((zone) => [zone.getAttribute('xml:id'), zone]),
        );

        // Filter out the neume components and divlines that have a zone out of bounds
        const glyphs = Array.from(
          mei.querySelectorAll('nc, divLine, clef, accid'),
        );
        const outOfBoundGlyphs = glyphs.filter((glyph) => {
          if (glyph.hasAttribute('facs')) {
            const facsId = glyph.getAttribute('facs').slice(1);
            return zoneMap.has(facsId);
          }

          return false;
        });

        // Check if there are no out-of-bound glyphs, and
        // exit, since no edit needs to be made.
        if (outOfBoundGlyphs.length === 0) {
          return Notification.queueNotification(
            'There are no out-of-bound glyphs to remove.',
            'warning',
          );
        }

        // Create remove actions and chain action to send to Verovio
        const removeActions: EditorAction[] = outOfBoundGlyphs.map((glyph) => {
          return {
            action: 'remove',
            param: {
              elementId: glyph.getAttribute('xml:id'),
            },
          };
        });

        const chainAction: EditorAction = {
          action: 'chain',
          param: removeActions,
        };

        neonView.edit(chainAction, uri).then((result) => {
          if (result) {
            neonView.updateForCurrentPage();
            Notification.queueNotification(
              'Successfully removed out-of-bounds syllables.',
              'success',
            );
          } else {
            Notification.queueNotification(
              'Failed to remove out-of-bound syllables.',
              'error',
            );
          }
        });
      });
    });

  document
    .getElementById('untoggle-invalid-oblique')
    .addEventListener('click', function () {
      const uri = neonView.view.getCurrentPageURI();
      neonView.getPageMEI(uri).then((meiString) => {
        // Load MEI document into parser
        const parser = new DOMParser();
        const meiDoc = parser.parseFromString(meiString, 'text/xml');
        const mei = meiDoc.documentElement;
        const ncs = Array.from(mei.getElementsByTagName('nc'));

        let hasInvalidOblique = false;
        const chainAction: EditorAction = {
          action: 'chain',
          param: [],
        };
        const param = new Array<EditorAction>();
        let ncIdx = 0;
        while (ncIdx < ncs.length) {
          if (ncs[ncIdx].getAttribute('ligated')) {
            if (
              (ncIdx < ncs.length - 1 &&
                !ncs[ncIdx + 1].getAttribute('ligated')) ||
              ncIdx == ncs.length - 1
            ) {
              // If nc is ligated, and the next nc is not
              // Or, nc is ligated, but already at the end (there is no next)\
              hasInvalidOblique = true;
              param.push({
                action: 'set',
                param: {
                  elementId: ncs[ncIdx].getAttribute('xml:id'),
                  attrType: 'ligated',
                  attrValue: '',
                },
              });
            }
            ncIdx += 2;
          }
          ncIdx += 1;
        }

        if (!hasInvalidOblique) {
          Notification.queueNotification(
            'No invalid obliques found',
            'warning',
          );
        } else {
          chainAction.param = param;
          neonView
            .edit(chainAction, neonView.view.getCurrentPageURI())
            .then((result) => {
              if (result) {
                Notification.queueNotification(
                  'Untoggled invalid obliques',
                  'success',
                );
              } else {
                Notification.queueNotification(
                  'Failed to untoggle invalid obliques',
                  'error',
                );
              }
              neonView.updateForCurrentPage();
            });
        }
      });
    });

  document
    .getElementById('untoggle-invalid-syls')
    .addEventListener('click', function () {
      const uri = neonView.view.getCurrentPageURI();
      neonView.getPageMEI(uri).then((meiString) => {
        // Load MEI document into parser
        const parser = new DOMParser();
        const meiDoc = parser.parseFromString(meiString, 'text/xml');
        const mei = meiDoc.documentElement;
        const syllables = Array.from(mei.getElementsByTagName('syllable'));

        const invalidSyllables = getInvalidSyllables(syllables);

        if (invalidSyllables.length === 0) {
          Notification.queueNotification(
            'No invalid syllables found',
            'warning',
          );
        } else {
          const chainAction: EditorAction = {
            action: 'chain',
            param: [],
          };
          const param = new Array<EditorAction>();
          for (const syllable of invalidSyllables) {
            if (
              syllable.hasAttribute('precedes') &&
              syllable.hasAttribute('follows')
            ) {
              const precedesSyllable = syllables.find(
                (element) =>
                  element.getAttribute('xml:id') ===
                  syllable.getAttribute('precedes').substring(1),
              );
              const followsSyllable = syllables.find(
                (element) =>
                  element.getAttribute('xml:id') ===
                  syllable.getAttribute('follows').substring(1),
              );

              param.push({
                action: 'set',
                param: {
                  elementId: syllable.getAttribute('xml:id'),
                  attrType: 'precedes',
                  attrValue: '',
                },
              });
              param.push({
                action: 'set',
                param: {
                  elementId: syllable.getAttribute('xml:id'),
                  attrType: 'follows',
                  attrValue: '',
                },
              });
              param.push({
                action: 'set',
                param: {
                  elementId: precedesSyllable.getAttribute('xml:id'),
                  attrType: 'follows',
                  attrValue: '',
                },
              });
              param.push({
                action: 'set',
                param: {
                  elementId: followsSyllable.getAttribute('xml:id'),
                  attrType: 'precedes',
                  attrValue: '',
                },
              });

              param.push(
                ...addSylAction([syllable, precedesSyllable, followsSyllable]),
              );
            } else if (syllable.hasAttribute('precedes')) {
              const precedesSyllable = syllables.find(
                (element) =>
                  element.getAttribute('xml:id') ===
                  syllable.getAttribute('precedes').substring(1),
              );

              param.push({
                action: 'set',
                param: {
                  elementId: syllable.getAttribute('xml:id'),
                  attrType: 'precedes',
                  attrValue: '',
                },
              });
              param.push({
                action: 'set',
                param: {
                  elementId: precedesSyllable.getAttribute('xml:id'),
                  attrType: 'follows',
                  attrValue: '',
                },
              });
              param.push(...addSylAction([syllable, precedesSyllable]));
            } else if (syllable.hasAttribute('follows')) {
              const followsSyllable = syllables.find(
                (element) =>
                  element.getAttribute('xml:id') ===
                  syllable.getAttribute('follows').substring(1),
              );

              param.push({
                action: 'set',
                param: {
                  elementId: syllable.getAttribute('xml:id'),
                  attrType: 'follows',
                  attrValue: '',
                },
              });
              param.push({
                action: 'set',
                param: {
                  elementId: followsSyllable.getAttribute('xml:id'),
                  attrType: 'precedes',
                  attrValue: '',
                },
              });
              param.push(...addSylAction([syllable, followsSyllable]));
            }
          }

          chainAction.param = param;
          neonView
            .edit(chainAction, neonView.view.getCurrentPageURI())
            .then((result) => {
              if (result) {
                Notification.queueNotification(
                  'Untoggled invalid syllables',
                  'success',
                );
              } else {
                Notification.queueNotification(
                  'Failed to untoggle invalid syllables',
                  'error',
                );
              }
              neonView.updateForCurrentPage();
            });
        }
      });
    });

  // Event listener for "Revert" button inside "MEI Actions" dropdown
  document.getElementById('revert').addEventListener('click', function () {
    if (
      window.confirm(
        'Reverting will cause all changes to be lost. Press OK to continue.',
      )
    ) {
      neonView.deleteDb().then(() => {
        window.location.reload();
      });
    }
  });

  /* "VIEW" menu */

  /*

  // Event listeners for setting default zoom settings inside "View" dropdown
  const fitContentBtn = document.querySelector('#zoom-fit-content');
  const fitContentCheckmark = document.querySelector('#zoom-fit-content-icon');
  const easyEditBtn = document.querySelector('#zoom-easy-edit');
  const easyEditCheckmark = document.querySelector('#zoom-easy-edit-icon');

  // fit content listener
  fitContentBtn.addEventListener('click', () => {
    easyEditBtn.classList.remove('checked');
    fitContentBtn.classList.add('checked');

    easyEditCheckmark.classList.remove('selected');
    fitContentCheckmark.classList.add('selected');

    // TODO: Save default zoom settings in local storage

  });
  // easy edit listener
  easyEditBtn.addEventListener('click', () => {
    fitContentBtn.classList.remove('checked');
    easyEditBtn.classList.add('checked');

    fitContentCheckmark.classList.remove('selected');
    easyEditCheckmark.classList.add('selected');

    // TODO: Save default zoom settings in local storage

  });
  */
}

/**
 * Initialize the undo/redo panel
 */
export function initUndoRedoPanel(neonView: NeonView): void {
  /**
   * Tries to undo an action and update the page if it succeeds.
   */
  function undoHandler(): void {
    neonView.undo().then((result: boolean) => {
      if (result) {
        neonView.updateForCurrentPage();
      } else {
        Notification.queueNotification('There is nothing left to undo.');
        console.warn('Failed to undo action');
      }
    });
  }

  /**
   * Tries to redo an action and update the page if it succeeds.
   */
  function redoHandler(): void {
    neonView.redo().then((result: boolean) => {
      if (result) {
        neonView.updateForCurrentPage();
      } else {
        Notification.queueNotification('There is nothing left to redo.');
        console.warn('Failed to redo action');
      }
    });
  }

  document.getElementById('undo').addEventListener('click', undoHandler);
  document.body.addEventListener('keydown', (evt) => {
    if (evt.key === 'z' && (evt.ctrlKey || evt.metaKey)) {
      undoHandler();
    }
  });

  document.getElementById('redo').addEventListener('click', redoHandler);
  document.body.addEventListener('keydown', (evt) => {
    if (
      (evt.key === 'Z' || (evt.key === 'z' && evt.shiftKey)) &&
      (evt.ctrlKey || evt.metaKey)
    ) {
      redoHandler();
    }
  });
}

function addSylAction(syllables: Element[]): Array<EditorAction> {
  const param = new Array<EditorAction>();

  for (const syllable of syllables) {
    if (syllable && !syllable.getElementsByTagName('syl').length) {
      param.push({
        action: 'setText',
        param: {
          elementId: syllable.getAttribute('xml:id'),
          text: '',
        },
      });
    }
  }

  return param;
}

function getInvalidSyllables(syllables: Element[]): Element[] {
  const invalidSyllables: Element[] = [];
  for (let idx = 0; idx < syllables.length; idx++) {
    const syllable = syllables.at(idx);
    if (syllable.hasAttribute('precedes')) {
      // Get xml:id of the next syllable (without the #, if it exists)
      const nextSyllableId = syllable.getAttribute('precedes').replace('#', '');

      // Find the next syllable and its index in the array
      let nextSyllableIdx: number;
      const nextSyllable = syllables.find((element, idx) => {
        if (element.getAttribute('xml:id') === nextSyllableId) {
          nextSyllableIdx = idx;
          return true;
        }

        return false;
      });

      // Condition 1: The next (following) syllable cannot be found
      if (!nextSyllable) {
        invalidSyllables.push(syllable);
      }

      // Condition 2: The next syllable has been found, but the @follows attribute does NOT EXIST
      if (!nextSyllable.hasAttribute('follows')) {
        invalidSyllables.push(syllable);
      }

      // Condition 3: The next syllable's @follows attribute exists, but it is not in the correct format #id
      if (
        nextSyllable.getAttribute('follows') !=
        '#' + syllable.getAttribute('xml:id')
      ) {
        invalidSyllables.push(syllable);
      }

      // Condition 4:
      // Since the @follows value is correct, a pair of syllables exist for the toggle-linked syllable.
      // Check if the @follows syllable is the next syllable (index-wise) in the array:
      if (nextSyllableIdx !== idx + 1) {
        invalidSyllables.push(syllable);
      }
    }
    if (syllable.hasAttribute('follows')) {
      const prevSyllableId = syllable.getAttribute('follows').replace('#', '');
      const prevSyllable = syllables.find(
        (syllable) => syllable.getAttribute('xml:id') === prevSyllableId,
      );

      // Condition 1: The previous syllable does not exist
      if (!prevSyllable) {
        invalidSyllables.push(syllable);
      }

      // Condition 2: The previous syllable exists, but the @precedes attribute does NOT EXIST
      if (!prevSyllable.hasAttribute('precedes')) {
        invalidSyllables.push(syllable);
      }

      // Condition 3: The previous syllable's @precedes attribute exists, but it is not in the correct format #id
      if (
        prevSyllable.getAttribute('precedes') !=
        '#' + syllable.getAttribute('xml:id')
      ) {
        invalidSyllables.push(syllable);
      }
    }
  }
  return invalidSyllables;
}
