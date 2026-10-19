// DOM layout primitives; GPU geometry layout lives in text-processor.js.
export function createWelcome(root,title,subtitle){
 const heading=document.createElement("h1");heading.textContent=title;
 const description=document.createElement("p");description.textContent=subtitle;
 root.replaceChildren(heading,description);
 return {heading,description};
}
