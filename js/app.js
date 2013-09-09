//Application state
var appstate={
  view:"index", /* the current view */
  feed:0, /* current feed id */
  pos:0, /* current feed item id */
  selected:0, /* current selected item */
  nextstart:0,
  requestCounter:0, /* keep track of AJAX requests */
  keyscope:0, /* state of the keypress-state-machine, 99: no input accepted */
}


//tell server to reload a specific feed from upstream server
//when the update is done, tell the app to reload the feed
function updateFeed(id) {
  $("#feed_update").attr("disabled","disabled");
  doAPIRequest("update",{feed:id,rescrape:true},function(data) { //success
    appstate.feed=0;
    $(window).hashchange();
  },
  null, //fail
  function() { //always
    $("#feed_update").removeAttr("disabled");
    loadFeedList(); //reload the feed list with new read-count
  });
}

//load a list of all feeds from server
function loadFeedList() {
  //remove all old feed items
  $("#feedlist .feed").remove();
  $("#feedlist li").hide();
  $("#feedlist .loading").show();
  
  //settings view
  $("#settings-feeds tbody").empty();
  
  $("#feedlist .nofeeds,#settings-feeds .nofeeds").hide();
  
  doAPIRequest("getfeeds",{feed:0},function(data) { //success
    $("#feedlist .loading").hide();
    if(data.items.length==0)
      $("#feedlist .nofeeds,#settings-feeds .nofeeds").show();
    data.items.forEach(function(e){
      if(e.icon=="")
        e.icon=appconfig.feedicon;
      var obj={
        id:e.id,
        unread:e.total-e.read,
        title:e.title,
        icon:e.icon,
        desc:e.desc,
      };
      if(e.read!=e.total)
        obj.liclass="hasunread ";
      else
        obj.liclass=" ";
      
      if(e.icon!="")
        obj.liclass+="hasicon ";
      
      //create the DOM objects for the feedlist entry  out of the template
      var el=$($("#tpl-feedlist").jqote(obj));
      el.appendTo($("#feedlist"));
      el.click(function() {
        location.hash="#feed/"+e.id+"/";
      });
      
      //settings
      var tr=$("<tr></tr>");
      $("<td></td>").html(e.id).appendTo(tr);
      var lnk=$("<a></a>").attr("href",e.url).html(e.url).attr("target","_blank");
      $("<td></td>").append(lnk).appendTo(tr);
      $("<td></td>").html(e.title).appendTo(tr);
      var lnk2=$("<button></button>").html(_("page_delete")).click(function() {
        doAPIRequest("unsubscribe",{feed:e.id},null, //success
        null, //fail
        loadFeedList //always
        );
      });
      $("<td></td>").append(lnk2).appendTo(tr);
      tr.appendTo($("#settings-feeds tbody"));
    });
    
    //update last-fetch timestamp
    var d=new Date(data.ts*1000);
    var ds=dateFormat(d,"dd.mm.yyyy HH:MM:ss");
    $("#flts").html(ds);
  });
}

//open a feed item in the list (pos: db id of the item)
function openFeedItem(pos, noScroll) {
  if(typeof noScroll=="undefined")
    noScroll=false;
  //clean up the old item(s) so that the DOM resources are free'd
  if(!noScroll)
    $(".feedline iframe").remove();
  var newfl=$("#fl-"+pos);
  
  var ifr=$("<iframe>");
  ifr.attr("src","about:blank");
  //Browsers like to set an implicit height on iframes (Chrome: 150px)
  //So set it to 0. Upon loading the content, it will automatically scale up again :)
  ifr.height(0);
  ifr.appendTo($(".fullText",newfl));
  
  if(!noScroll)
    $(".feedline.open").removeClass("open");
  newfl.addClass("open");
  
  newfl.data("noscroll",noScroll);
  
  //scroll so that the new-opened item is always at the top
  if($("#fl-"+pos).length>0 && !noScroll) {
    var fe=$("#feedentries");
    fe.css("padding-bottom",0);
    var md=getFeedItemMeasurements(newfl);
    if(md.scrollTop>md.maxScrollTop) {
      var d=md.scrollTop-md.maxScrollTop;
      var mfm=getFeedItemMeasurements($("#feedmore"));
      if(mfm.bottom<mfm.maxBottom) { //there's a difference between the bottom of feedmore and the height => less elements visible than the view is high => no scrolling possible
        d+=mfm.maxBottom-mfm.bottom;
      }
      fe.css("padding-bottom",d+"px");
    }
    $("#feedentries").scrollTop(md.scrollTop);
  }
  //actually populate the iframe we created earlier!
  ifr.attr("src","data:text/html;charset=utf-8,"+newfl.data("html"));
  $("#fl-"+pos+" .itemRead").attr("checked",false).change();
}

//get scroll-related measurement data for a feed item
function getFeedItemMeasurements(item) {
  var topOffset=0;
  var fe=$("#feedentries");
  
  //position().top is relative to the document!
  //"bottom" is ALSO relative to the top of #feedline!
  topOffset+=fe.position().top+parseInt(fe.css("marginTop"));
  //"top" is relative to the top of #feedline, i.e. the topmost element has a top of 0, if scrolled all up
  var top=item.position().top-topOffset;
  var bottom=top+item.outerHeight();
  //maxbottom is the maximum bottom that an element may have in order to be fully visible
  //so, e.g. if an element's bottom is bigger than maxBottom it is not fully visible
  var maxBottom=fe.height();
  
  var st=fe.scrollTop()+top;
  return {
    topOffset:topOffset,
    top:top,
    bottom:bottom,
    maxBottom:maxBottom,
    scrollTop:st,
    maxScrollTop:fe.get(0).scrollHeight-fe.height(),
  }
}
function isFeedItemVisible(item) {
  var md=getFeedItemMeasurements(item);
  return md.bottom<=md.maxBottom;
}
//load a new feed, or open an item of the current feed
function loadFeed(id,pos) {
  pos=pos||0;
  if(appstate.feed!=id) {
    console.log("appstate fid="+appstate.feed+", id="+id);
    $("#feedmenu, #feedentries").hide();
    $("#feed_href").removeAttr("href");
    $("#feed_title").html(_("page_loading"));
    $("#feedentries li.feedline").remove();
    $("#feedentries").css("padding-bottom",0);
    appstate.selected=0; //reset selector on feedchange
    loadFeedData(id,pos,0);
    $("#feedentries").scrollTop(0); //scroll to top
    console.log("scrolled to top");
  } else {
    console.log("appstate fid=id="+id);
    openFeedItem(pos);
    appstate.pos=pos;
    $("#feed_reload").removeAttr("disabled");
  }
}

//tell the backend that we read an item
function markAsRead(fid,pid,read) {
//return;
  if(read)
    var state="read";
  else
    var state="unread";
  if(pid==0)
    return;
  doAPIRequest("setreadstate",{feed:fid,item:pid,state:state},function(data) {
    console.log("updated readstate of "+fid+"/"+pid+" to "+state);
    if(appstate.feed==fid) { //it may be that we switched to another feed when the AJAX returns
      if(read)
        $("#fl-"+pid+" .title").removeClass("unread");
      else
        $("#fl-"+pid+" .title").addClass("unread");
    }
    if(data.affected==1) {
      var old=parseInt($("#fi-"+fid+" .unread_count").html());
      if(read)
        old--;
      else
        old++;
      $("#fi-"+fid+" .unread_count").html(old);
      if(old==0)
        $("#fi-"+fid).removeClass("hasunread");
    }
  });
}

//get the items of a feed and create the list entries
function loadFeedData(id,pos,start) {
  start=start||0;
  var params={start:start,feed:id,order:$("#feed_sort").val(),ignoreAPIException:true};
  if(!$("#feed_showread").is(":checked"))
    params.noshowread="";
  doAPIRequest("get",params,function(data) {
      
      if(data.status!="ok") {
        if(data.type=="PermissionDeniedException") {
          alert(_("apierror_permissiondenied"));
        } else {
          alert(sprintf(_("apierror_other"),"get"));
        }
        return;
      }
      $("#feedmenu,#feedentries").show();
      $("#feed_title").html(data.feed.title);
      if(data.feed.link!="")
        $("#feed_href").attr("href",data.feed.link);
      else
        $("#feed_href").attr("href","");
      
      $("#feed_total").html(data.total);
      
      var fd=new Date(data.feed.lastread*1000);
      var fds=dateFormat(fd,"dd.mm.yyyy HH:MM:ss");
      $("#feed_ts").html(fds);
      
      data.items.forEach(function(e) {
        var d=new Date(e.time*1000);
        var ds=dateFormat(d,"dd.mm.yyyy HH:MM:ss");
        //if we have scraped fulltext, use it instead
        if(e.scrape_fulltext && e.scrape_fulltext!="")
          e.fulltext=e.scrape_fulltext;
        
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
            location.hash="feed/"+id+"/";
          } else {
            location.hash="feed/"+id+"/"+e.id;
          }
        });
        el.attr("title",e.id);
        $(".share",el).click(function() {
          $("#share-container").show();
          $("#share-twitter").attr("href","https://twitter.com/intent/tweet?url="+encodeURIComponent(e.link));
          $("#share-fb").attr("href","https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(e.link));
        });
        
        //Set the initial state of the checkbox
        if(e.timestamp===null)
          $(".itemRead",el).attr("checked",true);
        else
          $(".itemRead",el).attr("checked",false);

        $(".itemRead",el).data("id",e.id).change(function() {
          var itemid=$(this).data("id");
          var v=$(this).is(":checked");
          markAsRead(appstate.feed,itemid,!v);
        });
        
        //Insert the element before the "Read more..." list entry
        $("#feedmore").before(el);
        
        //Inject a "base" tag to allow for relative links, if we have a link
        if(data.feed.link!="")
          e.fulltext='<base href="'+data.feed.link+'" />\n'+e.fulltext;
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
        $("#fl-"+e.id).data("html",encodeURIComponent(e.fulltext));
        /* Evil hack ends here */
        
        $("#feed_shown").html($(".feedline").length);
        
      });
      appstate.feed=id;
      appstate.pos=pos;
      if(data.next) {
        appstate.nextstart=data.next;
        $("#feedmore").removeClass().addClass("more");
      } else {
        appstate.nextstart=0;
        $("#feedmore").removeClass().addClass("nomore");
      }
      openFeedItem(pos);
    },
    null, //fail
    function() { //always
      $("#feed_reload").removeAttr("disabled");
    });
}

//add a new feed to the backend
function addFeed() {
  $("#addnewfeed").attr("disabled","disabled");
  var url=$("#newfeedurl").val();
  $("#discover-results").hide();
  doAPIRequest("discover",{url:url},function(data) { //success
    $("#discover-results").show();
    var tb=$("#discover-feedlist tbody").empty();
    data.feeds.forEach(function(e) {
      var tr=$("<tr></tr>").appendTo(tb);
      $("<td></td>").html(e.link).appendTo(tr);
      $("<td></td>").html(e.title).appendTo(tr);
      var btn=$("<button></button>").html(_("page_addfeed")).click(function() {
        var me=$(this);
        doAPIRequest("add",{feed:e.link,ignoreAPIException:true},function(data) { //success
          if(data.status!="ok") {
            if(data.type=="AlreadyPresentException") {
              location.hash="feed/"+data.id+"/";
            } else {
              alert(sprintf(_("apierror_other"),"add"));
            }
            return;
          }
          location.hash="feed/"+data.id+"/";
          updateFeed(data.id);
        },
        null, //fail
        function() { //always
          me.removeAttr("disabled");
        });
      });
      $("<td></td>)").append(btn).appendTo(tr);
    });
  },
  null, //fail
  function() { //always
    $("#addnewfeed").removeAttr("disabled");
  });
}


jQuery(document).ready(function($){
  //Event handler for the "Read more" in feedlist view
  $("#feedmore").click(function() {
    if(!$("#feedmore").hasClass("more"))
      return;
    $("#feedmore").removeClass().addClass("loading");
    loadFeedData(appstate.feed,appstate.pos,appstate.nextstart);
  });
  
  //Hash change handler for feedview
  $(window).bind("hashchange",function() {
    var h=location.hash;
    var f=/feed\/([0-9]*)\//.exec(h);
    if(!f) //we're not in feedview, let other handlers take a chance...
      return;
    appstate.view="feed";
    $(".view").hide();
    $("#feed").show();
    //position
    var p=/feed\/([0-9]*)\/([0-9]*)/.exec(h);
    if(!p) 
      loadFeed(f[1]);
    else
      loadFeed(f[1],p[2]);
  });
  
  //hash change handler for index view
  $(window).bind("hashchange",function() {
    var h=location.hash;
    var i=/index/.exec(h);
    if(!i) //we're not in indexview, let other handlers take a chance...
      return;
    $(".view").hide();
    $("#index").show();
    appstate.view="index";
  });
  
  //hash change handler for addnew or addgr view
  $(window).bind("hashchange",function() {
    var h=location.hash;
    var op=/op\/(.*)/.exec(h);
    if(!op) //we're not in feedview, let other handlers take a chance...
      return;
    console.log("op: "+op[1]);
    $(".view").hide();
    switch(op[1]) {
      case "addnew":
        $("#opaddnew").show();
        break;
      case "addgr":
        $("#opaddgr").show();
        break;
      case "login":
        $("#oplogin").show();
        break;
      case "logout":
        $("#oplogout").show();
        break;
      case "settings":
        $("#opsettings").show();
        break;
    }
    appstate.view=op[1];
  });
  
  //read the current hash (e.g. when tab-clicking around or reloading)
  $(window).hashchange();
  
  //these are handled externally, the spaghetti was too much
  $("#addnewfeed").click(addFeed);
  $("#importgrfile").click(importgrfile);
  
  //load the feed list
  loadFeedList();
  $("#feed_reload").click(function() {
    $(this).attr("disabled","disabled");
    appstate.feed=0; //force the feedhandler to reload the feed from the hash-supplied value. evil.
    $(window).hashchange();
  });
  
  //update the current feed
  $("#feed_update").click(function() {
    updateFeed(appstate.feed);
  });
  
  //reload the feedlist (and with it, the readcounts) every 10 minutes
  setInterval(loadFeedList,1000*60*10);
  
  //prevent selections
  $("body").disableSelection();
  
  //mark all as read
  $("#feed_allread").click(markallasread);
  
  //display read items change
  $("#feed_showread").change(function() {
    appstate.feed=0; //force the feedhandler to reload the feed from the hash-supplied value. evil.
    $(window).hashchange();
    $("#feed_showread").trigger('blur');
  });
  
  $("#feed_sort").change(function() {
    appstate.feed=0; //force the feedhandler to reload the feed from the hash-supplied value. evil.
    $(window).hashchange();
    $("#feed_sort").trigger('blur');
  });
  
  initLogin();
  
  $("#settings-accountbtn-save").click(function() {
    $("#settings-accountbtn-save").attr("disabled","disabled");
    var pwd=$("#setings-password").val();
    if(pwd=="") {
      alert(_("error_nopassgiven"));
      return;
    }
    doAPIRequest("changepwd",{password:pwd},null, //success
    null, //fail
    function() {
      $("#settings-accountbtn-save").removeAttr("disabled");
    });
  });
});

function initLogin() {
  doAPIRequest("getsession",{},function(data) {
    if(data.user) {
      $("#menu .loginshow").show();
      $(".username").html(data.user.name);
      if(data.user.source!="")
        $("#settingsform-account .passwordrow").hide();
      else
        $("#settingsform-account .passwordrow").show();
    } else {
      $("#menu .logoutshow").show();
    }
    console.log("session data");
    console.log(data);
  });
  $("#logout-btn").click(function() {
    $(this).attr("disabled","disabled");
    //stop all running AJAX requests
    APIRequestPool.forEach(function(e) {
      e.abort();
    });
    //remove feed items
    $("#feedentries li.feedline").remove();
    //remove potentially compromising information out of appstate
    appstate.feed=0;
    appstate.pos=0;
    appstate.nextstart=0;
    doAPIRequest("logout",{},function(data) {
      $("#menu .loginshow").hide();
      $("#menu .logoutshow").show();
      location.hash="op/login";
      loadFeedList();
    },
    null, //fail
    function() { //always
      $("#logout-btn").removeAttr("disabled");
    });
  });
  $("#login-btn").click(function() {
    $(this).attr("disabled","disabled");
    $("#login-error").hide();
    doAPIRequest("login",{username:$("#login-username").val(),password:$("#login-password").val()},function(data) {
      if(data.login!="ok") {
        console.log("login failed, message: "+data.msg);
        $("#login-error").show().html(data.msg);
        return;
      }
      $("#menu .loginshow").show();
      $("#menu .logoutshow").hide();
      $(".username").html(data.user.name);
      if(data.user.source!="")
        $("#settingsform-account .passwordrow").hide();
      else
        $("#settingsform-account .passwordrow").show();
      loadFeedList();
      location.hash="index";
    },
    null, //fail
    function() { //always
      $("#login-btn").removeAttr("disabled");
    });
  });
}

//mark all as read
function markallasread() {
  $("#feed_allread").attr("disabled","disabled");
  doAPIRequest("markallasread",{feed:appstate.feed},function(data) { //success
    console.log("marked all in "+appstate.feed+" as read");
    $(".feedline .title").removeClass("unread");
    $("#fi-"+appstate.feed+" .unread_count").html("0");
    $("#fi-"+appstate.feed).removeClass("hasunread");
  },
  null, //fail
  function() { //always
    $("#feed_allread").removeAttr("disabled");
  });
}

//event listener for messages from the feeditem-iframes
window.addEventListener('message', function(event) {
  //check if it's a mesage from us
  if(!event.data.type)
    return;
  if(event.data.type=="seth") {
    var pid=event.data.myId;
    var h=event.data.scrollHeight;
    var fl=$("#fl-"+pid);
    var fe=$("#feedentries");
    var st=fe.scrollTop(); //back up scrollTop, as the height change will reset it
    $("iframe",fl).height(h);
    console.log("adjusted height of "+pid+" to "+h);
    if(!fe.data("noscroll"))
      return;
    //now we got a height, adjust the padding (if possible)
    fe.css("padding-bottom",0);
    var md=getFeedItemMeasurements(fl);
    if(md.scrollTop>md.maxScrollTop) {
      var d=md.scrollTop-md.maxScrollTop;
      var mfm=getFeedItemMeasurements($("#feedmore"));
      if(mfm.bottom<mfm.maxBottom) { //there's a difference between the bottom of feedmore and the height => less elements visible than the view is high => no scrolling possible
        d+=mfm.maxBottom-mfm.bottom;
      }
      fe.css("padding-bottom",d+"px");
    }
    fe.scrollTop(st);
  } else if(event.data.type=="keypress") {
    var ve=jQuery.Event("keypress");
    ve.keyCode=event.data.ev.keyCode;
    ve.metaKey=event.data.ev.metaKey;
    ve.relayed=true;
    $(window).trigger(ve);
  }
},false);

jQuery(document).ready(function($){
  $("#share-close").click(function() {
    $("#share-container").hide();
  });
});

//handle escape-key-presses
$(window).keydown(function(e) {
  if(e.keyCode!=27) //escape
    return;
  if(!$("#share-container").is(":visible")) //check if the sharer modal is active
    return;
  $("#share-container").hide();
});

/* KEY PRESS HANDLERS */
//Reference: http://www.shortcutworld.com/en/web/Google-Reader.html
//Section 1: Space, arrow keys, PgUp/Dn, Home, End keys
$(window).keypress(function(e) {
  //don't capture keypresses in anything other than feedview
  if(appstate.view!="feed")
      return;

  //check if keycode is allowed at all
  if($.inArray(e.keyCode,[32,33,34,35,36,38,40])==-1)
    return;

  //prevent unvoluntary crap
  e.preventDefault();
  
  console.log("window got a keypress event:");
  console.log(e);
  //scroll delta
  var delta=$("#feedentries").height()/4;
  //current scrollTop
  var current=$("#feedentries").scrollTop();
  //maximum scrollTop
  var maxScroll=$("#feedentries")[0].scrollHeight-$("#feedentries").height();
  //new scrollTop (we centralize the scroll later)
  var newScroll=current;
  
  if(e.keyCode==32 && e.metaKey==false) { //space = next element
    if(appstate.pos!=0 && !$("#fl-"+appstate.pos).length) {
      //this happens when the current element is not present (e.g. on the next page)
      appstate.pos=0;
    }
    if(appstate.pos==0) {
      var n=$(".feedline").first();
      var c=$("#feedentries");
    } else {
      var n=$("#fl-"+appstate.pos).next();
      var c=$("#fl-"+appstate.pos);
    }
    console.log("next is ");
    console.log(n);
    if(!isFeedItemVisible(c)) { //current element is not fully visible, just scroll down
      console.log("current element is not fully visible");
      newScroll+=delta;
    } else { //current element is fully visible, open the next element
      var nId=n.attr("id");
      console.log(nId);
      console.log("next item is "+nId);
      if(nId=="feedmore") {
        if($("#feedmore").hasClass("more")) //more items available => click
          $("#feedmore").click();
      } else {
        var r=/fl-([0-9]*)/.exec(nId);
        location.hash="feed/"+appstate.feed+"/"+r[1];
      }
      return;
    }
  } else if((e.keyCode==40||e.keyCode==34) && e.relayed) { //arrowkeys, if relayed then accept it
    if(e.keyCode==34)
      delta*=2; //pgdn doubles scrollheight
    newScroll+=delta;
  } else if((e.keyCode==38||e.keyCode==33) && e.relayed) { //arrowkeys, if relayed then accept it
    if(e.keyCode==33)
      delta*=2; //pgdn doubles scrollheight
    newScroll-=delta;
  } else if(e.keyCode==36 && e.relayed) { //pos1, scroll to top
    newScroll=0;
  } else if(e.keyCode==35 && e.relayed) { //end, scroll to bottom
    newScroll=maxScroll;
  }
  if(newScroll>maxScroll)
    newScroll=maxScroll;
  if(newScroll<0)
    newScroll=0;
  console.log("delta "+delta+" current "+current+" new "+newScroll);
  $("#feedentries").scrollTop(newScroll);
});

//Section 2: Feed item navigation
/*
j/k open next/previous item
n/p select next/previous item but dont open it
o/<return> open/close selected item
1 open all
2 close all
*/
$(window).keypress(function(e) {
  if(appstate.view!="feed")
    return;
  
  //check if we're not allowed to react on keypresses
  //e.g. while entering comments, tags etc
  if(appstate.keyscope==99)
    return;
  //check if keycode is allowed at all
  if($.inArray(e.keyCode,[13,49,50,106,107,110,111,112])==-1)
    return;
  
  //no meta-key (alt,ctrl, etc) combos
  if(e.metaKey)
    return;
  
  //prevent unvoluntary crap
  e.preventDefault();
  
  switch(e.keyCode) {
    case 110: //n
      if(appstate.selected==0) {
        var n=$(".feedline").first();
        var c=n;
      } else {
        var n=$("#fl-"+appstate.selected).next();
        var c=$("#fl-"+appstate.selected);
      }
      console.log("next");
      console.log(c);
      console.log(n);
      var nId=n.attr("id");
      if(nId=="feedmore")
        return;
      var r=/fl-([0-9]*)/.exec(nId);
      appstate.selected=r[1];
      c.removeClass("selected");
      n.addClass("selected");
    break;
    case 112: //p
      if(appstate.selected==0) {
        var n=$(".feedline").first();
        var c=n;
      } else {
        var n=$("#fl-"+appstate.selected).prev();
        var c=$("#fl-"+appstate.selected);
      }
      if(n.length!=1)
        return;
      var nId=n.attr("id");
      var r=/fl-([0-9]*)/.exec(nId);
      appstate.selected=r[1];
      c.removeClass("selected");
      n.addClass("selected");
    break;
    case 111: //o
    case 13: //<return>
      var c=$("#fl-"+appstate.selected);
      var cId=c.attr("id");
      var r=/fl-([0-9]*)/.exec(cId);
      if(c.hasClass("open")) //collapse
        location.hash="feed/"+appstate.feed+"/";
      else
        location.hash="feed/"+appstate.feed+"/"+r[1];
    break;
    case 49: //1
      $(".feedline").each(function(e) {
        var cId=$(this).attr("id");
        var r=/fl-([0-9]*)/.exec(cId);
        openFeedItem(r[1],true);
      });
    break;
    case 50: //2
      location.hash="feed/"+appstate.feed+"/";
    break;
    case 106: //j
      if(appstate.pos!=0 && !$("#fl-"+appstate.pos).length) {
        appstate.pos=0;
      }
      if(appstate.pos==0) {
        var n=$(".feedline").first();
      } else {
        var n=$("#fl-"+appstate.pos).next();
      }
      var nId=n.attr("id");
      if(nId=="feedmore")
        return;
      var r=/fl-([0-9]*)/.exec(nId);
      location.hash="feed/"+appstate.feed+"/"+r[1];
    break;
    case 107: //k
      if(appstate.pos!=0 && !$("#fl-"+appstate.pos).length) {
        appstate.pos=0;
      }
      if(appstate.pos==0) {
        var n=$(".feedline").first();
      } else {
        var n=$("#fl-"+appstate.pos).prev();
      }
      if(n.length!=1)
        return;
      var nId=n.attr("id");
      var r=/fl-([0-9]*)/.exec(nId);
      location.hash="feed/"+appstate.feed+"/"+r[1];
    break;
  }
});
