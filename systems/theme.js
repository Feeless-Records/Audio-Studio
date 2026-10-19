const themes={dark:{background:"#10121a",foreground:"#eef1f8",accent:"#ffb542"},light:{background:"#f5f7fb",foreground:"#182030",accent:"#a34b00"}};
export function applyTheme(name="dark"){
 const selected=themes[name]??themes.dark;
 for(const [key,value] of Object.entries(selected))document.documentElement.style.setProperty(`--${key}`,value);
 return selected;
}
export const availableThemes=Object.keys(themes);
