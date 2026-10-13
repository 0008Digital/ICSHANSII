// Pure assertions make the live-browser check reproducible in the frontend test suite.
export function sidebarLayoutIssues({documentWidth,viewportWidth,viewportHeight,navbar,navbarPosition,sidebar,nav,footer,workspace,contentTop,sidebarPosition,sidebarOverflowY,navOverflowY,scrollbarWidth,sidebarDisplay}) {
 const issues=[];const desktop=viewportWidth>=768;
 if(documentWidth>viewportWidth+1)issues.push('horizontal overflow');
 if(desktop){
  if(navbarPosition!=='fixed'||Math.abs(navbar.left)>1||Math.abs(navbar.right-viewportWidth)>1||Math.abs(navbar.top)>1)issues.push('global navbar is not full-width and fixed');
  if(sidebarPosition!=='fixed'||Math.abs(sidebar.top-navbar.bottom)>1||Math.abs(sidebar.bottom-viewportHeight)>1)issues.push('sidebar not fixed beneath navbar');
  if(contentTop<navbar.bottom-1)issues.push('workspace content overlaps global navbar');
  if(Math.abs(workspace.left-sidebar.right)>1)issues.push('workspace offset mismatch');
  const short=viewportHeight<=440,scrollHostOverflow=short?sidebarOverflowY:navOverflowY;
  if(scrollbarWidth!=='none')issues.push('visible sidebar scrollbar');
  if((short||nav.overflows)&&!['auto','scroll'].includes(scrollHostOverflow))issues.push('overflowing sidebar is not scrollable');
  if(!short&&(footer.bottom>viewportHeight+1||nav.bottom>footer.top+1))issues.push('navigation/footer collision');
 }else if(sidebarDisplay!=='none')issues.push('mobile sidebar visible');
 return issues;
}

// Execute in a browser page context; assertions inspect the live layout, not CSS text.
export function inspectSidebarLayout() {
 const bar=document.querySelector('.global-workspace-header'),side=document.querySelector('.sidebar'),nav=document.querySelector('.sidebar-navigation'),footer=document.querySelector('.sidebar-identity'),work=document.querySelector('.workspace'),main=document.querySelector('.workspace-main');
 if(!bar||!side||!nav||!footer||!work||!main)throw new Error('workspace shell elements are missing');
 const b=bar.getBoundingClientRect(),r=side.getBoundingClientRect(),w=work.getBoundingClientRect(),m=main.getBoundingClientRect(),n=nav.getBoundingClientRect(),f=footer.getBoundingClientRect();
 const short=innerHeight<=440,scrollHost=short?side:nav;
 const issues=sidebarLayoutIssues({documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,viewportHeight:innerHeight,navbar:{top:b.top,bottom:b.bottom,left:b.left,right:b.right},navbarPosition:getComputedStyle(bar).position,sidebar:{top:r.top,bottom:r.bottom,right:r.right,width:r.width},nav:{top:n.top,bottom:n.bottom,overflows:nav.scrollHeight>nav.clientHeight},footer:{top:f.top,bottom:f.bottom},workspace:{left:w.left},contentTop:m.top,sidebarPosition:getComputedStyle(side).position,sidebarOverflowY:getComputedStyle(side).overflowY,navOverflowY:getComputedStyle(nav).overflowY,scrollbarWidth:getComputedStyle(scrollHost).scrollbarWidth,sidebarDisplay:getComputedStyle(side).display});
 if(issues.length)throw new Error(issues.join('; '));
 return {width:innerWidth,height:innerHeight,desktop:innerWidth>=768,navbarHeight:b.height,sidebarWidth:r.width,navOverflow:nav.scrollHeight>nav.clientHeight,navScroll:nav.scrollTop,footerBottom:f.bottom,issues};
}
