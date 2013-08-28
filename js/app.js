//Application state
var appstate={
  view:"index", /* the current view */
  feed:0, /* current feed id */
  pos:0, /* current feed item id */
  nextstart:0,
  requestCounter:0, /* keep track of AJAX requests */
}

//Config (TODO: generate in PHP, export I18n here...)
var appconfig= {
  feedicon:"assets/feed-icon-28x28.png",
  apiurl:"api.php",
  i18n: {
    apierror_confirm:"API-Anfrage %s fehlgeschlagen, erneut versuchen?",
  },
}

//Provide API requests with centralized error handling to simplify code
//and support retrying of requests
function doAPIRequest(target,params,success,fail,always) {
  var logstr="";
  var queryUrl=appconfig.apiurl+"?action="+target;
  var reqId=appstate.requestCounter++;
  for(var key in params) {
    logstr+=key+"="+params[key]+",";
    queryUrl+="&"+key+"="+encodeURIComponent(params[key]);
  }
  logstr=logstr.substring(0,logstr.length-1);
  console.log("Submitting request to API "+target+" ("+logstr+") with ID "+reqId+", raw query is "+queryUrl);
  $.getJSON(queryUrl).
    done(function(data) {
      console.log("Request #"+reqId+" to API "+target+" ("+logstr+") returned OK on network level, data object is:");
      console.log(data);
      if(!data.status || data.status!="ok") {
        if(!data.message)
          data.message="";
        console.error("Request #"+reqId+" to API "+target+" ("+logstr+") returned error on API level: '"+data.message+"'");
        //See if the user wants to retry, don't fail silently
        if(confirm(sprintf(appconfig.i18n.apierror_confirm,target)))
          doAPIRequest(target,params,success,fail,always);
        else {
          if(typeof(fail)=="function") {
            console.log("Calling the 'fail' handler of API request #"+reqId);
            fail();
          }
        }
        return;
      }
      if(typeof(success)=="function") {
        console.log("Calling the 'success' handler of API request #"+reqId);
        success(data);
      }
    }).
    fail(function() {
      console.error("Request #"+reqId+" to API "+target+" ("+logstr+") failed on network level");
      if(confirm(sprintf(appconfig.i18n.apierror_confirm,target))) {
        doAPIRequest(target,params,success,fail,always);
        return; //the request may succeed on retry, so return and do not fire the supplied fail-handler
      }
      if(typeof(fail)=="function") {
        console.log("Calling the 'fail' handler of API request #"+reqId);
        fail();
      }
    }).
    always(function() {
      if(typeof(always)=="function") {
        console.log("Calling the 'always' handler of API request #"+reqId);
        always();
      }
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
    $("#fl-"+pid+" iframe").height(h);
  } else if(event.data.type=="keypress") {
    var ve=jQuery.Event("keypress");
    ve.keyCode=event.data.ev.keyCode;
    ve.metaKey=event.data.ev.metaKey;
    ve.relayed=true;
    $(window).trigger(ve);
  }
},false);

//tell server to reload a specific feed from upstream server
//when the update is done, tell the app to reload the feed
function updateFeed(id) {
  $("#feed_update").attr("disabled","disabled");
  doAPIRequest("update",{feed:id},function(data) { //success
    appstate.feed=0;
    $(window).hashchange();
  },
  null, //fail
  function() { //always
    $("#feed_update").removeAttr("disabled");
  });
}

//load a list of all feeds from server
function loadFeedList() {
  doAPIRequest("getfeeds",{feed:0},function(data) { //success
    //remove all old feed items
    $("#feedlist .feed").remove();
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
    });
    
    //update last-fetch timestamp
    var d=new Date(data.ts*1000);
    var ds=dateFormat(d,"dd.mm.yyyy HH:MM:ss");
    $("#flts").html(ds);
  });
}

//open a feed item in the list (pos: db id of the item)
function openFeedItem(pos) {
  //clean up the old item(s) so that the DOM resources are free'd
  $(".feedline iframe").remove();
  var ifr=$("<iframe>");
  ifr.attr("src","about:blank");
  //Browsers like to set an implicit height on iframes (Chrome: 150px)
  //So set it to 0. Upon loading the content, it will automatically scale up again :)
  ifr.height(0);
  ifr.appendTo($("#fl-"+pos+" .fullText"));
  $(".feedline.open").removeClass("open");
  $("#fl-"+pos).addClass("open");
  if($("#fl-"+pos).length>0)
      $("#feedentries").scrollTo($("#fl-"+pos));
  //actually populate the iframe we created earlier!
  ifr.attr("src","data:text/html;charset=utf-8,"+$("#fl-"+pos).data("html"));
  $("#fl-"+pos+" .itemRead").attr("checked",false).change();
}
 
//load a new feed, or open an item of the current feed
function loadFeed(id,pos) {
  pos=pos||0;
  if(appstate.feed!=id) {
    console.log("appstate fid="+appstate.feed+", id="+id);
    $("#feedtitle").html("Lade...");
    $("#feedentries li.feedline").remove();
    loadFeedData(id,pos,0);
  } else {
    console.log("appstate fid=id="+id);
    openFeedItem(pos);
    appstate.pos=pos;
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
  var params={start:start,feed:id,order:$("#feed_sort").val()};
  if(!$("#feed_showread").is(":checked"))
    params.noshowread="";
  doAPIRequest("get",params,function(data) {
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
            location.hash="feed/"+id+"/"+e.id;
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
    });
}

//add a new feed to the backend
function addFeed() {
  $("#addnewfeed").attr("disabled","disabled");
  var url=$("#newfeedurl").val();
  console.log("loading feed "+url);
  doAPIRequest("add",{feed:url},function(data) { //success
    console.log("added feed");
    console.log(data);
    location.hash="feed/"+data.id;
    updateFeed(data.id);
    loadFeedList();
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
});

//mark all as read
function markallasread() {
  doAPIRequest("markallasread",{feed:appstate.feed},function(data) { //success
    console.log("marked all in "+appstate.feed+" as read");
    $(".feedline .title").removeClass("unread");
    $("#fi-"+appstate.feed+" .unread_count").html("0");
    $("#fi-"+appstate.feed).removeClass("hasunread");
  });
}

//import a google reader takeout OPML file
function importgrfile() {
  //  http://stackoverflow.com/a/4006992
  // AJAX-send a file...
  function shipOff(event) {
    var result = event.target.result;
    var fileName = $("#grfile").get(0).files[0].name;
    $("#importgrfile").attr("disabled","disabled");
    $.post(appconfig.apiurl+'?action=importgr&feed=0', { data: result, name: fileName }, function(data) {
      if(data.status!="ok") {
        $("#grresult").html($("#grresult").html()+"Fehler in importGR(): "+data.message);
        $("#importgrfile").removeAttr("disabled");
        return;
      }
      if(data.invalid!=0) {
        $("#grresult").html($("#grresult").html()+data.message);
        $("#importgrfile").removeAttr("disabled");
        return;
      }
      var total=data.feeds.length;
      var remaining=total;
      $("#grcounter").show();
      $("#grcounter_total").html(total);
      $("#grcounter_cur").html(remaining);
      $("#grresult").html($("#grresult").html()+total+" Feeds in OPML gefunden\n");
      data.feeds.forEach(function(e) {
        doAPIRequest("add",{feed:e},function(data2) {
          remaining--;
          $("#grcounter_cur").html(total-remaining);
          if(remaining<=0)
            $("#importgrfile").removeAttr("disabled");
          if(data2.status!="ok") {
            if(data2.type=="AlreadyPresentException")
              return;
            var m=data2.type;
            if(data2.type!="XMLParseException")
              m+="\n"+data2.message;
            $("#grresult").html($("#grresult").html()+"Fehler in addFeed("+e+"): "+m+"\n");
          }
        });
      });
    });
  }
  $("#grresult").html("Übertrage OPML zur Auswertung\n");
  var file = $("#grfile").get(0).files[0];
  var reader = new FileReader();
  reader.readAsText(file, 'UTF-8');
  reader.onload = shipOff;
}

//handle key presses. for now, we're just interested in the space key
$(window).keypress(function(e) {
  console.log("keypress");
  console.log(e);
  if(e.keyCode==32 && e.metaKey==false) { //space = next element
    if(appstate.view!="feed")
      return;
    console.log("got a space at "+appstate.pos);
    if(appstate.pos!=0 && !$("#fl-"+appstate.pos).length) {
      //this happens when the current element is not present (e.g. on the next page)
      appstate.pos=0;
    }
    if(appstate.pos==0) {
      var n=$(".feedline").first();
    } else {
      var n=$("#fl-"+appstate.pos).next();
      //check if we have to scroll, or to go next element
      var top=$("#fl-"+appstate.pos).position().top-$("#feedentries").position().top;
      var bottom=top+$("#fl-"+appstate.pos).outerHeight();
      if(bottom>$("#feedentries").height()-$("#feedmore").outerHeight()) {
        $("#feedentries").scrollTop($("#feedentries").scrollTop()+$("#feedentries").height()/4);
        return;
      }
    }
    var nId=n.attr("id");
    e.preventDefault();
    if(nId=="feedmore") {
      if(!$("#feedmore").hasClass("more"))
        return;
      $("#feedmore").click();
    } else {
      var r=/fl-([0-9]*)/.exec(nId);
      location.hash="feed/"+appstate.feed+"/"+r[1];
    }
  } else if((e.keyCode==40||e.keyCode==34) && e.relayed) { //arrowkeys, if relayed then accept it
    var delta=$("#feedentries").height()/4;
    if(e.keyCode==34)
      delta*=2; //pgdn doubles scrollheight
    var current=$("#feedentries").scrollTop();
    var max=$("#feedentries")[0].scrollHeight-$("#feedentries").height();
    var n=current+delta;
    if(n>max)
      n=max;
    $("#feedentries").scrollTop(n);
  } else if((e.keyCode==38||e.keyCode==33) && e.relayed) { //arrowkeys, if relayed then accept it
    var delta=$("#feedentries").height()/4;
    if(e.keyCode==33)
      delta*=2; //pgdn doubles scrollheight
    var current=$("#feedentries").scrollTop();
    var n=current-delta;
    if(n<0)
        n=0;
    $("#feedentries").scrollTop(n);
  } else if(e.keyCode==36 && e.relayed) { //pos1, scroll to top
    $("#feedentries").scrollTop(0);
  } else if(e.keyCode==35 && e.relayed) { //end, scroll to bottom
    var max=$("#feedentries")[0].scrollHeight-$("#feedentries").height();
    $("#feedentries").scrollTop(max);
  }
});
