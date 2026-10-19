export class LayoutSystem {
  constructor(root){this.root=root;}
  renderWelcome(title,subtitle){
    const h=document.createElement("h1");h.textContent=title;
    const p=document.createElement("p");p.textContent=subtitle;
    this.root.replaceChildren(h,p);
  }
}
