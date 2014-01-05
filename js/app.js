//SkyRSS "leftover file"
//This file contains JS crap that no one cares about / in development / doesnt fit anywhere with a bit of sense

function saveFeedList() {
return;
  var f_addrec=function(top,l) {
    console.glog("saveFeedList","entering recursive for",top,"level",l);
    var el=$("#sfd-"+top);
    var a={
      id:top,
      label:el.data("label"),
      children:[],
      feeds:[],
      order:0,
    };
    var childNodes=$(".dir[data-parent='"+top+"']","#settings-feeds tbody");
    if(childNodes.length>0) {
      var i=0;
      childNodes.each(function() {
        var c=f_addrec($(this).data("id"),l+1);
        c.order=i++;
        a.children.push(c);
      });
    }
    var childFeeds=$(".feed","#settings-feeds tbody").filterByData("dir",top);
    if(childFeeds.length>0) {
      var i=0;
      childFeeds.each(function() {
        var e=$(this);
        if(e.hasClass("ui-draggable-helper")) {
          console.glog("saveFeedList","discarding cloned helper");
          return;
        }
        var o={
          id:e.data("id"),
          order:i++,
          label:e.data("title"),
        };
        a.feeds.push(o);
      });
    }
    return a;
  };
  var dirtree=f_addrec(0,0);
  console.glog("saveFeedList","tree is",dirtree);
  doAPIRequest("savefeedlist",{tree:JSON.stringify(dirtree)},
  null,//success
  null,//fail
  loadFeedList);
}

$(document).ready(function(){
  //prevent selections
  $("body").disableSelection();
  $("#poolinfo").click(function() {
    console.glog("api","dumping API request pool");
    APIRequestPool.forEach(function(e) {
      console.glog("api",e._url,e.readyState);
    });
  });

//http://stackoverflow.com/a/14325681/2362837
//don't display the iframe overlay on non-touch devices
//as it's only there to enable touch scrolling
// Webkit detection script
Modernizr.addTest('webkit', function(){
  return RegExp(" AppleWebKit").test(navigator.userAgent);
});

// Mobile Webkit
Modernizr.addTest('mobile', function(){
  //Test for "Android" too, see e.g. Galaxy Tab:
  //"Mozilla/5.0 (Linux; U; Android 4.1.2; de-de; GT-P3110 Build/JZO54K) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30"
  var t1=RegExp(" Mobile").test(navigator.userAgent);
  var t2=RegExp(" Android").test(navigator.userAgent);
  return t1 || t2;
});
