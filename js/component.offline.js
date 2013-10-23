//SkyRSS component "offline"
if(window.applicationCache) {
  //start: check if we have a manifest
  window.applicationCache.addEventListener("checking",function() {
    console.glog("cache","checking appcache");
    $(document).ready(function() {
      $("#modal-container,#manifest-progress").show();
      $("#manifest-label").html("Checking application cache");
    });
  });
  //manifest unchanged, nothing to do
  window.applicationCache.addEventListener("noupdate",function() {
    $(document).ready(function() {
      $("#modal-container,#manifest-progress").hide();
    });
    console.glog("cache","no appcache update available");
  });
  //manifest has updates, ready to begin downloading
  window.applicationCache.addEventListener("downloading",function() {
    $(document).ready(function() {
      $("#manifest-label").html("Downloading new version of program");
    });
    console.glog("cache","got a download event");
  });
  //whoops
  window.applicationCache.addEventListener("error",function(e) {
    $(document).ready(function() {
      //when offline, fetching the manifest will also give an error... just act like we're online then, lol
//      $("#manifest-label").html("An error happened while loading the program. Please contact us!");
      $("#modal-container,#manifest-progress").hide();
    });
    console.glog("cache","got an error event",e);
  });
  //done with downloading one file
  window.applicationCache.addEventListener("progress",function(e) {
    //webkit supplies us with completion info
    if(e.lengthComputable) {
      $(document).ready(function() {
        $("#manifest-label").html("Downloading new version of a file... ("+e.loaded+" of "+e.total+" done)");
      });
      console.glog("cache","got a progress event -",e.loaded,"of",e.total,"done");
    } else {
      $(document).ready(function() {
        $("#manifest-label").html("Downloading new version of a file...");
      });
      console.glog("cache","got a progress event");
    }
  });
  //first time visited, application is now fully in cache 
  window.applicationCache.addEventListener("cached",function() {
    $(document).ready(function() {
      $("#modal-container,#manifest-progress").hide();
    });
    console.glog("cache","got a cached event");
  });
  //appcache update is done => reload the page!
  window.applicationCache.addEventListener("updateready",function() {
    $(document).ready(function() {
      $("#manifest-label").html("Download completed, reloading page...");
    });
    console.glog("cache","got a updateready event");
    location.reload();
  });
  //appcache has moved away, include it just for fun... (and the fact that proxies might fuck up and return a 404)
  window.applicationCache.addEventListener("obsolete",function() {
    $(document).ready(function() {
      $("#modal-container,#manifest-progress").hide();
    });
    console.glog("cache","got a obsolete event");
  });
}
