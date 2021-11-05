const displayedImage = document.querySelector('.displayed-img');
const thumbBar = document.querySelector('.thumb-bar');

const btn = document.querySelector('button');
const overlay = document.querySelector('.overlay');

/* Looping through images */
for (let i = 1; i < 6; i++) {
  const newImage = document.createElement('img');
  let imageSrc = `images/pic${i}.jpg`

  newImage.setAttribute('src', imageSrc);
  thumbBar.appendChild(newImage);

  newImage.onclick = function() {
    displayedImage.src = imageSrc;
  }
}
/* Wiring up the Darken/Lighten button */
btn.addEventListener('click', darkenLightenBtn)

function darkenLightenBtn() {
  const currentLight = btn.getAttribute('class');

  if (currentLight === 'dark') {
    btn.setAttribute('class', 'light');
    btn.textContent = 'Lighten';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  } else if (currentLight === 'light') {
    btn.setAttribute('class', 'dark');
    btn.textContent = 'Darken';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
  }
}