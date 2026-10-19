export class LayoutSystem {
  constructor(root){this.root=root;}
  renderWelcome(title,subtitle){
    const group=document.createElement("div");group.className="welcome-group";
    const h=document.createElement("h1");h.textContent=title;
    const button=document.createElement("button");
    button.type="button";button.id="startButton";button.textContent="Play Sample";
    button.setAttribute("aria-pressed","false");
    const saw=document.createElement("button");
    saw.type="button";saw.id="sawButton";saw.textContent="Play Saw Wave";
    saw.setAttribute("aria-pressed","false");
    const label=document.createElement("label");
    label.htmlFor="frequencySlider";label.className="frequency-label";
    label.textContent="Frequency: ";
    const value=document.createElement("output");value.id="frequencyValue";value.textContent="440 Hz";
    label.append(value);
    const slider=document.createElement("input");
    slider.type="range";slider.id="frequencySlider";slider.min="0";slider.max="1000";
    slider.step="1";slider.value=String(Math.round(1000*Math.log(440/20)/Math.log(1000)));slider.setAttribute("aria-label","Saw wave frequency in Hz");
    const fftCanvas=document.createElement("canvas");
    fftCanvas.id="fftAnalyzer";
    fftCanvas.setAttribute("aria-label","FFT spectrum analyzer with sixteen bands");
    const chordField=document.createElement("div");
    chordField.id="chordDisplay";chordField.setAttribute("role","status");
    chordField.setAttribute("aria-live","off");
    chordField.textContent="Аккорд: — | Нет нажатых нот";
    const quintButton=document.createElement("button");
    quintButton.type="button";quintButton.id="quintButton";quintButton.textContent="Show quint circle";
    quintButton.setAttribute("aria-pressed","false");
    const p=document.createElement("p");p.textContent=subtitle;
    const hint=document.createElement("p");
    hint.className="keyboard-hint";
    hint.textContent="Keyboard: Q 2 W 3 E ... [ = ] (C4–G5), Z S X D C ... / (C3–E4). Hold keys to play notes.";
    group.append(h,button,saw,label,slider,fftCanvas,chordField,quintButton,hint,p);
    this.root.replaceChildren(group);
    return {startButton:button,sawButton:saw,frequencySlider:slider,frequencyValue:value,fftCanvas,chordField,quintButton};
  }
}
