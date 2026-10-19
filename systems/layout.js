export class LayoutSystem {
  constructor(root){this.root=root;}
  renderWelcome(title,subtitle){
    const group=document.createElement("div");group.className="welcome-group";
    const h=document.createElement("h1");h.textContent=title;
    const button=document.createElement("button");
    button.type="button";button.id="startButton";button.textContent="Play Sample";
    button.setAttribute("aria-pressed","false");
    const p=document.createElement("p");p.textContent=subtitle;
    group.append(h,button,p);
    this.root.replaceChildren(group);
    return button;
  }
}
