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
  var dbScheme="v5";
  if(!localStorage["skyrss.idbscheme"] || localStorage["skyrss.idbscheme"]!=dbScheme) {
    console.gwarn("component.feed","wiping database");
    $.indexedDB("skyrss").deleteDatabase().done(function(){
      localStorage["skyrss.idbscheme"]=dbScheme;
      location.reload();
    });
  } else {
    console.glog("component.feed","DB scheme current at",dbScheme,", proceeding to open");
    IDBInit();
  }
});

function IDBInit() {
  console.glog("component.feed::IDBInit","initializing database");
  $.indexedDB("skyrss",{
    version:1,
    schema:{
      1:function(t) {
        console.glog("component.feed::IDBInit","creating database");
        t.createObjectStore("feeds",{keyPath:"id"});
        t.createObjectStore("feeditems",{keyPath:["feed_id","id"]});
        var os=t.objectStore("feeditems");
        os.createIndex(["feed_id","id","time"],"idx_ts");
        os.createIndex("feed_id","idx_feedid");
      },
    }
  }).done(function() {
    console.glog("component.feed::IDBInit","database opened");
    appstate.feedDB.ready=true;
  }).progress(function() {
    console.glog("component.feed::IDBInit","db open in progress");
  }).fail(function(err,e) {
    console.gerror("component.feed::IDBInit","db open failed:",err,e);
  });
}

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

$(document).on("skyrss_item_starstate_requestcommit",function(e,a) {
  console.glog("component.feeditem","got a starstate commit for",a);
  if(appstate.online==true)
    setItemStarstateServer(a);
  else
    setItemStarstateDB(a);
});

function setItemStarstateDB(a) {
  return;
}
function setItemStarstateServer(a) {
  var state=(a.read==true)?"read":"unread";
  console.glog("component.feeditem","setting starstate of",a.feed,"/",a.item,"to",state,"on server");
  doAPIRequest("setstarstate",{feed:a.feed,item:a.item,state:state},function(data) {
    console.glog("component.feeditem","set starstate of",a.feed,"/",a.item,"to",state,"on server");
    if(data.affected==1)
      $(document).trigger("skyrss_item_starstate_updated",a);
  });
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
  if(appstate.feedlist.loaded!=true || appstate.feedDB.ready!=true) {
    setTimeout(arguments.callee.bind(this),500);
    console.glog("component.feed","waiting for preconditions");
    return;
  }

//todo: implement paging, unread, sort, start, len
  console.glog("component.feed","requesting DB data for feed",a.feed);
  var tp=$.indexedDB("skyrss").transaction(["feeditems","feeds"]);
  var ret=[];
  tp.progress(function(t) {
    var os_feeds=t.objectStore("feeds");
    var os_items=t.objectStore("feeditems");
    var idx=os_feeds.index("idx_feedid");
    //get all items of this feed
    var retItems=[];
    var rp_items=idx.each(function(item) {
      retItems.push(item);
    },IDBKeyRange.only(a.feed));
    //get the feed item
    var rp_feed=os_feeds.get(IDBKeyRange.only(a.feed));
    $.when(rp_feed,rp_items).done(function(a_feed,a_items){
      console.gerror("component.feed::loadFromDB","both requests returned",a_feed,a_items);
    }).fail(function(a,b,c,d) {
      console.gerror("component.feed::loadFromDB","one db request failed",a,b,c,d);
    });
    
  }).fail(function(e) {
    console.gerror("component.feed","read txn failed",e);
  }).done(function() {
/*
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
    */
  });
}

//persist feedlist into the IDB
//yes, this is double storage and stupid
//todo make the events flow like
//res_request => online => load, when loaded fire res_done and res_persist
//               offline => load, when loaded fire res_done
$(document).on("skyrss_feedlist_load",function() {
  if(!appstate.feedDB.supported)
    return;
  if(appstate.feedDB.ready!=true) {
    setTimeout(arguments.callee.bind(this),5000);
    console.glog("component.feed::onFeedlistLoad","waiting for preconditions");
    return;
  }
  var tp=$.indexedDB("skyrss").transaction("feeds");
  var data=appstate.feedlist.object.items;
  console.glog("component.feed::onFeedlistLoad","inserting feed list into database",data);
  tp.progress(function(t) {
    var os=t.objectStore("feeds");
    data.forEach(function(e) {
      os.put(e);
    });
  }).fail(function(e) {
    console.gerror("component.feed::onFeedlistLoad","feedlist insert txn failed");
  });
});
