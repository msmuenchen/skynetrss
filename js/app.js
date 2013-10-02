//Application state
var appstate={
  view:"index", /* the current view */
  feed:0, /* current feed id */
  pos:0, /* current feed item id */
  selected:0, /* current selected item */
  nextstart:0,
  requestCounter:0, /* keep track of AJAX requests */
  keyscope:0, /* state of the keypress-state-machine, 99: no input accepted */
  feedlist:[],
  haveSession:false,
  haveFeedlist:false,
  mobile:false, //split between menu view and other views
  lastView:"", //last view when switching to menu view (to allow back-switching when resizing to desktop)
}

var userSettings={};
var defaultSettings={};

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
    appstate.feedlist=data.items;
    appstate.haveFeedlist=true;
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
    var ds=dateFormat(d,_("page_tsformat"));
    $("#flts").html(ds);
  });
}

//open a feed item in the list (pos: db id of the item)
function openFeedItem(pos, noScroll) {
  if(typeof noScroll=="undefined")
    noScroll=false;

  var newfl=$("#fl-"+pos);
  if(newfl.hasClass("open")) //nothing to do here
    return;
  
  //clean up the old item(s) so that the DOM resources are free'd
  if(!noScroll)
    $(".feedline iframe").remove();
  
  
  if(!noScroll)
    $(".feedline.open").removeClass("open");
  newfl.addClass("open");
  
  if(newfl.length!=1)
    return;
  
  if(!noScroll) {
    if(userSettings.jumponopen && userSettings.jumponopen==1)
      $("#feedentries").scrollTo(newfl);
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
//load a new feed, or open an item of the current feed
function loadFeed(id,pos) {
  pos=pos||0;
  if(appstate.feed!=id) {
    console.log("appstate fid="+appstate.feed+", id="+id);
    $("#feed_href").removeAttr("href");
    $("#feed_title").html(_("page_loading"));
    $("#feedentries").scrollTop(0); //scroll to top
//    debugger;
    $("#feedentries li.feedline").remove();
    $("#feedmenu, #feedentries, #feedfooter").hide();
    appstate.selected=0; //reset selector on feedchange
    var i=setInterval(function() {
      if(!appstate.haveSession || !appstate.haveFeedlist) {
        console.log("waiting for session and feedlist");
        return;
      }
      clearInterval(i);
      loadFeedData(id,pos,0);
    },500);
    appstate.feed=id;
    appstate.pos=pos;
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
  $("#feed_addfrompreview").parent().show();
  appstate.feedlist.forEach(function(e) {
    if(e.id==id)
      $("#feed_addfrompreview").parent().hide();
  });
  $("#feedmore").addClass("loading"); //prevent infinite-scroll from loading
  doAPIRequest("get",params,function(data) {
      if(data.status!="ok") {
        if(data.type=="PermissionDeniedException") {
          alert(_("apierror_permissiondenied"));
        } else {
          alert(sprintf(_("apierror_other"),"get"));
        }
        return;
      }
      if(data.feed.id!=appstate.feed) {
        console.gerror("feed_get","discarding data of feed",data.feed.id,", active feed is",appstate.feed);
        return;
      }
      $("#feedmenu, #feedentries, #feedfooter").show();
      $("#feed_title").html(data.feed.title);
      if(data.feed.link!="")
        $("#feed_href").attr("href",data.feed.link);
      else
        $("#feed_href").attr("href","");
      
      $("#feed_total").html(data.total);
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
      var fd=new Date(data.feed.lastread*1000);
      var fds=dateFormat(fd,_("page_tsformat"));
      $("#feed_ts").html(fds);
      
      data.items.forEach(function(e) {
        var d=new Date(e.time*1000);
        var ds=dateFormat(d,_("page_tsformat"));
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
            $("iframe",el).remove();
            location.hash="feed/"+id+"/";
          } else {
            location.hash="feed/"+id+"/"+e.id;
          }
        });
        el.attr("title",e.id);
        $(".share",el).click(function() {
          $("#modal-container").show();
          $("#share-content").show().focus();
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
        
        //Inject custom stylesheet
        var ss="<style>";
        var ff=$("#settings-display-font option[data-fn='"+userSettings["font"]+"']");
        if(ff.length==1)
          ff=ff.data("fallback");
        else
          ff="";
        
        ss+="body {\
          font-family:'"+userSettings["font"]+"'"+ff+";\
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
        appstate.nextstart=data.next;
        $("#feedmore").removeClass().addClass("more");
      } else {
        appstate.nextstart=0;
        $("#feedmore").removeClass().addClass("nomore");
      }
      openFeedItem(pos);
      $("#feedentries").scroll();
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

$(document).ready(function() {
  $("#feedentries").scroll(function() {
    if(userSettings.infinitescroll && userSettings.infinitescroll!=1)
      return;
    if(!isFeedItemVisible($("#feedmore"))) {
      return;
    }    
    if($("#feedmore").hasClass("more")) {//more items available => click
      console.glog("scroll","loading next batch of feeditems");
      $("#feedmore").click();
    } else {
      console.glog("scroll","no more feeditems or already loading");
    }
  });
});

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
    $("#index-news .news").remove();
    $("#index-news-status").show().html(_("page_loading"));
    
    //we likely dont have settings at the moment...
    var it=setInterval(function() {
      if(appstate.haveSession==true) {
        clearInterval(it);
      } else {
        console.glog("getnews","waiting for session/language");
        return;
      }
      var p={};
      if(userSettings.language)
        p.lang=userSettings.language;
      else
        p.lang=i18n._lang;
      doAPIRequest("news",p,function(data) {
        $("#index-news-status").hide();
        data.items.forEach(function(e) {
          var tpl=$($("#tpl-newsitem").jqote(e)).appendTo($("#index-news"));
        });
      },
      function() {
        $("#index-news-status").html(_("page_error"));
      });
    },500);
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

//update the state of the settings elements according to the current settings
function updateSettingsElements() {
  $("#settingsform-display input").each(function() {
    var e=$(this);
    var k=e.data("key");
    switch(e.attr("type")) {
      case "checkbox":
        if(userSettings[k]==1)
          e.attr("checked",true);
        else
          e.attr("checked",false);
      break;
    }
    e.change();
  });
  $("#settingsform-display select").each(function() {
    var e=$(this);
    var k=e.data("key");
    $("option",e).each(function() {
      var o=$(this);
      if(userSettings[k]==o.val())
        o.attr("selected",true);
    });
    e.change();
  });
}

$(document).ready(function() {
  var lc=$("#settings-display-language").empty();

  i18n._langs.forEach(function(e) {
    var el=$("<option></option>").val(e.key).html(e.name).appendTo(lc);
    console.glog("lang","iterating",e.key,i18n._lang)
    if(e.key==i18n._lang) {
      el.attr("selected",true);
      console.glog("lang","selected language",e.key);
    }
  });
  
  lc.change(function() {
    xlateChangeLang($(this).val());
  });
  
  var fc=$("#settings-display-font").empty();
  appconfig.fonts.forEach(function(e) {
    var og=$("<optgroup></optgroup>").attr("label",e.title).appendTo(fc);
    e.elements.forEach(function(f) {
      var fo=$("<option></option>").appendTo(og);
      fo.attr("data-fn",f);//use attr so CSS selectors can pick it up
      fo.data("fallback",e.fallback);
      fo.html(f).val(f);	
    });
  });
});

function loadSession() {
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
    $.extend(defaultSettings,data.default_settings);
    $.extend(userSettings,defaultSettings);
    $.extend(userSettings,data.user_settings);
    updateSettingsElements();
    appstate.haveSession=true;
  });
}

function initLogin() {
  loadSession();
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
    userSettings=defaultSettings;
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
      loadSession()
      loadFeedList();
      location.hash="index";
    },
    null, //fail
    function() { //always
      $("#login-btn").removeAttr("disabled");
    });
  });
  $("#createaccount-btn").click(function() {
    $(this).attr("disabled","disabled");
    $("#login-error").hide();
    doAPIRequest("createaccount",{username:$("#login-username").val(),password:$("#login-password").val()},function(data) {
      if(data.login!="ok") {
        console.log("login failed, message: "+data.msg);
        $("#login-error").show().html(data.msg);
        return;
      }
      loadSession();
      loadFeedList();
      location.hash="welcome";
    },
    null, //fail
    function() { //always
      $("#createaccount-btn").removeAttr("disabled");
    });
  });
  $("#settings-display-save").click(function(ev) {
    ev.preventDefault();
    var sobj={};
    $("#settingsform-display input").each(function() {
      var e=$(this);
      var k=e.data("key");
      switch(e.attr("type")) {
        case "checkbox":
          if(e.is(":checked"))
            sobj[k]=1;
          else
            sobj[k]=0;
        break;
      }
    });
    $("#settingsform-display select").each(function() {
      var e=$(this);
      var k=e.data("key");
      sobj[k]=e.val();
    });
    $.extend(userSettings,sobj);
    console.log("saving settings");
    console.log(sobj);
    $("#settings-display-save").attr("disabled","disabled");
    doAPIRequest("updatesettings",sobj,null, //success
    null, //fail
    function() { //always
      $("#settings-display-save").removeAttr("disabled");
    }
    );
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
    $("iframe",fl).height(h);
    console.log("adjusted height of "+pid+" to "+h);
    $("#feedentries").scroll();
  } else if(event.data.type=="keypress") {
    var ve=jQuery.Event("keypress");
    ve.keyCode=event.data.ev.keyCode;
    ve.metaKey=event.data.ev.metaKey;
    ve.relayed=true;
    $(window).trigger(ve);
  } else if(event.data.type=="keydown") {
    var ve=jQuery.Event("keydown");
    ve.keyCode=event.data.ev.keyCode;
    ve.metaKey=event.data.ev.metaKey;
    ve.relayed=true;
    $(window).trigger(ve);
  }
},false);

jQuery(document).ready(function($){
  $(".modal-close").click(function() {
    $("#modal-container").hide(); //hide the overlay
    $(this).parent().hide(); //and hide the container the button belongs to
    appstate.keyscope=0;
  });
});

//handle escape-key-presses
$(window).keydown(function(e) {
  if(e.keyCode!=27) //escape
    return;
  if(appstate.keyscope!=99) //only react on share-window
    return;
  
  if(!$("#share-content").is(":visible")) //check if the sharer modal is active
    return;
  $("#share-content,#modal-container").hide();
  appstate.keyscope=0;
});

/* KEY PRESS HANDLERS */
//Reference: http://www.shortcutworld.com/en/web/Google-Reader.html
//Section 1: Space, arrow keys, PgUp/Dn, Home, End keys
//Use keydown here, see http://stackoverflow.com/a/2218915/1933738
$(window).keydown(function(e) {
  //don't capture keypresses in anything other than feedview
  if(appstate.view!="feed")
      return;

  //check if keycode is allowed at all
  if($.inArray(e.keyCode,[32,33,34,35,36,38,40])==-1)
    return;
  
  //check if we're not allowed to react on keypresses
  //e.g. while entering comments, tags etc
  if(appstate.keyscope==99)
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
    
    var c=$("#fl-"+appstate.pos);
    if(appstate.pos==0) {
      var n=$(".feedline").first();
    } else {
      var n=$("#fl-"+appstate.pos).next();
    }
    if(c.length==1 && !isFeedItemVisible(c)) { //current element is not fully visible, just scroll down
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
  } else if(e.keyCode==40||e.keyCode==34) {
    if(e.keyCode==34)
      delta*=2; //pgdn doubles scrollheight
    newScroll+=delta;
  } else if(e.keyCode==38||e.keyCode==33) {
    if(e.keyCode==33)
      delta*=2; //pgdn doubles scrollheight
    newScroll-=delta;
  } else if(e.keyCode==36) { //pos1, scroll to top
    newScroll=0;
  } else if(e.keyCode==35) { //end, scroll to bottom
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
      $("#feedentries").scrollTo(n);
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
      $("#feedentries").scrollTo(n);
    break;
    case 111: //o
    case 13: //<return>
      if(appstate.selected==0) {
        var c=$("#fl-"+appstate.pos);
        if(c.length!=1)
          return;
      } else
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
      $(".feedline.open").removeClass("open");
      $(".feedline iframe").remove();
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

//section 3: item actions
//v: open in new background tab
//m: toggle read/unread
//s: share (this DIFFERS from google reader!!)
$(window).keypress(function(e) {
  if(appstate.view!="feed")
    return;
  
  //check if we're not allowed to react on keypresses
  //e.g. while entering comments, tags etc
  if(appstate.keyscope==99)
    return;
  //check if keycode is allowed at all
  if($.inArray(e.keyCode,[109,115,118])==-1)
    return;
  
  //no meta-key (alt,ctrl, etc) combos
  if(e.metaKey)
    return;
  
  //prevent unvoluntary crap
  e.preventDefault();

  //get the current item
  var c=$("#fl-"+appstate.pos);
  if(!c.length) //make sure that an item is open!
    return;

  switch(e.keyCode) {
    case 118: //v
      var l=$(".fullLink",c); //get the link element
      if(!l.length)
        return;
      if(l.attr("href")=="")
        return;
      //Open in background tab by firing a middle-click (http://stackoverflow.com/a/11389138/1933738)
      var evt = document.createEvent("MouseEvents");
      //the tenth parameter of initMouseEvent sets ctrl key
      evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0,
                                  true, false, false, false, 0, null);
      l.get(0).dispatchEvent(evt);
    break;
    case 109: //m
      var cb=$(".itemRead",c);
      cb.toggleCheckbox(); //toggle and fire the change event
    break;
    case 115: //s
      var btn=$(".share",c);
      btn.click();
      appstate.keyscope=99; //prevent firing of other handlers
    break;
  }
  console.log(e.keyCode+" "+e.metaKey);
});

//Feed library
jQuery(document).ready(function($){
  //Hash change handler for library
  $(window).bind("hashchange",function() {
    var h=location.hash;
    var f=/library/.exec(h);
    if(!f) //we're not in library view, let other handlers take a chance...
      return;
    appstate.view="library";
    $(".view").hide();
    $("#library").show();
    $("#library-content").empty().append($("<h2></h2>").html(_("page_loading")));
    doAPIRequest("library",{},function(data) {
      var c=$("#library-content").empty();
      for(tag in data.tags) {
        var e=data.tags[tag];
        var t=_("tag_"+tag);
        var blktpl=$($("#tpl-libblock").jqote({title:t})).appendTo(c);
        console.log(blktpl);
        var tbl=$("table",blktpl);
        console.log(tbl);
        e.forEach(function(f) {
          var tr=$($("#tpl-libentry").jqote({title:f.title,desc:f.desc})).appendTo(tbl);
          console.log(tr);
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
  });
});

//bark on Internet Explorer, no version can use data: URIs for iframe src
//see also http://msdn.microsoft.com/en-us/library/cc848897%28v=vs.85%29.aspx
//bark on Safari for Windows, it can't do CSS3 calc()
//http://www.basicthinking.de/blog/2012/07/26/safari-fur-windows-hat-apple-den-browser-still-und-heimlich-zuruckgezogen/
jQuery(document).ready(function($){
  var n=navigator.appName || "";
  var v=navigator.vendor || "";
  var u=navigator.userAgent || "";
  
  var r=/MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(u)
  if(r && parseFloat(r[1])<10)
    $("#modal-container,#ie-warning").show();
  
  r=/apple computer/.exec(v.toLowerCase())
  if(r && navigator.platform && navigator.platform.toLowerCase()=="win32")
    $("#modal-container,#safariwin-warning").show();
});

//Welcome screen
jQuery(document).ready(function($){
  //Hash change handler for library
  $(window).bind("hashchange",function() {
    var h=location.hash;
    var f=/welcome/.exec(h);
    if(!f) //we're not in welcome view, let other handlers take a chance...
      return;
    appstate.view="library";
    $(".view").hide();
    $("#welcome").show();
  });
});

$(document).ready(function() {
  $(".dropdown-container").dropdown();
});


//mobify hashchange
$(document).ready(function() {
  $(window).bind("hashchange",function(e) {
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
    console.glog("mobify","hashchange from",appstate.lastView,"to",h,"oldhash",oldHash);
    if(!r) {
      if(appconfig.mobile==true) {
        appstate.lastView=oldHash;
        $("#content").show();
        $("#menu").hide();
      }
      return;
    }

    if(appconfig.mobile==true) {
      appstate.lastView=oldHash;
      $("#content").hide();
      $("#menu").show();
    } else {
      location.hash=oldHash;
    }
  });
});

$(document).ready(function() {
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
    if(appconfig.mobile==false) {
      console.glog("mobify","was in desktop, still in desktop");
      return;
    }
    console.glog("mobify","switching from mobile to desktop");
    console.glog("mobify","current hash",location.hash);
    if(location.hash=="#menu") {
      console.glog("mobify","old location",appstate.lastView);
      location.hash=appstate.lastView;
    }
    appconfig.mobile=false;
    $("#content,#menu").show();
  } else {
    if(appconfig.mobile==true) {
      console.glog("mobify","was in mobile, still in mobile");
      return;
    }
    console.glog("mobify","switching from desktop to mobile");
    $("#content").show();
    $("#menu").hide();
    appconfig.mobile=true;
      $(window).hashchange(); //check if current hash is menu...
  }
}).resize();
});
jQuery(document).ready(function($){
  //read the current hash (e.g. when tab-clicking around or reloading)
  $(window).hashchange();
});
