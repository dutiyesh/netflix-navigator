import { isInViewport } from "./utils/viewport";
import { trackEvent } from "./utils/tracking";

const CARD_ID_REGEX = /title-card-([0-9]+)-([0-9]+)/;
const SLIDER_ITEM_INDEX_REGEX = /slider-item-([0-9]+)/;

type ArrowDirectionHorizontal = "left" | "right";
type ArrowDirectionVertical = "up" | "down";
type SiblingElementDirection = "next" | "previous";

class NetflixNavigator {
  // row
  currentActiveRow: Element | null;
  lastActiveRow: Element | null;

  // column
  columnCount: number;
  activeColumnIndex: number;

  // grid type
  rowClassName: "lolomoRow" | "rowContainer";

  // class names
  activeRowClassName: string;
  activeSliderItemClassName: string;

  // slider
  isSliderControlButtonClickInProgress: boolean;

  // mini preview modal
  miniPreviewModalTimerId: number | undefined;
  miniPreviewModalAutoplayDelay: number;
  miniPreviewModalObserver: MutationObserver;
  isMiniPreviewModalActive: boolean;

  constructor() {
    // row
    this.currentActiveRow = null;
    this.lastActiveRow = null;

    // column
    this.columnCount = this._getMaxColumnCount();
    this.activeColumnIndex = -1;

    // grid type
    this.rowClassName = "lolomoRow";

    // class names
    this.activeRowClassName = "netflix-navigator-row--active";
    this.activeSliderItemClassName = "netflix-navigator-slider-item--focus";

    // slider
    this.isSliderControlButtonClickInProgress = false;

    // mini preview modal
    this.miniPreviewModalTimerId = undefined;
    this.miniPreviewModalAutoplayDelay = 1000;
    this.miniPreviewModalObserver = new MutationObserver(
      this._miniPreviewModalMutationObserverHandler.bind(this)
    );
    this.isMiniPreviewModalActive = false;
  }

  focusRow(direction: ArrowDirectionVertical = "down") {
    if (this._isDetailModalOpen()) {
      return;
    }

    this._setUpViewType();
    const rows = document.getElementsByClassName(this.rowClassName);

    if (rows.length === 0) {
      return;
    }

    let rowToFocus: Element | null = null;
    const currentRowInFocus = document.getElementsByClassName(
      this.activeRowClassName
    )[0];

    if (!currentRowInFocus) {
      rowToFocus = this._getInitialRowToFocus();

      this.activeColumnIndex = -1;
    } else {
      const siblingRow = this._getSiblingRow(
        currentRowInFocus,
        direction === "down" ? "next" : "previous"
      );

      if (siblingRow) {
        rowToFocus = siblingRow;
      } else {
        rowToFocus = currentRowInFocus;
      }
    }

    if (rowToFocus) {
      if (currentRowInFocus) {
        currentRowInFocus.classList.remove(this.activeRowClassName);

        if (
          !isInViewport(currentRowInFocus) &&
          !isInViewport(rowToFocus) &&
          !this._isRowInViewportSpecial(currentRowInFocus)
        ) {
          rowToFocus = this._getInitialRowToFocus();

          this.activeColumnIndex = -1;
        }
      }

      rowToFocus!.classList.add(this.activeRowClassName);

      this.lastActiveRow = this.currentActiveRow;
      this.currentActiveRow = rowToFocus;

      if (this._isBillboardRow(rowToFocus!)) {
        this._setBillboardFocus();

        window.scrollTo(0, (rowToFocus as HTMLElement)!.offsetTop);
      } else {
        this._focusSliderItemInRow(direction);

        this._getRowIntoViewport(
          rowToFocus!,
          rowToFocus === rows[0],
          direction
        );
      }
    }
  }

  navigateSlider(direction: ArrowDirectionHorizontal = "right"): void {
    if (this._isDetailModalOpen()) {
      return;
    }

    if (this.currentActiveRow && !isInViewport(this.currentActiveRow)) {
      this.focusRow("down");
    } else {
      this._focusSliderItemInRow(direction);
    }
  }

  isSliderItemInFocus(): boolean {
    if (this.currentActiveRow) {
      const sliderItemInFocus = this.currentActiveRow.querySelector(
        `.${this.activeSliderItemClassName} a.slider-refocus`
      );

      if (sliderItemInFocus && document.activeElement === sliderItemInFocus) {
        return true;
      }
    }

    return false;
  }

  openSearch() {
    if (this._isDetailModalOpen()) {
      return;
    }

    const searchBarButton = document.querySelector(".main-header .searchTab");

    if (searchBarButton && searchBarButton instanceof HTMLElement) {
      setTimeout(() => {
        searchBarButton.click();
      }, 0);

      return;
    }

    const searchInputContainer = document.querySelector(
      ".main-header .searchInput"
    );

    if (searchInputContainer) {
      const searchInput = searchInputContainer.querySelector(
        "input[name='searchInput']"
      );

      if (
        searchInput &&
        searchInput !== document.activeElement &&
        searchInput instanceof HTMLElement
      ) {
        setTimeout(() => {
          searchInput.focus();
        }, 0);
      }

      return;
    }
  }

  // column start
  _getMaxColumnCount(): number {
    this._setUpViewType();

    const defaultColumnCount = 6;

    if (this._isGridView()) {
      const rows = document.getElementsByClassName(this.rowClassName);

      if (rows.length === 0) {
        return defaultColumnCount;
      }

      const sliderItemCount = rows[0].querySelectorAll(".slider .slider-item")
        .length;

      return sliderItemCount !== 0 ? sliderItemCount : defaultColumnCount;
    } else {
      const rows = document.getElementsByClassName(this.rowClassName);

      if (rows.length === 0) {
        return defaultColumnCount;
      }

      let columnCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (this._isRowSpecial(row)) {
          continue;
        }

        const slider = row.getElementsByClassName("slider")[0];
        if (!slider) {
          continue;
        }

        const sliderContent = slider.getElementsByClassName("sliderContent")[0];
        if (!sliderContent) {
          continue;
        }

        const outsideViewportSliderItem = slider.getElementsByClassName(
          "slider-item-"
        )[0];
        if (!outsideViewportSliderItem) {
          continue;
        }

        const outsideViewportSliderItemIndex = Array.prototype.indexOf.call(
          sliderContent.children,
          outsideViewportSliderItem
        );

        const sliderItems = slider.getElementsByClassName("slider-item");

        for (let j = 0; j < sliderItems.length; j++) {
          const sliderItemIndex = this._getSliderItemIndex(sliderItems[j]);

          if (sliderItemIndex !== -1) {
            columnCount += 1;
          } else {
            if (columnCount !== 0) {
              break;
            }
          }
        }

        if (outsideViewportSliderItemIndex === 0) {
          columnCount = columnCount - 2;
        } else {
          columnCount = columnCount - 1;
        }

        if (columnCount !== 0) {
          break;
        }
      }

      return columnCount > 0 ? columnCount : defaultColumnCount;
    }
  }
  // column end

  // view start
  _isGridView(): boolean {
    return Boolean(document.getElementsByClassName("galleryLockups")[0]);
  }

  _setUpViewType(): void {
    if (this._isGridView()) {
      this.rowClassName = "rowContainer";
    } else {
      this.rowClassName = "lolomoRow";
    }
  }
  // view end

  // row start
  _getFirstRowFromViewport(): Element | null {
    const rows = document.getElementsByClassName(this.rowClassName);

    if (rows.length === 0) {
      return null;
    }

    const rowInViewport = Array.from(rows).find((row) => isInViewport(row));

    return rowInViewport || null;
  }

  _getFirstNRowsFromViewport(n: number): Element[] {
    const rows = document.getElementsByClassName(this.rowClassName);
    let rowsInViewport: Element[] = [];

    if (rows.length === 0) {
      return rowsInViewport;
    }

    for (let i = 0; i < rows.length; i++) {
      if (isInViewport(rows[i])) {
        rowsInViewport.push(rows[i]);

        if (rowsInViewport.length === n) {
          break;
        }
      }
    }

    return rowsInViewport;
  }

  _isBigRow(row: Element): boolean {
    return row.classList.contains("lolomoBigRow");
  }

  _isOriginalsRow(row: Element): boolean {
    return row.classList.contains("originals-panels-row");
  }

  _isRowSpecial(row: Element): boolean {
    return this._isBigRow(row) || this._isOriginalsRow(row);
  }

  _setBigRowFocus(row: Element): void {
    this._resetBillboardFocus();
    this._resetLastActiveSliderItem();

    const playButton = row.querySelector(".bigRowItem .playLink");

    if (playButton && playButton instanceof HTMLElement) {
      playButton.focus();
    }
  }

  _resetBigRowFocus(row: Element): void {
    const playButton = row.querySelector(".bigRowItem .playLink");

    if (playButton && playButton instanceof HTMLElement) {
      playButton.blur();
    }
  }

  _isRowInViewportSpecial(row: Element): boolean {
    const isOriginalsPanelRow =
      this._isOriginalsRow(row) ||
      (this.lastActiveRow ? this._isOriginalsRow(this.lastActiveRow) : false);

    if (isOriginalsPanelRow) {
      return isOriginalsPanelRow;
    }

    const isBigRow =
      this._isBigRow(row) ||
      (this.lastActiveRow ? this._isBigRow(this.lastActiveRow) : false);

    if (isBigRow) {
      return isBigRow;
    }

    return false;
  }

  _getInitialRowToFocus(): Element | null {
    let row = null;

    // Focus billboard
    if (this._isBillboardInViewport()) {
      row = document.getElementsByClassName(
        "volatile-billboard-animations-container"
      )[0];
    } else {
      // Focus rows
      row = this._getFirstRowFromViewport();

      if (!row) {
        const rows = document.getElementsByClassName(this.rowClassName);

        if (rows.length !== 0) {
          row = rows[0];
        }
      }
    }

    return row;
  }

  _getSiblingRow(row: Element, direction: SiblingElementDirection = "next") {
    if (direction === "next") {
      if (
        row.nextElementSibling &&
        row.nextElementSibling.classList.contains(this.rowClassName)
      ) {
        return row.nextElementSibling;
      }

      return null;
    } else if (direction === "previous") {
      const previousElement = row.previousElementSibling;

      if (previousElement) {
        if (
          previousElement.classList.contains(this.rowClassName) ||
          previousElement.classList.contains(
            "volatile-billboard-animations-container"
          )
        ) {
          return previousElement;
        }

        return null;
      }
    }
  }

  _getRowIntoViewport(row: Element, isFirst: boolean, direction: string) {
    if (isFirst) {
      const topPosition =
        (row as HTMLElement).offsetTop -
        ((document.getElementsByClassName(
          "pinning-header-container"
        )[0] as HTMLElement).offsetHeight +
          10);

      window.scrollTo(0, topPosition);
      return;
    }

    if (!isInViewport(row)) {
      if (direction === "up") {
        const topPosition =
          (row as HTMLElement).offsetTop -
          (this.rowClassName === "rowContainer"
            ? 0
            : (document.getElementsByClassName(
                "pinning-header-container"
              )[0] as HTMLElement)!.offsetHeight + 10);

        window.scrollTo(0, topPosition);
      } else {
        let rowToScrollTo = row;

        if (this._isRowInViewportSpecial(row)) {
          rowToScrollTo = row;
        } else {
          const firstTwoRowsFromViewport = this._getFirstNRowsFromViewport(2);
          const rowInViewport =
            firstTwoRowsFromViewport[1] || firstTwoRowsFromViewport[0];

          if (rowInViewport && !this._isRowInViewportSpecial(rowInViewport)) {
            rowToScrollTo = rowInViewport;
          }
        }

        const topPosition =
          (rowToScrollTo as HTMLElement).offsetTop -
          ((document.getElementsByClassName(
            "pinning-header-container"
          )[0] as HTMLElement).offsetHeight +
            10) *
            (this.rowClassName === "rowContainer" ? -1 : 1);

        window.scrollTo(0, topPosition);
      }
    }
  }
  // row end

  // billboard start
  _isBillboardRow(row: Element): boolean {
    const billboardRow = row.classList.contains(
      "volatile-billboard-animations-container"
    );

    if (billboardRow) {
      return true;
    }

    return false;
  }

  _isBillboardInViewport(): boolean {
    const billboardRow = document.getElementsByClassName(
      "volatile-billboard-animations-container"
    )[0];

    if (billboardRow) {
      const billboardDetails = billboardRow.getElementsByClassName(
        "logo-and-text"
      )[0];

      if (billboardDetails && isInViewport(billboardDetails)) {
        return true;
      }

      return false;
    }

    return false;
  }

  _setBillboardFocus(): void {
    this._resetLastActiveSliderItem();
    this.activeColumnIndex = -1;

    const playButton = document.querySelector(
      ".volatile-billboard-animations-container .billboard-links .playLink .color-primary"
    );

    if (playButton && playButton instanceof HTMLElement) {
      playButton.focus({
        preventScroll: true,
      });
    }
  }

  _resetBillboardFocus(): void {
    const playButton = document.querySelector(
      ".volatile-billboard-animations-container .billboard-links .playLink .color-primary"
    );

    if (
      playButton &&
      playButton === document.activeElement &&
      playButton instanceof HTMLElement
    ) {
      playButton.blur();
    }
  }
  // billboard end

  // slider start
  _focusSliderItemInRow(
    direction: ArrowDirectionHorizontal | ArrowDirectionVertical
  ) {
    const slider = this.currentActiveRow!.getElementsByClassName("slider")[0];

    if (!slider) {
      if (this._isBigRow(this.currentActiveRow!)) {
        this._setBigRowFocus(this.currentActiveRow!);
      }

      return;
    }

    if (this.activeColumnIndex === -1) {
      if (this._hasSliderMovedOnce(slider)) {
        this._setCurrentActiveSliderItem(1);
      } else {
        this._setCurrentActiveSliderItem(0);
      }
    } else {
      if (direction === "right" || direction === "left") {
        const currentSliderItemInFocus = slider.getElementsByClassName(
          this.activeSliderItemClassName
        )[0];

        if (
          !currentSliderItemInFocus ||
          !isInViewport(currentSliderItemInFocus)
        ) {
          if (this._hasSliderMovedOnce(slider)) {
            this._setCurrentActiveSliderItem(1);
          } else {
            this._setCurrentActiveSliderItem(0);
          }
        } else {
          this._getSiblingSliderItemIndex(direction)
            .then((index) => {
              if (typeof index !== "undefined") {
                this._setCurrentActiveSliderItem(index);
              }
            })
            .catch((err) => {
              console.error(err);
            });
        }
      } else {
        const hasLastSliderMoved = this._hasSliderMovedOnce(this.lastActiveRow);
        const hasCurrentSliderMoved = this._hasSliderMovedOnce(
          this.currentActiveRow
        );

        if (hasLastSliderMoved && !hasCurrentSliderMoved) {
          this._setCurrentActiveSliderItem(this.activeColumnIndex - 1);
        } else if (!hasLastSliderMoved && hasCurrentSliderMoved) {
          this._setCurrentActiveSliderItem(this.activeColumnIndex + 1);
        } else {
          this._setCurrentActiveSliderItem(this.activeColumnIndex);
        }
      }
    }
  }

  _hasSliderMovedOnce(slider: Element | null) {
    if (!slider) {
      return false;
    }

    const sliderContent = slider.getElementsByClassName("sliderContent")[0];

    if (!sliderContent) {
      return false;
    }

    const outsideViewportSliderItem = slider.getElementsByClassName(
      "slider-item-"
    )[0];

    if (!outsideViewportSliderItem) {
      return false;
    }

    const sliderItemIndex = Array.prototype.indexOf.call(
      sliderContent.children,
      outsideViewportSliderItem
    );

    if (sliderItemIndex !== 0) {
      return false;
    }

    return true;
  }
  // slider end

  // slider items start
  _setCurrentActiveSliderItem(index: number) {
    this._resetBillboardFocus();
    this._resetLastActiveSliderItem();

    const slider = this.currentActiveRow!.getElementsByClassName("slider")[0];

    if (slider) {
      const sliderItemToFocus = slider.getElementsByClassName(
        `slider-item-${index}`
      )[0];

      if (sliderItemToFocus) {
        sliderItemToFocus.classList.add(this.activeSliderItemClassName);

        this._focusSliderItemCard(sliderItemToFocus);

        this.activeColumnIndex = index;
      } else {
        // make last slider item active
        const sliderItems = slider.getElementsByClassName("slider-item");

        if (sliderItems.length !== 0) {
          const lastSliderItem = sliderItems[sliderItems.length - 1];

          lastSliderItem.classList.add(this.activeSliderItemClassName);

          this._focusSliderItemCard(lastSliderItem);

          this.activeColumnIndex = sliderItems.length - 1;
        } else {
          this.activeColumnIndex = -1;
        }
      }
    }
  }

  _resetLastActiveSliderItem() {
    const rows = [this.lastActiveRow, this.currentActiveRow].filter(
      (row) => row
    );

    rows.forEach((row) => {
      const slider = row!.getElementsByClassName("slider")[0];

      if (slider) {
        const lastActiveSliderItem = slider.getElementsByClassName(
          this.activeSliderItemClassName
        )[0];

        if (lastActiveSliderItem) {
          lastActiveSliderItem.classList.remove(this.activeSliderItemClassName);

          this._closeMiniPreviewModal(lastActiveSliderItem);
        }
      } else {
        if (this._isBigRow(row!)) {
          this._resetBigRowFocus(row!);
        }
      }
    });
  }

  _getSiblingSliderItemIndex(direction = "right"): Promise<number> {
    return new Promise((resolve, reject) => {
      const currentSliderItemInFocus = this.currentActiveRow!.getElementsByClassName(
        this.activeSliderItemClassName
      )[0];

      if (currentSliderItemInFocus) {
        if (direction === "left") {
          if (!currentSliderItemInFocus.previousElementSibling) {
            return this.activeColumnIndex;
          }
        } else {
          if (!currentSliderItemInFocus.nextElementSibling) {
            return this.activeColumnIndex;
          }
        }
      }

      const columnIndexLimit = this._hasSliderMovedOnce(this.currentActiveRow)
        ? direction === "left"
          ? 1
          : this.columnCount
        : direction === "left"
        ? 0
        : this.columnCount - 1;

      if (this.activeColumnIndex === columnIndexLimit) {
        if (this.isSliderControlButtonClickInProgress) {
          resolve();

          return;
        }

        const controlButton = this.currentActiveRow!.getElementsByClassName(
          direction === "left" ? "handlePrev" : "handleNext"
        )[0];

        if (!controlButton) {
          resolve();

          return;
        }

        const slider = this.currentActiveRow!.getElementsByClassName(
          "slider"
        )[0];
        const sliderContent = slider!.getElementsByClassName(
          "sliderContent"
        )[0];
        const lastActiveSliderItem = slider!.getElementsByClassName(
          this.activeSliderItemClassName
        )[0]!;

        const lastActiveSliderCardItemDetails = this._getSliderItemCardDetails(
          lastActiveSliderItem
        );

        const _this = this;
        let timerId: number | undefined = undefined;

        function handleControlButtonTransitionEnd(event: Event) {
          if (event.target !== sliderContent) {
            return;
          }

          clearTimeout(timerId);

          timerId = setTimeout(() => {
            let siblingIndex;

            // handle a case where slider has multiple cards with same id
            const sliderItemCards = slider!.querySelectorAll(
              `[id="title-card-${lastActiveSliderCardItemDetails.rowIndex}-${
                lastActiveSliderCardItemDetails.cardIndex +
                (direction === "left" ? -1 : 1)
              }"]`
            );

            const sliderItemCardInViewport = Array.from(
              sliderItemCards
            ).find((card) => isInViewport(card));

            if (sliderItemCardInViewport) {
              const sliderItem = sliderItemCardInViewport.closest(
                ".slider-item"
              )!;
              const sliderItemIndex = _this._getSliderItemIndex(sliderItem);

              siblingIndex = sliderItemIndex;
            } else {
              siblingIndex = direction === "left" ? _this.columnCount : 1;
            }

            sliderContent!.removeEventListener(
              "transitionend",
              handleControlButtonTransitionEnd
            );

            _this.isSliderControlButtonClickInProgress = false;

            resolve(siblingIndex);
          }, 300);
        }

        sliderContent!.addEventListener(
          "transitionend",
          handleControlButtonTransitionEnd
        );

        if (currentSliderItemInFocus) {
          this._closeMiniPreviewModal(currentSliderItemInFocus);
        }

        if (controlButton instanceof HTMLElement) {
          controlButton.click();
        }
        this.isSliderControlButtonClickInProgress = true;
        trackEvent("slider-controls", "click", direction);
      } else {
        resolve(this.activeColumnIndex + (direction === "left" ? -1 : 1));

        return;
      }
    });
  }

  _focusSliderItemCard(sliderItem: Element) {
    const card = sliderItem.getElementsByClassName("title-card")[0];

    if (!card) {
      return;
    }

    const cardLinkElement = card.querySelector("a.slider-refocus");

    if (cardLinkElement) {
      if (cardLinkElement instanceof HTMLElement) {
        cardLinkElement.focus({
          preventScroll: true,
        });
      }
    }

    this._openMiniPreviewModal(sliderItem);
  }

  _getCardIdDetails(id: string) {
    const idMatches = id.match(CARD_ID_REGEX);

    return {
      row: Number(idMatches![1]),
      index: Number(idMatches![2]),
    };
  }

  _getSliderItemIndex(sliderItem: Element) {
    const itemClassList = sliderItem.classList;

    let itemIndex = -1;

    const itemIndexClassName = Array.from(itemClassList).find((className) =>
      SLIDER_ITEM_INDEX_REGEX.test(className)
    );

    if (itemIndexClassName) {
      itemIndex = Number(itemIndexClassName.match(SLIDER_ITEM_INDEX_REGEX)![1]);
    }

    return itemIndex;
  }

  _getSliderItemCardDetails(sliderItem: Element) {
    let rowIndex = -1;
    let cardIndex = -1;

    const card = sliderItem.getElementsByClassName("title-card")[0];

    if (card) {
      const cardId = card.getAttribute("id");

      if (cardId) {
        const cardDetails = this._getCardIdDetails(cardId);

        rowIndex = cardDetails.row;
        cardIndex = cardDetails.index;
      }
    }

    return {
      rowIndex,
      cardIndex,
    };
  }
  // slider items end

  // mini preview modal start
  _openMiniPreviewModal(sliderItem: Element) {
    const card = sliderItem.getElementsByClassName("title-card")[0];

    if (!card) {
      return;
    }

    clearTimeout(this.miniPreviewModalTimerId);

    this.miniPreviewModalTimerId = setTimeout(() => {
      if (this._isDetailModalOpen()) {
        setTimeout(() => {
          this._focusDetailModalPlayButton();
        }, 500);

        return;
      }

      if (this.isSliderControlButtonClickInProgress) {
        return;
      }

      const mouseoverEvent = new MouseEvent("mouseover", {
        bubbles: true,
        cancelable: true,
        composed: true,
      });

      this.isMiniPreviewModalActive = true;

      this.miniPreviewModalObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      card.dispatchEvent(mouseoverEvent);
      trackEvent("mini-modal", "view");
    }, this.miniPreviewModalAutoplayDelay);
  }

  _closeMiniPreviewModal(sliderItem: Element): void {
    if (sliderItem instanceof HTMLElement) {
      sliderItem.blur();
    }

    clearTimeout(this.miniPreviewModalTimerId);

    if (this.isMiniPreviewModalActive) {
      const card = sliderItem.getElementsByClassName("title-card")[0];

      const mouseoutEvent = new MouseEvent("mouseout", {
        bubbles: true,
        cancelable: true,
        composed: true,
      });

      const escapeEvent = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        composed: true,
        key: "Escape",
      });

      if (card) {
        card.dispatchEvent(mouseoutEvent);
      }
      window.dispatchEvent(escapeEvent);

      this.isMiniPreviewModalActive = false;
    }
  }

  _handleSpecialMiniPreviewModalClose(): void {
    const _this = this;

    function handleOriginalsModalClose(event: Event) {
      const activePreviewModal = document.querySelector(
        `.${_this.activeSliderItemClassName} .bob-card-adult-tall-panel-video-merch`
      );

      if (
        activePreviewModal &&
        !activePreviewModal.contains(event.target as HTMLElement)
      ) {
        setTimeout(() => {
          const bobCard = activePreviewModal.closest(".bob-container");

          if (!bobCard) {
            return;
          }

          const mouseoutEvent = new MouseEvent("mouseout", {
            bubbles: true,
            cancelable: true,
            composed: true,
          });

          bobCard.dispatchEvent(mouseoutEvent);
        }, 100);

        document.removeEventListener("mousemove", handleOriginalsModalClose);
      }
    }

    document.addEventListener("mousemove", handleOriginalsModalClose);
  }

  _miniPreviewModalMutationObserverHandler(mutations: MutationRecord[]): void {
    mutations.forEach((mutation: MutationRecord) => {
      if (mutation.type === "childList") {
        const addedNodes = mutation.addedNodes;

        for (let i = 0; i < addedNodes.length; i++) {
          const addedNode = addedNodes[i] as Element;

          if (addedNode && addedNode.classList) {
            let nodeFound = false;

            if (
              addedNode.classList.contains("previewModal--wrapper") &&
              addedNode.classList.contains("mini-modal")
            ) {
              nodeFound = true;

              const playButton = addedNode.querySelector(
                ".buttonControls--container .playLink"
              );

              if (playButton) {
                setTimeout(() => {
                  if (playButton instanceof HTMLElement) {
                    playButton.focus({
                      preventScroll: true,
                    });
                  }
                }, 250);
              }
            } else if (
              addedNode.classList.contains(
                "bob-card-adult-tall-panel-video-merch"
              )
            ) {
              nodeFound = true;

              const playButton = addedNode.querySelector(
                ".bob-buttons-wrapper .playLink"
              );

              if (playButton) {
                setTimeout(() => {
                  if (playButton instanceof HTMLElement) {
                    playButton.focus({
                      preventScroll: true,
                    });
                  }

                  this._handleSpecialMiniPreviewModalClose();
                }, 250);
              }
            }

            if (nodeFound) {
              this.miniPreviewModalObserver.disconnect();

              break;
            }
          }
        }
      }
    });
  }
  // mini preview modal end

  // detail modal start
  _isDetailModalOpen(): boolean {
    const detailModal = document.getElementsByClassName(
      "previewModal--wrapper detail-modal"
    )[0];

    if (detailModal) {
      return true;
    }

    return false;
  }

  _focusDetailModalPlayButton(): void {
    const playButton = document.querySelector(
      ".previewModal--wrapper.detail-modal .buttonControls--container .playLink"
    );

    if (playButton) {
      if (playButton instanceof HTMLElement) {
        playButton.focus({
          preventScroll: true,
        });
      }
    }
  }
  // detail modal end
}

export default NetflixNavigator;
