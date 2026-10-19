// CSS-driven animation, independent of the rendering backend.
export function animateFlying(element,seconds=4){
 element.style.animationDuration=`${seconds}s`;
 element.style.animationPlayState=matchMedia("(prefers-reduced-motion: reduce)").matches?"paused":"running";
 return {pause:()=>element.style.animationPlayState="paused",play:()=>element.style.animationPlayState="running"};
}
