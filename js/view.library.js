//SkyRSS view: "library"

$(document).on("skyrss_view_library",function() {
  if(appstate.online==null) {
    setTimeout(arguments.callee,500);
    console.glog("view.library","waiting for online status");
    return;
  }
  console.glog("view.library","loading library view");
  $("#library").show();
  $("#library-content").empty().append($("<h2></h2>").html(_("page_loading")));
  
  appstate.library={};
  appstate.library.loaded=false;
  appstate.library.object={};
  
  if(appstate.online==true) {
    loadLibraryFromServer();
  } else {
    loadLibraryFromLSO();
  }
});

function loadLibraryFromServer() {
  console.glog("view.library","loading library from server");
  doAPIRequest("library",{},function(data) {
    console.glog("view.library","got library from server",data);
    appstate.library.object=data;
    appstate.library.loaded=true;
    if(!Modernizr.localstorage || !window.localStorage) {
      console.gerror("view.library","cannot store library in LSO, no support!");
    } else {
      window.localStorage["skyrss.library"]=JSON.stringify(data);
    }
    $(document).trigger("skyrss_library_load");
  },function() {
    $("#library-content h2").html(_("page_error"));
  });
}
function loadLibraryFromLSO() {
  console.glog("view.library","loading library from LSO");
  if(!Modernizr.localstorage || !window.localStorage) {
    console.gerror("view.library","cannot load offline, no support for LSO");
    return;
  }
  var lso=window.localStorage["skyrss.library"];
  if(!lso) {
    console.gerror("view.library","cannot load offline, LSO got deleted or never created?");
    return;
  }
  appstate.library.object=JSON.parse(lso);
  appstate.library.loaded=true;
  $(document).trigger("skyrss_library_load");
}

$(document).on("skyrss_library_load",function() {
  var data=appstate.library.object;
  console.glog("view.library","inserting library",data);
  var c=$("#library-content").empty();
  for(tag in data.tags) {
    var e=data.tags[tag];
    var t=_("tag_"+tag);
    var blktpl=$($("#tpl-libblock").jqote({title:t})).appendTo(c);
    var tbl=$("table",blktpl);
    e.forEach(function(f) {
      var tr=$($("#tpl-libentry").jqote({title:f.title,desc:f.desc})).appendTo(tbl);
      $("button.preview",tr).click(function() {
        location.hash="feed/"+f.id+"/";
      });
      $("button.addfeed",tr).click(function() {
        doAPIRequest("add",{feed:f.url,ignoreAPIException:true},function(data) { //success
          if(data.status!="ok") {
            if(data.type=="AlreadyPresentException") {
              //do nothing
              return;
            } else {
              alert(sprintf(_("apierror_other"),"add"));
            }
            return;
          }
          loadFeedList();
        });
      });
    });
  }
  xlateAll();
});
