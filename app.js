// Render the welcome screen and flying text with plain JavaScript.
const app = document.getElementById("app");

const heading = document.createElement("h1");
heading.textContent = "Hello World!";

const description = document.createElement("p");
description.textContent = "Welcome to Feeless Records Audio Studio.";

app.append(heading, description);

const flyer = document.createElement("div");
flyer.className = "flying-text";
flyer.textContent = "Saatana! Perkele!";
document.body.append(flyer);

// Bounce between the viewport edges. Resize-safe and frame-rate independent.
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let x = 0;
  let direction = 1;
  let previousTime = null;
  const speed = 260; // pixels per second

  function animate(time) {
    if (previousTime !== null) {
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      const maxX = Math.max(0, window.innerWidth - flyer.offsetWidth);
      x = Math.max(0, Math.min(maxX, x + direction * speed * delta));
      if (x >= maxX) direction = -1;
      if (x <= 0) direction = 1;
    }
    flyer.style.transform = `translateX(${x}px)`;
    previousTime = time;
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}
