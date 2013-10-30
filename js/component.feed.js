//SkyRSS components: feed/feeditem

$(document).ready(function() {
  console.glog("component.feed","initializing");
  appstate.feedDB={};
  appstate.feedDB.ready=false;
  appstate.feedDB.supported=false;
  if(!Modernizr.indexeddb && !Modernizr.websqldatabase) {
    console.glog("component.feed","cannot store feed data offline");
    return;
  }
  appstate.feedDB.supported=true;
  $.indexedDB("skyrss",{
    version:2,
    schema:{
      1:function(t) {
        console.glog("component.feed","creating database");
        t.createObjectStore("feeds",{keyPath:"id"});
        t.createObjectStore("feeditems",{keyPath:["id","feed_id"]});
      },
      2:function(t) {
        console.glog("component.feed","creating lookup index for timestamp");
        var os=t.objectStore("feeditems");
        os.createIndex("idx_ts",["id","feed_id","time"]);
      },
    }
  }).done(function() {
    console.glog("component.feed","database opened");
    appstate.feedDB.ready=true;
  }).progress(function() {
    console.glog("component.feed","db open in progress");
  }).fail(function(err,e) {
    console.gerror("component.feed","db open failed:",err,e);
  });
});

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
    loadFeedFromDB(a);
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
    if(!appstate.feedDB.supported)
      return;
    if(!appstate.feedDB.ready) {
      console.gerror("component.feed","cannot insert data into DB, not opened yet");
      return;
    }
    var tp=$.indexedDB("skyrss").transaction("feeditems");
    tp.progress(function(t) {
      var os=t.objectStore("feeditems");
      data.items.forEach(function(e) {
        console.glog("component.feed","inserting item",e.id);
        var p=os.put(e);
        p.fail(function(a,b){
          console.gerror("component.feed","insert error",a,b);
        }).done(function(){
          console.glog("component.feed","insert done");
        });
      });
    }).fail(function(e) {
      console.gerror("component.feed","insert transaction failed",e);
    }).done(function() {
      console.glog("component.feed","insert txn done");
    });
  });
}
function loadFeedFromDB(a) {
  if(!appstate.feedDB.supported)
    return;
  //todo this sucks
  if(appstate.feedlist.loaded!=true) {
    setTimeout(arguments.callee.bind(this,ev,args),500);
    console.glog("component.feed","waiting for preconditions");
    return;
  }
  if(!appstate.feedDB.ready) {
    console.gerror("component.feed","cannot read from DB, not opened yet");
    return;
  }

//todo: implement paging, unread, sort, start, len
  console.glog("component.feed","requesting DB data for feed",a.feed);
  var tp=$.indexedDB("skyrss").transaction("feeditems");
  var ret=[];
  tp.progress(function(t) {
    var os=t.objectStore("feeditems");
    os.each(function(item) {
      if(item.value.feed_id!=a.feed)
        return;
      ret.push(item.value);
    });
  }).fail(function(e) {
    console.gerror("component.feed","read txn failed",e);
  }).done(function() {
    console.glog("component.feed","read txn done",ret);
    var fo=null;
    appstate.feedlist.object.items.forEach(function(e){
      if(e.id==a.feed)
        fo=e;
    });
    if(fo==null) {
      console.gerror("component.feed","unable to find feed object");
      return;
    }
    var retObj={
      items:ret,
      next:0,
      remain:0,
      total:ret.length,
      feed:fo,
    };
    console.log("retobj",retObj);
    $(document).trigger("skyrss_feed_data_done",retObj);
  });
}

