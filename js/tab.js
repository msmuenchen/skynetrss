//skyrss tabs

jQuery(document).ready(function($){
  var tabs={};
  console.glog("tabs","initializing");
  $(".tabheader").each(function() {
    var e=$(this);
    //get tab group
    var classes=e.attr("class").split(" ");
    var tg=null;
    classes.forEach(function(c) {
      var r=/tabgroup-(.*)/.exec(c);
      if(r && r[1])
        tg=r[1];
    });
    if(tg===null) {
      console.gerror("tabs","tab has no group attached",e);
      return;
    }
    //get tab key
    var tk=null;
    classes.forEach(function(c) {
      var r=/tab-(.*)/.exec(c);
      if(r && r[1])
        tk=r[1];
    });
    if(tk===null) {
      console.gerror("tabs","tab has no key",e);
    }
    console.glog("tabs","tab header found",e,tg,tk);
    
    if(!tabs[tg]) {
      tabs[tg]={
        hdrs:{},
        tabs:{},
      }
    }
    tabs[tg].hdrs[tk]=e;
    var tc=$(".tab.tab-"+tk);
    if(!tc.length) {
      console.gerror("tabs","tab has header, but no client",e,tc);
      return;
    }
    tabs[tg].tabs[tk]=tc;
    e.click(function() {
      console.glog("tabs","clicked on",e);
      for(t in tabs[tg].tabs) {
        t=tabs[tg].tabs[t];
        t.removeClass("active");
        console.glog("tabs",t);
      }
      console.glog("tabs","showing",tc);
      tc.addClass("active");
    });
  });
  console.glog("tabs",tabs);
});
