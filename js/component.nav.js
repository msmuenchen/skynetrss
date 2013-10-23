//SkyRSS app component: menu display
if(typeof appstate!="object")
  appstate={};

$(document).ready(function() {
  console.glog("component.nav","initializing");
  appstate.view="";
  $(window).hashchange(function() {
    var h=location.hash;
    //check for empty hash (or that anti-XSS crap facebook puts to the login redirect)
    if(!h || h=="#_=_" || h=="#") {
      location.hash="index";
      return;
    }
    //This is one ugly fucker of a regexp.
    //For an explanation see http://regex101.com/r/yP8vV2
    var v=/^\#([^\/\s]+)(?:\/([^\s]*))?$/.exec(h);
    if(!v) {
      console.gerror("component.nav","invalid hash",h);
      return;
    }
    console.glog("component.nav","opening view",v[1],"with args",v[2]);
    appstate.view=v[1];
    $(".view").hide();
    $(document).trigger("skyrss_view_"+v[1],{args:v[2]});
  }).hashchange();
});
