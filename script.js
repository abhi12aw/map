'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
      'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}`
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.CalcPace();
    this._setDescription();
  }

  CalcPace() {
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.CalcSpeed();
    this._setDescription();
  }

  CalcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

class App {
  _map;
  _mapZoom = 13;
  _mapEvent;
  workouts = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationfield);
    containerWorkouts.addEventListener('click', this.moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('could not get position');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    let coords = [latitude, longitude];
    this._map = L.map('map').setView(coords, this._mapZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);
    this._map.on('click', this._showForm.bind(this));
    this.workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    })
  }

  _showForm(mapE) {
    form.classList.remove('hidden');
    this._mapEvent = mapE;
    inputDistance.focus();
  }

  _hideForm()  {
    form.style.display = 'none';
    form.classList.add('hidden');
    inputDistance.value = inputDuration.value = inputDistance.value = inputCadence.value = '';
    setTimeout(() => form.style.display = 'grid');
  }

  _toggleElevationfield() {
    inputCadence.parentNode.classList.toggle('form__row--hidden');
    inputElevation.parentNode.classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every(input => input > 0);

    const { lat, lng } = this._mapEvent.latlng;
    const type = inputType.value;
    let distance = +inputDistance.value;
    let duration = +inputDuration.value;
    let workout;

    if(type === 'running') {
      const cadence = +inputCadence.value;
      if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)) {
        return alert('please enter valid and positive number value');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (!validInputs(distance, duration, elevationGain) || !allPositive(distance, duration)) {
        return alert('please enter valid and positive number value');
      }
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    this.workouts.push(workout);
    this._setLocalStorage();
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._hideForm();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🦶🏼'} ${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = 
    `<li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🦶🏼'}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;
    if(workout.type === 'running') {
      html += 
      `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
       </div>
       <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    }

    if(workout.type === 'cycling')  {
      html += 
      `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  moveToPopup(e)  {
   const workoutEl = e.target.closest('.workout');
   if(!workoutEl) return;
   const workout = this.workouts.find( work => work.id === workoutEl.dataset.id )
   this._map.setView(workout.coords, this._mapZoom, {
     animate: true, 
       pan: {
         duration: 1,
       }
   })
  }

  _setLocalStorage()  {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  _getLocalStorage()  {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if(!data) return;
    this.workouts = data;
    this.workouts.forEach(work => {
      this._renderWorkout(work);
    })
  }

  rest()  {
    localStorage.removeItem('workouts');
    location.reload();
  }
}



const app = new App();