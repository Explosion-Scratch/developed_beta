export default async function ({notif, copy, storage: {local: storage}}) {
  // Create a new color picker instance
// https://iro.js.org/guide.html#getting-started
var colorPicker = new iro.ColorPicker(".colorPicker", {
  // color picker options
  // Option guide: https://iro.js.org/guide.html#color-picker-options
  width: window.innerWidth / 3,
  color: await storage.get("color_picker_color_value") || "rgb(255, 0, 0)",
  borderWidth: 1,
  borderColor: "#fff",
  layout: [
    { 
      component: iro.ui.Wheel,
      options: {}
    },
    { 
      component: iro.ui.Slider,
      options: {
        sliderType: 'value'
      }
    },
    { 
      component: iro.ui.Slider,
      options: {
        sliderType: 'saturation'
      }
    },
    { 
      component: iro.ui.Slider,
      options: {
        sliderType: 'alpha'
      }
    },
  ]
});

var values = document.getElementById("values");
var hexInput = document.getElementById("hexInput");

// https://iro.js.org/guide.html#color-picker-events
colorPicker.on(["color:init", "color:change"], function(color){
  var v = {};
  storage.set("color_picker_color_value", color.hex8String)
  if (color.alpha !== 1){
    v = {
      hex: color.hex8String,
      rgb: color.rgbaString,
      hsl: color.hslaString,
    }
  } else {
    v = {
      hex: color.hexString,
      rgb: color.rgbString,
      hsl: color.hslString,
    }
  }
  values.innerHTML = Object.entries(v).map(([key, val]) => `<span class="color p-3 mb-2 rounded shadow-md hover:shadow-xl hover:bg-green-600 hover:text-white ${key} cursor-pointer"><span class="color_label pr-1 opacity-50">${key}: </span><span class="color_value ${key} ${key}_val">${val}</span></span>`).join("\n")
  hexInput.value = color.hexString;
});

document.addEventListener("click", (e) => {
    if (document.querySelector("#values").contains(e.target)){
        copy(e.target.closest(".color").querySelector(".color_value").innerText);
        notif("Copied color!");
    }
})
hexInput.addEventListener('change', function() {
  colorPicker.color.hexString = this.value;
});
}
