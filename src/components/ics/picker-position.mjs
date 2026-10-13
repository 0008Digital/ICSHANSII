const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));

/** Positions a shared picker in the workspace viewport without clipping the anchor or mobile dock. */
export function positionPicker({viewportLeft=0,viewportTop=0,viewportWidth,viewportHeight,pickerWidth,pickerHeight,trigger,mainLeft,mainRight,mobile=false,dockTop}) {
 const lower=dockTop===undefined?viewportTop+viewportHeight-12:Math.min(viewportTop+viewportHeight-12,dockTop-10);
 const usableLeft=mobile?viewportLeft+12:Math.max(viewportLeft+12,mainLeft??viewportLeft+12);
 const usableRight=mobile?viewportLeft+viewportWidth-12:Math.min(viewportLeft+viewportWidth-12,mainRight??viewportLeft+viewportWidth-12);
 const x=clamp((usableLeft+usableRight-pickerWidth)/2,viewportLeft+12,viewportLeft+viewportWidth-pickerWidth-12);
 const below=(trigger?.bottom??viewportTop+12)+6;
 const above=(trigger?.top??lower)-6-pickerHeight;
 const y=below+pickerHeight<=lower?Math.max(viewportTop+12,below):above>=viewportTop+12?above:Math.max(viewportTop+12,Math.min(below,lower-pickerHeight));
 return {left:x,top:y,lower};
}
