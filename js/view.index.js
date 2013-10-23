//SkyRSS view: "index"

$(document).on("skyrss_view_index",function() {
  if(appstate.online==null) {
    setTimeout(arguments.callee,500);
    console.glog("view.index","waiting for online status");
    return;
  }
  console.glog("view.index","loading index view");
  $("#index").show();
  $("#index-news-status,#index-mostrecent-status").show().html(_("page_loading"));

  appstate.news={};
  appstate.news.loaded=false;
  appstate.news.object={};
  appstate.snacks={};
  appstate.snacks.loaded=false;
  appstate.snacks.object={};

  if(appstate.online==true) {
    (function () {
      if(!appstate.settings.loaded) {
        setTimeout(arguments.callee,500);
        console.glog("view.index","waiting for settings");
        return;
      }
      loadSnacksFromServer();
      loadNewsFromServer();
    })();
  } else {
    loadSnacksFromLSO();
    loadNewsFromLSO();
  }
});

function loadSnacksFromServer() {
  console.glog("view.index","loading snacks from server");
  doAPIRequest("getsnacks",{},function(data) {
    console.glog("view.index","got snacks from server",data);
    appstate.snacks.object=data;
    appstate.snacks.loaded=true;
    if(!Modernizr.localstorage || !window.localStorage) {
      console.gerror("view.index","cannot store snacks in LSO, no support!");
    } else {
      window.localStorage["skyrss.snacks"]=JSON.stringify(data);
    }
    $(document).trigger("skyrss_snacks_load");
  },function() {
    $("#index-mostrecent-status").html(_("page_error"));
  });
}
function loadSnacksFromLSO() {
  console.glog("view.index","loading snacks from LSO");
  if(!Modernizr.localstorage || !window.localStorage) {
    console.gerror("view.index","cannot load offline, no support for LSO");
    return;
  }
  var lso=window.localStorage["skyrss.snacks"];
  if(!lso) {
    console.gerror("view.index","cannot load offline, LSO got deleted or never created?");
    return;
  }
  appstate.snacks.object=JSON.parse(lso);
  appstate.snacks.loaded=true;
  $(document).trigger("skyrss_snacks_load");
}
function loadNewsFromServer() {
  console.glog("view.index","loading news from server");
  var p={lang:(appstate.settings.user.language)?appstate.settings.user.language:i18n._lang};
  doAPIRequest("getnews",p,function(data) {
    console.glog("view.index","got news from server",data);
    appstate.news.object=data;
    appstate.news.loaded=true;
    if(!Modernizr.localstorage || !window.localStorage) {
      console.gerror("view.index","cannot store news in LSO, no support!");
    } else {
      window.localStorage["skyrss.news"]=JSON.stringify(data);
    }
    $(document).trigger("skyrss_news_load");
  },function() {
    $("#index-news-status").html(_("page_error"));
  });
}
function loadNewsFromLSO() {
  console.glog("view.index","loading news from LSO");
  if(!Modernizr.localstorage || !window.localStorage) {
    console.gerror("view.index","cannot load offline, no support for LSO");
    return;
  }
  var lso=window.localStorage["skyrss.news"];
  if(!lso) {
    console.gerror("view.index","cannot load offline, LSO got deleted or never created?");
    return;
  }
  appstate.news.object=JSON.parse(lso);
  appstate.news.loaded=true;
  $(document).trigger("skyrss_news_load");
}
$(document).on("skyrss_snacks_load",function() {
  var data=appstate.snacks.object;
  console.glog("view.index","inserting snacks",data);
  $("#index-mostrecent .feed").remove();
  $("#index-mostrecent-status").hide();
  data.feeds.forEach(function(e) {
    var tpl=$($("#tpl-snackblock").jqote(e)).appendTo($("#index-mostrecent"));
    tpl.click(function(ev) {
      ev.stopPropagation();
      location.hash="feed/"+e.id+"/";
    });
    var c=$(".content",tpl);
    e.items.forEach(function(e2) {
      var tpl2=$($("#tpl-snackitem").jqote(e2)).appendTo(c);
      if(appstate.settings.user.showsnacks!=1)
        $(".text",tpl2).hide();
      tpl2.click(function(ev) {
        ev.stopPropagation();
        location.hash="feed/"+e.id+"/"+e2.id+"/";
      });
    });
  });
});
$(document).on("skyrss_news_load",function() {
  var data=appstate.news.object;
  console.glog("view.index","inserting news",data);
  $("#index-news-status").hide();
  $("#index-news .news").remove();
  data.items.forEach(function(e) {
    var tpl=$($("#tpl-newsitem").jqote(e)).appendTo($("#index-news"));
  });
});
