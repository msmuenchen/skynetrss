//SkyRSS view: "feed"

$(document).ready(function() {
  console.glog("view.feed","initializing");
  appstate.feed={};
  appstate.feed.id=0;
  appstate.feed.pos=0;
  appstate.feed.selected=0; //the highlighted item
  appstate.feed.next=0;
});

$(document).on("skyrss_view_feed",function(ev,args) {
  if(appstate.online==null) {
    setTimeout(arguments.callee.bind(this,ev,args),500);
    console.glog("view.library","waiting for online status");
    return;
  }
  if(appstate.online==false && !Modernizr.indexeddb) {
    alert("can not use indexeddb, no offline reading of feeds!");
    return;
  }
  console.glog("view.feed","loading feed view, data",ev,args);
  $("#feed").show();
  var r=/^([\d]+)(?:\/([\d]+))?(?:\/)?$/.exec(args.args);
  if(!r) {
    console.gerror("view.feed","invalid hash parameters");
    return;
  }
  var nf=r[1];
  var np=r[2]||0;
  var cf=appstate.feed.id;
  var cp=appstate.feed.pos;
  appstate.feed.id=nf;
  appstate.feed.pos=np;
  console.gerror("view.feed","requested feed",nf,"with position",np);
  if(cf!=nf) {
    console.glog("view.feed","feed change from",cf,"to",nf,":",np);
    $("#feedmore").removeClass().addClass("loading"); //prevent infinite-scroll from loading
    $("#feed_href").removeAttr("href");
    $("#feed_title").html(_("page_loading"));
    $("#feedentries").scrollTop(0); //scroll to top
    $("#feedentries li.feedline").remove();
    $("#feedmenu, #feedentries, #feedfooter").hide();
    appstate.feed.selected=0;
    appstate.feed.next=0;
    if(appstate.online==true) {
      loadFeedFromServer(nf,appstate.feed.next,0);
    } else {
      alert("no feed loading in offline mode");
    }
  } else {
    console.glog("view.feed","feed still",cf);
    if(cp!=np) {
      console.glog("view.feed","pos change from",cp,"to",np);
      openFeedItem(np);
    } else {
      $("#feed_reload").removeAttr("disabled");
    }
  }

});

function loadFeedFromServer(id,start,len) {
  start=start||0;
  var params={start:start,feed:id,order:$("#feed_sort").val(),ignoreAPIException:true};
  console.glog("view.feed","requesting feed data from server for feed",id,"starting at",start);
  /*
  $("#feed_addfrompreview").parent().show();
  appstate.feedlist.forEach(function(e) {
    if(e.id==id)
      $("#feed_addfrompreview").parent().hide();
  });
  */
  $("#feedmore").removeClass().addClass("loading"); //prevent infinite-scroll from loading
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
    if(data.feed.id!=appstate.feed.id) {
      console.gerror("view.feed","discarding data of feed",data.feed.id,", active feed is",appstate.feed.id);
      return;
    }
    $(document).trigger("skyrss_feed_data",data);
  });
}
function loadFeedFromDB(id,start,len) {
}
$(document).on("skyrss_feed_data",function(ev,data) {
  console.glog("view.feed","inserting",data);
  $("#feedmenu, #feedentries, #feedfooter").show();
  $("#feed_title").html(data.feed.title);
  if(data.feed.link!="")
    $("#feed_href").attr("href",data.feed.link);
  else
    $("#feed_href").attr("href","");
  
  $("#feed_total").html(data.total);
/*
  $("#feed_addfrompreview").click(function() {
    $(this).attr("disabled",true);
    doAPIRequest("add",{feed:data.feed.url,ignoreAPIException:true},function(data) { //success
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
      $("#feed_reload").click();
    },
    null,
    function() {
      $("#feed_addfrompreview").removeAttr("disabled");
    });
  });
*/
  var fd=new Date(data.feed.lastread*1000);
  var fds=dateFormat(fd,_("page_tsformat"));
  $("#feed_ts").html(fds);
  
  data.items.forEach(function(e) {
    var d=new Date(e.time*1000);
    var ds=dateFormat(d,_("page_tsformat"));
    //if we have scraped fulltext, use it instead
    if(e.scrape_fulltext && e.scrape_fulltext!="")
      e.fulltext=e.scrape_fulltext;
    
    if($("#fl-"+e.id).length!=0) {
      console.gerror("loadFeedData","discarding already present item",e.id);
      return;
    }
    
    var obj={
      id:e.id,
      title:e.title,
      date:ds,
      href:e.link,
      fulltext:e.fulltext,
      author:e.author,
    };
    if(e.timestamp===null)
      obj.titleclass="unread";
    else
      obj.titleclass="";
    
    var el=$($("#tpl-feedline").jqote(obj));
    $(".topRow",el).click(function(){
      if(el.hasClass("open")) {
        el.removeClass("open");
        $("iframe",el).remove();
        location.hash="feed/"+data.feed.id;
      } else {
        location.hash="feed/"+data.feed.id+"/"+e.id;
      }
    });
    el.attr("title",e.id);
    $(".share",el).click(function() {
      var extUrl=appconfig.base+appconfig.exturl+"?f="+data.feed.id+"&i="+e.id;
      $("#modal-container").show();
      $("#share-content").show().focus();
      $("#share-twitter").attr("href","https://twitter.com/intent/tweet?url="+encodeURIComponent(extUrl));
      $("#share-fb").attr("href","https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(extUrl));
    });
    
    //Set the initial state of the checkbox
    if(e.timestamp===null)
      $(".itemRead",el).attr("checked",true);
    else
      $(".itemRead",el).attr("checked",false);

    $(".itemRead",el).change(function() {
      var v=$(this).is(":checked");
      $(document).trigger("skyrss_item_readstate",{feed:data.feed.id,item:e.id,read:!v});
    });
    
    //Insert the element before the "Read more..." list entry
    $("#feedmore").before(el);
    
    //Inject a "base" tag to allow for relative links, if we have a link
    if(data.feed.link!="")
      e.fulltext='<base href="'+data.feed.link+'" />\n'+e.fulltext;
    
    //Inject custom stylesheet
    var ss="<style>";
    var ff=$("#settings-display-font option[data-fn='"+appstate.settings.user.font+"']");
    if(ff.length==1)
      ff=ff.data("fallback");
    else
      ff="";
    
    ss+="body {\
      font-family:'"+appstate.settings.user.font+"'"+ff+";\
    }",
    ss+="</style>";
    e.fulltext=ss+e.fulltext;
    
    /*
    Evil hack. To provide XSS protection, create an iframe node.
    Then, inject a script which posts a message to our window (lol, this is not covered by same-origin-policy)
    which tells us the "inner" height of the content, so we can properly set the iframe's height to avoid
    double scrollbars.
    The content is supplied as a data-URL... which sets the source frame URL/protocol to NULL and so
    provides the SOP protection. Also, it protects "our" DOM from being polluted with not properly closed tags and other bullsh*t.
    The iframe is created and the content is set at opening-time above in the code.
    */
    var sc="<scr"+"ipt type=\"text/javascript\">\n";
    sc+="var theId="+e.id+";";
    sc+=$("#inject-height").html();
    sc+="</scr"+"ipt>\n";
    e.fulltext+=sc;
    $("#fl-"+e.id).data("html",e.fulltext);
    /* Evil hack ends here */
    
    $("#feed_shown").html($(".feedline").length);
    
  });
  if(data.next) {
    appstate.feed.next=data.next;
    $("#feedmore").removeClass().addClass("more");
  } else {
    appstate.feed.next=0;
    $("#feedmore").removeClass().addClass("nomore");
  }
  $("#feedentries").scroll();
});

//open a feed item in the list (pos: db id of the item)
//noscroll: used by open-all, don't scroll anywhere and don't remove old iframes
function openFeedItem(pos, noScroll) {
  if(typeof noScroll=="undefined")
    noScroll=false;

  var newfl=$("#fl-"+pos);
  if(newfl.hasClass("open")) //nothing to do here
    return;
  
  var oldPos=newfl.position();
  var oldTop=0;
  if(oldPos && oldPos.top)
    oldTop=oldPos.top;
    
  //clean up the old item(s) so that the DOM resources are free'd
  if(!noScroll)
    $(".feedline iframe").remove();
    
  if(!noScroll)
    $(".feedline.open").removeClass("open");
  newfl.addClass("open");
  
  if(newfl.length!=1)
    return;
  
  if(!noScroll) {
    if(appstate.settings.user.jumponopen && appstate.settings.user.jumponopen==1)
      $("#feedentries").scrollTo(newfl);
    else {
      var newTop=newfl.position().top;
      if(oldTop!=newTop) { //new element was below old opened element
        var delta=Math.abs(oldTop)+Math.abs(newTop);
        var cSt=$("#feedentries").scrollTop();
        var nSt=cSt-delta;
        $("#feedentries").scrollTop(nSt);
        console.glog("openFeedItem","old top",oldTop,"newTop",newTop,"delta",delta,"cSt",cSt,"delta",delta,"nSt",nSt);
      }
    }
  }

  var ifr=$("<iframe>");
  //Browsers like to set an implicit height on iframes (Chrome: 150px)
  //So set it to 0. Upon loading the content, it will automatically scale up again :)
  ifr.height(0);
  ifr.appendTo($(".fullText",newfl));
  //ifr.attr("src","data:text/html;charset=utf-8,"+encodeURIComponent(newfl.data("html")));
  ifr.attr("seamless",true).attr("sandbox","allow-forms allow-scripts allow-popups");
  srcDoc.set(ifr.get()[0],newfl.data("html"));
  $("#fl-"+pos+" .itemRead").attr("checked",false).change();
}

function isFeedItemVisible(item) {
  var t=item.position().top;
  var b=t+item.outerHeight();
  var mB=$("#feedentries").outerHeight();
  return b<=mB;
}
$(document).on("skyrss_item_readstate",function(e,a) {
  console.glog("component.feeditem","got a readstate change event for",a);
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
  if(a.item==0)
    return;
  console.glog("component.feeditem","setting readstate of",a.feed,"/",a.item,"to",state,"on server");
  doAPIRequest("setreadstate",{feed:a.feed,item:a.item,state:state},function(data) {
    console.glog("component.feeditem","set readstate of",a.feed,"/",a.item,"to",state,"on server");
    if(data.affected==1)
      $(document).trigger("skyrss_item_readstate_update",a);
  });
}

$(document).on("skyrss_item_readstate_update",function(e,a) {
  console.glog("view.feed","got a readstate_update event for",a);
  var old=parseInt($("#fi-"+a.feed+" .unread_count").html());
  if(a.read) {
    if(appstate.feed.id==a.feed)
      $("#fl-"+a.item+" .title").removeClass("unread");
    old--;
  } else {
    if(appstate.feed.id==a.feed)
      $("#fl-"+a.item+" .title").addClass("unread");
    old++;
  }
  $("#fi-"+a.feed+" .unread_count").html(old);
  if(old==0)
    $("#fi-"+a.feed).removeClass("hasunread");
});