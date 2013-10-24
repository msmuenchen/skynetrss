//SkyRSS component mobify
if(typeof appstate!="object")
  appstate={};
if(typeof appconfig!="object")
  appconfig={};

$(document).ready(function() {
  console.glog("component.mobify","initializing");
  appstate.mobile=false;
  appstate.lastView="";
  $(window).hashchange(function(e) {
    var h=location.hash;
    var r=/menu/.exec(h);
    var oldUrl;
    if(e && e.originalEvent && e.originalEvent.oldURL)
      oldUrl=e.originalEvent.oldURL;
    else
      oldUrl=false;
    
    var oldHash;
    if(oldUrl) {
      //idea from https://gist.github.com/jlong/2428561
      var p=document.createElement("a");
      p.href=oldUrl;
      oldHash=p.hash;
    } else {
      oldHash="index";
    }
    console.glog("component.mobify","hashchange from",appstate.lastView,"to",h,"oldhash",oldHash);
    if(!r) {
      if(appstate.mobile==true) {
        appstate.lastView=oldHash;
        $("#content").show();
        $("#menu").hide();
      }
      return;
    }

    if(appstate.mobile==true) {
      appstate.lastView=oldHash;
      $("#content").hide();
      $("#menu").show();
    } else {
      location.hash=oldHash;
    }
  });
  $(window).resize(function() {
    if(appstate.view=="feed") {
      $("#feedentries").scroll();
      $(".feedline.open iframe").each(function() {
        if(this.contentWindow && this.contentWindow.postMessage)
          this.contentWindow.postMessage({type:"geth"},'*');
      });
    }
    //http://responsejs.com/labs/dimensions/
    var correctedViewportW = (function (win, docElem) {
      var mM = win['matchMedia'] || win['msMatchMedia'], client = docElem['clientWidth'], inner = win['innerWidth']
      return mM && client < inner && true === mM('(min-width:' + inner + 'px)')['matches'] ? function () { return win['innerWidth'] } : function () { return docElem['clientWidth'] }
    }(window, document.documentElement));
    var correctedViewportH = (function (win, docElem) {
      var mM = win['matchMedia'] || win['msMatchMedia'], client = docElem['clientHeight'], inner = win['innerHeight']
      return mM && client < inner && true === mM('(min-height:' + inner + 'px)')['matches'] ? function () { return win['innerHeight'] } : function () { return docElem['clientHeight'] }
    }(window, document.documentElement));
    if(correctedViewportW()>appconfig.menuWidthBreakpoint) {
      if(appstate.mobile==false) {
        console.glog("component.mobify","was in desktop, still in desktop");
        return;
      }
      console.glog("component.mobify","switching from mobile to desktop");
      console.glog("component.mobify","current hash",location.hash);
      if(location.hash=="#menu") {
        console.glog("component.mobify","old location",appstate.lastView);
        location.hash=appstate.lastView;
      }
      appstate.mobile=false;
      $("#content,#menu").show();
    } else {
      if(appstate.mobile==true) {
        console.glog("component.mobify","was in mobile, still in mobile");
        return;
      }
      console.glog("component.mobify","switching from desktop to mobile");
      $("#content").show();
      $("#menu").hide();
      appstate.mobile=true;
      $(window).hashchange(); //check if current hash is menu...
    }
  }).resize();
});