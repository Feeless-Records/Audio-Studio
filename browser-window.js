/** Generic browser/device family module. No business dependencies. */
export function observeViewport(win, onChange) {
  const read=()=>onChange({width:win.innerWidth,height:win.innerHeight,coarse:win.matchMedia("(pointer: coarse)").matches});
  win.addEventListener("resize",read);win.visualViewport?.addEventListener("resize",read);read();
  return ()=>{win.removeEventListener("resize",read);win.visualViewport?.removeEventListener("resize",read);};
}
