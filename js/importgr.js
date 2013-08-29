//code for the importgr view

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
