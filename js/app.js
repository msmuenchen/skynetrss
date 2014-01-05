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
});
