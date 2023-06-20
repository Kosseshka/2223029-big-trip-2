import { render, replace, remove } from '../framework/render';
import PointView from '../view/point';
import EditPointView from '../view/edit-point';
import { UserAction, UpdateType } from '../const';
import { getDifference } from '../utils';

const Mode = {
  DEFAULT: 'DEFAULT',
  EDITING: 'EDITING'
}
class PointPresenter {
  constructor (tripList, points, changeData, modeChange) {
    this._tripListComponent = tripList;
    this._pointsModel = points;
    this._changeData = changeData;
    this._handleModeChange = modeChange;
    this._mode = Mode.DEFAULT;
    this._point = null;
    this._offers = null;
    this._destination = null;
    this._pointComponent = null;
    this._pointEditComponent = null;
  }
  init = (point) => {
    this._point = point
    const prevPointComponent = this._pointComponent
    const prevPointEditComponent = this._pointEditComponent
    this._offers = this._pointsModel.getOffers(this._point)
    this._destination = this._pointsModel.getDestination(this._point)
    this._pointComponent = new PointView(this._point, this._offers, this._destination);
    this._pointEditComponent = new EditPointView(this._point, this._offers, this._destination);
    this._pointComponent.setFavoriteClickHandler(this._handleFavoriteClick)
    this._pointComponent.setEditClickHandler(this._handleEditSubmitClick)

    this._pointEditComponent.setFormSubmitHandler(this._handleFormSubmitClick);

    this._pointEditComponent.setButtonClickHandler(this._handleButtonlick);

    this._pointEditComponent.setDeleteClickHandler(this._handleDeleteClick);

    if (prevPointComponent == null || prevPointEditComponent === null) {
      render(this._pointComponent, this._tripListComponent)
      return
    }
    if (this._mode === Mode.DEFAULT) {
      replace(this._pointComponent, prevPointComponent)
    }

    if (this._mode === Mode.EDITING) {
      replace(this._pointEditComponent, prevPointEditComponent)
    }
    remove(prevPointComponent)
    remove(prevPointEditComponent)
  }
  destroy = () => {
    remove(this._pointComponent)
    remove(this._pointEditComponent)
  }
  resetView = () => {
    if (this._mode !== Mode.DEFAULT) {
      this._pointEditComponent.reset(this._point)
      this._replaceFormToPoint()
    }
  }
  _replacePointToForm = () => {
    this._handleModeChange()
    this._mode = Mode.EDITING
    replace(this._pointEditComponent, this._pointComponent);
  };
  _replaceFormToPoint = () => {
    replace(this._pointComponent, this._pointEditComponent);
    this._mode = Mode.DEFAULT
  };
  _onEscKeyDown = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this._pointEditComponent.reset(this._point)
      this._replaceFormToPoint();
      document.removeEventListener('keydown', this._onEscKeyDown);
    }
  };
  _handleEditSubmitClick = () => {
    this._replacePointToForm(this._points);
    document.addEventListener('keydown', this._onEscKeyDown);
  }

  _handleFavoriteClick = () => {
    this._changeData(
      UserAction.UPDATE_POINT,
      UpdateType.MINOR,
      {...this._point, isFavorite: !this._point.isFavorite})
  };

  _handleFormSubmitClick = (update) => {
    const isMinorUpdate =
      this._point.basePrice !== update.basePrice ||
      this._point.offers.toString() !== update.offers.toString() ||
      getDifference(this._point.dateTo, this._point.dateFrom, 'minute') !==
      getDifference(update.dateTo, update.dateFrom, 'minute')

    this._replaceFormToPoint()

    this._changeData(
      UserAction.UPDATE_POINT,
      isMinorUpdate? UpdateType.MINOR: UpdateType.PATCH,
      update)

    document.removeEventListener('keydown', this._onEscKeyDown);
  }

  _handleButtonlick = () => {
    this._pointEditComponent.reset(this._point)
    this._replaceFormToPoint()
    document.removeEventListener('keydown', this._onEscKeyDown)
  }

  _handleDeleteClick = (point) => {
    this._changeData(
      UserAction.DELETE_POINT,
      UpdateType.MINOR,
      point
    );
  }
}

export default PointPresenter;
