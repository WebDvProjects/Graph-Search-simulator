// slider settings
const slider = document.getElementById("anim-speed");
const sliderComputedStyle = getComputedStyle(slider);

// set the initial speed value (Our speed is a value between 0 and 1)
let speed = slider.value / slider.max;
let numRegex = RegExp(/\d*/);
slider.oninput = function () {
  // update the speed value
  speed = this.value / this.max;

  // log the speed
  slider.style.setProperty("--speed", `${this.value}`);

  // get the number portion of the width (ignores the unit ie. px)
  const width = numRegex.exec(sliderComputedStyle.width)[0];

  // calculate the position of the slider thumb
  const pos = (this.value / this.max) * width;

  // update the thumb position css curtom variable
  // since the variable uses -ve position to slice the slider track from the right (with box-shadow: inset)
  // we need to subtract the position from the width to get the desirable position
  // we could pass in the positive value but the border-radius applies to the inset box-shadow so it looks weird
  slider.style.setProperty("--thumb-pos", `${pos - width}px`);
};

function getSpeed() {
  return speed;
}

window.addEventListener("load", function () {
  // trigger the slider input event to update the speed value
  slider.dispatchEvent(new Event("input"));
});

export { getSpeed };
