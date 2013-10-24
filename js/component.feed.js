//SkyRSS components: feed/feeditem

$(document).on("skyrss_feed_requestupdate",function(ev,a) {
  if(appstate.online==null) {
    setTimeout(arguments.callee.bind(this,ev,args),500);
    console.glog("view.library","waiting for online status");
    return;
  }
  console.glog("component.feed","got an update request for",a);
  if(appstate.online==false) {
    alert("can not reload a feed while offline!");
    return;
  }
  $(document).trigger("skyrss_feed_update_begin",a);
  doAPIRequest("update",{feed:a.feed,rescrape:true},function() {
    if(appstate.feed.id==a.feed)
      $(document).trigger("skyrss_view_feed",{args:appstate.feed.id,reload:true});
  },
  null,
  function() {
    $(document).trigger("skyrss_feed_update_done",a);
  });
});

$(document).on("skyrss_item_readstate_requestcommit",function(e,a) {
  console.glog("component.feeditem","got a readstate commit for",a);
  if(appstate.online==true)
    setItemReadstateServer(a);
  else
    setItemReadstateDB(a);
});

function setItemReadstateDB(a) {
  return;
}
function setItemReadstateServer(a) {
  var state=(a.read==true)?"read":"unread";
  if(a.item==0) {
    console.glog("component.feeditem","setting readstate of all feed items of",a.feed,"to read on server");
    doAPIRequest("markallasread",{feed:a.feed},function(data) {
      console.glog("component.feeditem","set readstate of all feed items of",a.feed,"to read on server");
      if(data.affected>0)
        $(document).trigger("skyrss_item_readstate_updated",a);
    });
  } else {
    console.glog("component.feeditem","setting readstate of",a.feed,"/",a.item,"to",state,"on server");
    doAPIRequest("setreadstate",{feed:a.feed,item:a.item,state:state},function(data) {
      console.glog("component.feeditem","set readstate of",a.feed,"/",a.item,"to",state,"on server");
      if(data.affected==1)
        $(document).trigger("skyrss_item_readstate_updated",a);
    });
  }
}

$(document).on("skyrss_feed_data_request",function(e,a) {
  console.glog("component.feed","got a data request for",a);
  if(appstate.online==true) {
    loadFeedFromServer(a);
  } else {
    alert("no feed loading in offline mode");
  }
});

function loadFeedFromServer(a) {
  var params={start:a.start,feed:a.feed,order:a.order,ignoreread:a.ignoreread,ignoreAPIException:true};
  console.glog("view.feed","requesting feed data from server for feed",a.id,"starting at",a.start);
  doAPIRequest("get",params,function(data) {
    console.glog("view.feed","data arrived from server");
    if(data.status!="ok") {
      if(data.type=="PermissionDeniedException") {
        alert(_("apierror_permissiondenied"));
      } else {
        alert(sprintf(_("apierror_other"),"get"));
      }
      return;
    }
    $(document).trigger("skyrss_feed_data_done",data);
  });
}
function loadFeedFromDB(id,start,len) {
}
