export function nextEnabledIndex(options, current, direction) {
 if(!options.length)return current;
 for(let step=1;step<=options.length;step++){
  const index=(current+direction*step+options.length)%options.length;
  if(!options[index]?.disabled)return index;
 }
 return current;
}
export function edgeEnabledIndex(options, edge) {
 const indexes=options.map((option,index)=>option?.disabled?null:index).filter(index=>index!==null);
 return indexes.length?(edge==="end"?indexes.at(-1):indexes[0]):0;
}
export function findEnabledPrefix(options, prefix) {
 return options.findIndex(option=>!option?.disabled&&String(option.label??"").toLocaleLowerCase().startsWith(prefix.toLocaleLowerCase()));
}
